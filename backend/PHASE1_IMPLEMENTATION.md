# Phase 1: Authentication & User Management Implementation

## Overview
This document describes the implementation of Phase 1: Complete authentication system with JWT tokens and user management.

## What's New

### Database Models
- **User** - User account information (id, email, full_name, password_hash, is_active, created_at, updated_at)
- **UserPreferences** - User app preferences (theme, notifications, language)

### API Endpoints

#### Authentication (`/auth/*`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/signup` | Register new user, returns JWT tokens |
| POST | `/auth/login` | Login with email/password, returns JWT tokens |
| POST | `/auth/refresh` | Get new access token from refresh token |
| POST | `/auth/validate` | Validate JWT token |
| GET | `/auth/me` | Get current user profile |
| PUT | `/auth/me/password` | Change password |
| POST | `/auth/logout` | Logout (client-side token deletion) |

#### User Profile (`/users/*`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users/me/full` | Get complete user profile with preferences |
| PUT | `/users/me/profile` | Update user profile (name, email) |
| GET | `/users/me/preferences` | Get user preferences |
| PUT | `/users/me/preferences` | Update user preferences |
| GET | `/users/me/analytics` | Get user statistics (resumes, shortlisted, etc) |

### File Structure
```
backend/
├── config/
│   ├── database.py         (NEW - SQLAlchemy setup)
│   ├── settings.py         (UPDATED - Added JWT & DB config)
│   └── auth.py             (EXISTING)
├── models/
│   ├── __init__.py         (NEW)
│   ├── user.py             (NEW - User & UserPreferences)
│   ├── resume.py           (NEW - Resume model for Phase 2)
│   ├── job_description.py  (NEW - JD model for Phase 2)
│   ├── activity.py         (NEW - Activity model for Phase 3)
│   └── comparison.py       (NEW - Comparison model for Phase 3)
├── schemas/
│   ├── __init__.py         (NEW)
│   ├── auth.py             (NEW - Request/response schemas)
│   └── user.py             (NEW - User profile schemas)
├── services/
│   ├── auth_service.py     (NEW - Auth logic: signup, login, JWT)
│   └── __init__.py         (EXISTING)
├── routes/
│   ├── __init__.py         (NEW)
│   ├── auth.py             (NEW - Auth endpoints)
│   └── users.py            (NEW - User profile endpoints)
├── main.py                 (UPDATED - Add routes & DB init)
├── requirements.txt        (UPDATED - Add dependencies)
└── .env.example            (NEW - Environment variables template)
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create .env File
```bash
cp .env.example .env
# Edit .env with your configuration
```

**Key variables to set:**
- `JWT_SECRET_KEY` - Generate a secure random string (min 32 chars)
- `DATABASE_URL` - SQLite (dev) or PostgreSQL (prod)
- `GEMINI_API_KEY` - Your Gemini API key (for resume parsing)

### 3. Run the Backend
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 4. Test Auth Endpoints
Use the Swagger UI at `/docs` or the following curl commands:

#### Signup
```bash
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "password": "SecurePassword123!"
  }'
```

#### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Get Current User
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer {access_token}"
```

## Database
- **Development:** SQLite (`./resume_parser.db`) - Created automatically on first run
- **Production:** PostgreSQL recommended (configure `DATABASE_URL` in .env)

Database tables are created automatically on startup.

## Authentication Flow

### JWT Tokens
1. User signs up or logs in → Receives `access_token` & `refresh_token`
2. `access_token` (24 hours) - Use for all API requests in Authorization header
3. `refresh_token` (7 days) - Use to get new access_token when expired

### Headers
All protected endpoints require:
```
Authorization: Bearer {access_token}
```

## Security Features
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens (HS256 with secret key)
- ✅ Token expiration (configurable)
- ✅ CORS enabled for frontend
- ✅ Email validation (Pydantic EmailStr)
- ✅ Password validation (min 8 chars)

## Frontend Integration (Next Steps)

### 1. Add API Client in Frontend
Create `src/services/api.ts`:
```typescript
const API_BASE_URL = "http://localhost:8000";

export const auth = {
  signup: async (email: string, fullName: string, password: string) => {
    return fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: fullName, password })
    }).then(r => r.json());
  },
  
  login: async (email: string, password: string) => {
    return fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }).then(r => r.json());
  },
  
  getCurrentUser: async (token: string) => {
    return fetch(`${API_BASE_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
  }
};
```

### 2. Update ResumeContext
Replace IndexedDB with API calls:
- `completeOnboarding()` → Call `/auth/signup` or `/auth/login`
- `logout()` → Clear token from storage
- Add `setAuthToken()` to store JWT in localStorage

### 3. Protected Route Wrapper
Create a component that checks authentication before rendering other routes.

## Testing

### Unit Tests Needed
- [ ] Password hashing/verification
- [ ] JWT token generation/validation
- [ ] User signup (valid, duplicate email, invalid password)
- [ ] User login (valid, invalid password, inactive user)
- [ ] Token refresh

### Integration Tests
- [ ] Full signup → login → get profile → logout flow
- [ ] Update profile and preferences
- [ ] Change password
- [ ] Token expiration and refresh

## Troubleshooting

### Issue: "JWT_SECRET_KEY not found"
**Solution:** Create `.env` file with `JWT_SECRET_KEY=your-secret-here`

### Issue: "Database locked"
**Solution:** Stop other processes using the DB file or use PostgreSQL for production

### Issue: CORS errors from frontend
**Solution:** CORS is enabled for all origins. Check that API_BASE_URL matches backend URL in frontend.

## Next Steps

- **Phase 2:** Resume storage & job description management
- **Phase 3:** Advanced features (comparison, ranking, activity tracking)
- **Phase 4:** Optional optimizations (backend parsing, file storage)

See `/memories/session/plan.md` for the complete roadmap.
