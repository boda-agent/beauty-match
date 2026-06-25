# Beauty Match — Frontend Roadmap

**Tech Stack:**
- React 18 + TypeScript
- Vite (сборщик)
- React Router v6 (роутинг)
- TanStack Query (серверное состояние, кэш)
- Zustand (локальное состояние — auth, UI)
- Socket.IO Client (чат)
- Tailwind CSS (стили)
- Axios (HTTP клиент)

---

## 1. Архитектура проекта

```
beauty-match-frontend/
├── public/
├── src/
│   ├── main.tsx                 # точка входа
│   ├── App.tsx                  # роуты, layout
│   ├── api/                     # Axios instance, эндпоинты
│   │   ├── client.ts            # axios с interceptor (токены)
│   │   ├── auth.ts
│   │   ├── masters.ts
│   │   ├── catalog.ts
│   │   ├── chat.ts
│   │   ├── invitations.ts
│   │   ├── admin.ts
│   │   └── upload.ts
│   ├── hooks/                   # React Query hooks
│   │   ├── useAuth.ts
│   │   ├── useMasters.ts
│   │   ├── useCatalog.ts
│   │   ├── useChat.ts
│   │   └── useInvitations.ts
│   ├── store/                   # Zustand store
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── socket/                  # Socket.IO клиент
│   │   └── chatSocket.ts
│   ├── pages/                   # страницы
│   │   ├── HomePage.tsx
│   │   ├── CatalogPage.tsx
│   │   ├── MasterProfilePage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── client/
│   │   │   ├── MyChatsPage.tsx
│   │   │   └── MyInvitationsPage.tsx
│   │   ├── master/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProfileEditPage.tsx
│   │   │   ├── ServicesManagePage.tsx
│   │   │   ├── PortfolioManagePage.tsx
│   │   │   └── MessagesPage.tsx
│   │   ├── admin/
│   │   │   ├── MastersModerationPage.tsx
│   │   │   └── InvitationsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/              # переиспользуемые компоненты
│   │   ├── ui/                  # базовые (Button, Input, Modal, Select)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── master/
│   │   │   ├── MasterCard.tsx
│   │   │   ├── ServiceList.tsx
│   │   │   ├── PortfolioGrid.tsx
│   │   │   └── MasterInfo.tsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── invitation/
│   │   │   └── InvitationForm.tsx
│   │   └── common/
│   │       ├── ImageUploader.tsx
│   │       ├── Pagination.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ProtectedRoute.tsx
│   ├── types/                   # TypeScript типы
│   │   ├── auth.ts
│   │   ├── master.ts
│   │   ├── chat.ts
│   │   ├── invitation.ts
│   │   └── api.ts               # общие типы (Page, ApiError)
│   ├── utils/
│   │   ├── formatPrice.ts
│   │   ├── formatDate.ts
│   │   └── validators.ts
│   └── styles/
│       └── globals.css          # Tailwind + кастомные стили
├── .env
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 2. Страницы и маршруты

```
/                          → HomePage        (поиск, пригласить)
/catalog                   → CatalogPage     (карточки + фильтры)
/masters/:id               → MasterProfilePage
/chats                     → ChatPage        (список диалогов)
/chats/:id                 → ChatPage        (конкретный чат)

/login                     → LoginPage
/register                  → RegisterPage

/client/invitations        → MyInvitationsPage
/client/chats              → MyChatsPage

/master/dashboard          → DashboardPage
/master/profile/edit       → ProfileEditPage
/master/services           → ServicesManagePage
/master/portfolio          → PortfolioManagePage
/master/messages           → MessagesPage

/admin/masters             → MastersModerationPage
/admin/invitations         → InvitationsPage

