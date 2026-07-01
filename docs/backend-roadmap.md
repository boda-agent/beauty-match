# Finda — Backend Roadmap

**Tech Stack:**
- NestJS (TypeScript)
- Prisma ORM + PostgreSQL
- Socket.IO (WebSocket — чат)
- JWT (access + refresh tokens)
- Cloudinary (файлы/фото)
- Swagger (автодокументация API)

---

## 1. Архитектура проекта

```
finda-backend/
├── prisma/
│   ├── schema.prisma          # модели БД
│   └── migrations/
├── src/
│   ├── main.ts                # точка входа
│   ├── app.module.ts          # корневой модуль
│   ├── config/                # env, конфиги
│   ├── common/                # guards, decorators, filters, pipes
│   │   ├── guards/
│   │   ├── decorators/
│   │   └── filters/
│   ├── modules/
│   │   ├── auth/              # регистрация, логин, refresh
│   │   ├── users/             # CRUD пользователей
│   │   ├── masters/           # профили мастеров, услуги, портфолио
│   │   ├── catalog/           # поиск и фильтрация мастеров
│   │   ├── chat/              # WebSocket + REST истории
│   │   ├── invitations/       # приглашения мастеров
│   │   ├── admin/             # модерация, управление
│   │   ├── notifications/     # push-уведомления
│   │   └── upload/            # Cloudinary интеграция
│   └── websocket/             # Socket.IO адаптер
├── test/
├── .env
└── package.json
```

Каждый модуль следует структуре NestJS:
```
module/
├── dto/               # входные данные (валидация)
├── entities/          # выходные данные (response)
├── {name}.module.ts
├── {name}.controller.ts
├── {name}.service.ts
└── {name}.gateway.ts  # (только для WebSocket модулей)
```

---

## 2. База данных (Prisma)

### Модели

```prisma
enum UserRole {
  CLIENT
  MASTER
  ADMIN
}

enum MasterStatus {
  PENDING
  APPROVED
  BLOCKED
}

enum InvitationStatus {
  NEW
  CONTACTED
  REGISTERED
  REJECTED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         UserRole  @default(CLIENT)
  name         String
  phone        String?
  avatar       String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  masterProfile   MasterProfile?
  sentMessages    Message[]
  chats           ChatParticipant[]
  invitations     Invitation[]      @relation("InvitedBy")
}

model MasterProfile {
  id              String       @id @default(uuid())
  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  description     String?
  city            String
  countryOfOrigin String
  languages       String[]     // ["русский", "türkçe", "english"]
  gender          String?      // male | female
  minPrice        Float?
  isVerified      Boolean      @default(false)
  status          MasterStatus @default(PENDING)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  services   Service[]
  portfolio  PortfolioImage[]
}

model Service {
  id          String   @id @default(uuid())
  masterId    String
  master      MasterProfile @relation(fields: [masterId], references: [id], onDelete: Cascade)
  name        String
  price       Float
  description String?
  createdAt   DateTime @default(now())

  @@index([masterId])
}

model PortfolioImage {
  id        String   @id @default(uuid())
  masterId  String
  master    MasterProfile @relation(fields: [masterId], references: [id], onDelete: Cascade)
  imageUrl  String
  createdAt DateTime @default(now())

  @@index([masterId])
}

model Chat {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  participants ChatParticipant[]
  messages     Message[]
}

model ChatParticipant {
  chatId String
  chat   Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([chatId, userId])
}

model Message {
  id        String   @id @default(uuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId  String
  sender    User     @relation(fields: [senderId], references: [id])
  text      String
  createdAt DateTime @default(now())

  @@index([chatId, createdAt])
}

model Invitation {
  id            String            @id @default(uuid())
  masterName    String
  instagram     String?
  whatsapp      String?
  city          String
  comment       String?
  invitedById   String
  invitedBy     User              @relation("InvitedBy", fields: [invitedById], references: [id])
  status        InvitationStatus  @default(NEW)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([status])
}
```

---

## 3. API Endpoints

### Auth
| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/auth/register` | Регистрация (client / master) |
| POST | `/api/auth/login` | Логин → JWT pair |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Текущий пользователь |

### Catalog (публичные)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/masters` | Список мастеров (с фильтрацией) |
| GET | `/api/masters/:id` | Профиль мастера (публичный) |

**Query params для GET /api/masters:**
- `service` — по названию услуги
- `city` — город
- `language` — язык
- `country` — страна происхождения
- `gender` — male/female
- `verified` — true/false
- `page`, `limit` — пагинация

