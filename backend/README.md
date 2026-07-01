# BeautyMatch — Google OAuth Implementation

Full Google OAuth integration for BeautyMatch platform.

## 📋 Requirements Covered

| # | Requirement | Status |
|---|-------------|--------|
| **US-1** | One-click Google login | ✅ |
| **US-2** | Link Google to existing profile | ✅ |
| **AC-1** | Google sign-in → consent → dashboard | ✅ |
| **AC-2** | Settings link with password confirmation | ✅ |
| **AC-3** | Backend ID token verification + logging | ✅ |
| **BR-1** | Cannot delete the only login method | ✅ |
| **BR-2** | Link by email match only | ✅ |
| **BR-3** | Password nullable when Google-linked | ✅ |
| **EC-1** | Email conflict → suggest password login | ✅ |
| **EC-2** | Revoked Google access → show error | ✅ |
| **EC-3** | Google account deleted → recovery flow | ✅ |

## 🏗 Architecture

```
beauty-booking-landing/
├── index.html            ← Updated with auth nav
├── src/
│   ├── js/auth.js        ← Auth client library (Google OAuth + JWT)
│   ├── login.html        ← Login/Registration page
│   ├── dashboard.html    ← User dashboard
│   ├── settings.html     ← Account settings (link/unlink Google, set password)
│   └── recovery.html     ← Account recovery (EC-3)
├── backend/
│   ├── package.json
│   ├── .env.example      ← Configuration template
│   ├── src/
│   │   ├── server.js     ← Express server
│   │   ├── config/index.js
│   │   ├── db/
│   │   │   ├── connection.js
│   │   │   └── migrate.js
│   │   ├── models/
│   │   │   ├── User.js         ← All business rules enforced
│   │   │   └── AuthLog.js      ← AC-3 logging
│   │   ├── services/
│   │   │   ├── GoogleAuthService.js  ← Token verification (AC-3)
│   │   │   └── TokenService.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   └── AuthController.js
│   │   └── routes/
│   │       └── auth.js
```

## 🚀 Setup

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or use existing)
3. **APIs & Services → Credentials**
4. Create OAuth 2.0 Client ID (Web application)
5. Add redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Note your **Client ID** and **Client Secret**

### 2. Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
JWT_SECRET=your-strong-secret-here
FRONTEND_URL=http://localhost:3000
```

### 3. Install & Run

```bash
cd backend
npm install
npm run migrate   # Creates SQLite database
npm run dev       # Starts on :3001
```

The frontend serves from `beauty-booking-landing/`. Open `index.html` or use a dev server:

```bash
npx serve ../    # From backend/ directory
```

## 🔌 API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/register` | New account creation |
| POST | `/api/auth/google` | Google OAuth login/signup |

### Authenticated
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/auth/google/link` | Link Google to profile (AC-2) |
| POST | `/api/auth/google/unlink` | Unlink Google from profile |
| POST | `/api/auth/password/set` | Set password for Google-only user |
| GET | `/api/user/auth-log` | Recent auth log entries |
| PUT | `/api/user/profile` | Update profile |

## 🧪 Business Rules Implementation

### BR-1: Cannot delete the only login method
- `User.unlinkGoogle()` checks for password_hash
- If no password → throws error: "Set password first"
- Settings page shows warning + link to set password modal

### BR-2: Link strictly by email
- `User.linkGoogle()` compares user.email with google email
- Mismatch → throws error "Emails must match"

### BR-3: Password nullable
- `users.password_hash` column allows NULL
- `is_google_linked = 1` → password can be null
- Login page detects this case and redirects to Google login

### EC-3: Recovery flow
- `/recovery.html` page guides user through email-based recovery
- Backend generates recovery token for password reset
- User can set new password without knowing old one

## 🔐 Security

- **AC-3**: Google ID tokens verified by `google-auth-library` (official Google library)
- Rate limiting on auth endpoints (20 req/15 min, 10 OAuth req/5 min)
- Password hashing with bcrypt (12 rounds)
- JWT with configurable expiry (default 7 days)
- HTTP-only cookies + Bearer token support
- All auth attempts logged to `auth_log` table
- Helmet security headers
- CORS restricted to configured frontend URL

## 📝 Open Questions (from BA)

1. **Session lifetime** → Configured via `JWT_EXPIRES_IN` (default 7d), configurable
2. **OAuth Client IDs** → Single dev ID in `.env`; prod setup would use separate IDs per env
3. **Scopes** → Currently `openid profile email` only; can extend via config
4. **Unlink without password** → Blocked by BR-1; must set password first
5. **Rate limit** → Implemented: 20 auth requests / 15 min, 10 OAuth / 5 min