*                          → NotFoundPage
```

---

## 3. Компоненты и их состояние

### SearchBar (HomePage)
- Поля: Город (input/select), Услуга (input/select)
- Кнопка "Найти мастеров" → /catalog?city=...&service=...
- Блок "Не нашли своего мастера?" + кнопка "Пригласить мастера" → модалка InvitationForm

### FilterPanel (CatalogPage)
- Сайдбар или дровер с фильтрами
- **Обязательные:** услуга (select), город (select), язык (multi-select), страна происхождения (select)
- **Дополнительные:** пол мастера (radio), подтвержденный профиль (toggle)
- Кнопка "Сбросить фильтры"
- Состояние фильтров в URL-query (shareable ссылка)

### MasterCard (CatalogPage)
- Фото (аватар), Имя, Город, Страна происхождения, Языки, Минимальная цена
- При клике → /masters/:id

### MasterProfilePage
- Секции: Основная инфо, Услуги (таблица/список), Портфолио (сетка фото)
- Кнопка "Написать мастеру" → создаёт/открывает чат

### ChatWindow
- Список сообщений (scroll to bottom)
- Input + Send button
- Автоматическая подгрузка истории (infinite scroll up)
- Индикатор "печатает..."
- Socket.IO: получение сообщений в реальном времени

### InvitationForm
- Модальное окно
- Поля: Имя мастера, Instagram (опц), WhatsApp (опц), Город, Комментарий (textarea)
- Кнопка "Отправить"
- После отправки — toast "Заявка отправлена"

### ImageUploader
- Drag & drop / click to select
- Preview перед загрузкой
- Отправка на Cloudinary (через upload preset)
- Возврат URL → сохранение через API

---

## 4. Аутентификация

- **Хранение токенов:** access token в памяти (Zustand), refresh token в httpOnly cookie (бекенд)
- **Interceptor Axios:** при 401 → автоматический refresh → retry запроса
- **ProtectedRoute:** компонент-обёртка, проверяет auth + role
- **Redirect:** после логина на предыдущую страницу

**Zustand store (authStore):**
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

---

## 5. Чат (Socket.IO)

- При монтировании — установка соединения с JWT
- Join комнаты чата при открытии
- Отправка сообщения: emit `chat:send` → сервер сохраняет + broadcast
- Получение: on `chat:message` → append к локальному state
- React Query для первоначальной загрузки истории
- Zustand для текущего активного чата (live сообщения)
- Оптимизация: отложенная подгрузка (infinite scroll), unread counter

---

## 6. Стилизация (Tailwind)

**Цветовая схема (примерно):**
- Primary: rose / pink (beauty-тематика)
- Secondary: warm gray / stone
- Accent: emerald (для статусов verified)
- Background: white + light gray

**Адаптивность:**
- Mobile first
- Catalog: 1 колонка (mobile) → 2 (tablet) → 3-4 (desktop)
- Чат: на mobile — full screen, на desktop — split (list + conversation)

---

## 7. Этапы разработки

### Этап 1 — Setup + Auth + Layout
- [ ] Vite + React + TypeScript + Tailwind
- [ ] Роутинг (React Router)
- [ ] Axios client с interceptor
- [ ] Auth store (Zustand)
- [ ] Login / Register страницы
- [ ] Header (логин/аватар, навигация)
- [ ] ProtectedRoute (role-based)

**Время:** 1-2 дня

### Этап 2 — Главная + Каталог
- [ ] SearchBar (город + услуга)
- [ ] MasterCard компонент
- [ ] CatalogPage (сетка карточек + пагинация)
- [ ] FilterPanel (все фильтры)
- [ ] InvitationForm (модалка)
- [ ] MasterProfilePage (инфо, услуги, портфолио)

**Время:** 2-3 дня

### Этап 3 — Dashboard мастера
- [ ] ProfileEditPage (редактирование профиля)
- [ ] ServicesManagePage (CRUD услуг)
- [ ] PortfolioManagePage (загрузка/удаление фото)
- [ ] ImageUploader (Cloudinary)

**Время:** 1-2 дня

### Этап 4 — Чат
- [ ] Socket.IO клиент (подключение + авторизация)
- [ ] ChatPage (список диалогов)
- [ ] ChatWindow (сообщения, отправка)
- [ ] MessageBubble (стилизация, время, статус)
- [ ] Real-time обновления
- [ ] Typing indicator

**Время:** 2-3 дня

### Этап 5 — Админка + Деплой
- [ ] Admin MastersModerationPage (таблица со статусами)
- [ ] Admin InvitationsPage (таблица с фильтрами)
- [ ] Push-уведомления (Firebase)
- [ ] Vercel deploy
- [ ] Финальное тестирование

**Время:** 1-2 дня

---

## 8. Деплой

- **Vercel** — бесплатно, автодеплой из GitHub
- **Env переменные:** VITE_API_URL, VITE_WS_URL, VITE_CLOUDINARY_PRESET
- **Sentry** (опционально) — отслеживание ошибок на фронте

---

## 9. Будущие улучшения (после MVP)

- React Native приложение (тот же API, те же эндпоинты)
- i18n (русский, турецкий, английский, украинский)
- Темная тема
- PWA (offline support)
- react-query-devtools (отладка)
- Booking UI (календарь со слотами)
- Оплата (Stripe Elements)
- Видео в портфолио
- Reels / short video previews