### Master Profile (только MASTER)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/master/profile` | Мой профиль |
| PATCH | `/api/master/profile` | Обновить профиль |
| POST | `/api/master/services` | Добавить услугу |
| PATCH | `/api/master/services/:id` | Редактировать услугу |
| DELETE | `/api/master/services/:id` | Удалить услугу |
| POST | `/api/master/portfolio` | Добавить фото |
| DELETE | `/api/master/portfolio/:id` | Удалить фото |

### Chat
| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/chats` | Список чатов текущего пользователя |
| GET | `/api/chats/:id/messages` | История сообщений чата |
| POST | `/api/chats/:id/read` | Отметить как прочитанное |

**WebSocket (Socket.IO):**
- `connection` — авторизация через JWT в handshake
- `chat:join` — подключиться к комнате чата
- `chat:send` — отправить сообщение
- `chat:message` — получить новое сообщение (event от сервера)
- `chat:typing` — печатает...

### Invitations
| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/invitations` | Создать приглашение (любой пользователь) |
| GET | `/api/invitations` | Мои приглашения |

### Admin (только ADMIN)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/admin/masters` | Все мастера со статусами |
| PATCH | `/api/admin/masters/:id/status` | Approve / Block мастера |
| GET | `/api/admin/invitations` | Все приглашения (таблица) |
| PATCH | `/api/admin/invitations/:id/status` | Изменить статус приглашения |

### Upload
| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/upload` | Загрузить файл → Cloudinary URL |

---

## 4. Аутентификация и роли

- **JWT Strategy** — access token (15 мин) + refresh token (7 дней, httpOnly cookie или body)
- **Guards:**
  - `JwtAuthGuard` — проверка access token
  - `RolesGuard` — проверка роли (CLIENT, MASTER, ADMIN)
- **Master approval flow:**
  - Регистрация как мастер → `status: PENDING`
  - Админ одобряет → `status: APPROVED`
  - Только APPROVED мастера видны в каталоге

---

## 5. Файлы (Cloudinary)

- Фото портфолио загружаются через клиент → Cloudinary (upload preset)
- В бекенд приходит только URL
- Макс 20 фото на мастера (проверка в сервисе)
- Аватар — отдельно, 1 шт

---

## 6. Этапы разработки

### Этап 1 — База + Auth + Профили
- [ ] Инициализация NestJS + Prisma
- [ ] Схема БД (миграция)
- [ ] Auth модуль (register, login, refresh, me)
- [ ] Users модуль (CRUD базовый)
- [ ] MasterProfile модуль (создание, редактирование)
- [ ] JWT Guards, Roles Guards

**Примерное время:** 2-3 дня

### Этап 2 — Каталог + Поиск
- [ ] Catalog модуль (GET /masters с фильтрами)
- [ ] Services CRUD
- [ ] Portfolio CRUD
- [ ] Upload модуль (Cloudinary)
- [ ] Пагинация, сортировка

**Время:** 1-2 дня

### Этап 3 — Чат
- [ ] Chat модуль (создание чата, список)
- [ ] Message модуль (история)
- [ ] Socket.IO gateway + авторизация
- [ ] Realtime отправка/получение сообщений
- [ ] Typing indicator

**Время:** 2-3 дня

### Этап 4 — Invitations + Admin
- [ ] Invitations модуль (создание, список)
- [ ] Admin модуль (модерация мастеров)
- [ ] Admin модуль (управление приглашениями)
- [ ] Пригласить мастера → уведомление админу

**Время:** 1-2 дня

### Этап 5 — Уведомления + Деплой
- [ ] Push-уведомления (Firebase Cloud Messaging)
- [ ] Dockerfile + docker-compose
- [ ] Деплой на Railway / Render
- [ ] Swagger docs
- [ ] Тестирование + багфикс

**Время:** 2 дня

---

## 7. Деплой

**Вариант Railway (рекомендуется для MVP):**
- Postgres plugin (встроенный)
- Service (NestJS) — деплой из GitHub
- Env переменные через Railway dashboard

**Или Render:**
- Web Service (NestJS)
- PostgreSQL managed

---

## 8. Будущие улучшения (после MVP)

- Google / Telegram OAuth
- Онлайн-запись (Booking) — календарь, слоты
- Онлайн-оплата (Stripe / PayPal)
- AI-модерация фото
- Многоззычность API (i18n)
- Rate limiting (healthcheck)
- Sentry / логирование
- Admin analytics dashboard
- Перевод профилей через AI
