# Frontend-Backend Integration Setup Guide

## ✅ What's Been Updated

Your frontend is now configured to communicate with your FastAPI backend instead of using client-side Gemini API. This is essential for Play Store deployment.

### Changes Made:

1. **New API Service** (`src/services/api.ts`)
   - `parseResumeViaBackend()` - Uploads files to backend and receives parsed data
   - `testBackendConnection()` - Verifies backend is reachable
   - XHR-based upload with progress tracking

2. **Updated Processing Flow**
   - `Upload.tsx` - Now passes File object directly (no base64 conversion)
   - `Processing.tsx` - Calls backend API instead of client-side Gemini
   - `Settings.tsx` - Shows backend connection status

3. **Environment Configuration**
   - `.env.local` - For local development (localhost:8000)
   - `.env.production` - For production/Play Store

---

## 🚀 Quick Start

### For Local Development:

```bash
# Backend (Terminal 1)
cd backend
python main.py
# Backend runs on: http://localhost:8000

# Frontend (Terminal 2)
cd archived_unrelated
npm run dev
# Frontend runs on: http://localhost:5173
```

The `.env.local` file is already configured for localhost.

---

### For Production / Play Store:

1. **Deploy your backend server** to a cloud provider:
   - Heroku
   - AWS (EC2, Lambda)
   - Google Cloud
   - Azure
   - DigitalOcean
   - etc.

2. **Update environment variables**:

   ```bash
   # .env.production
   REACT_APP_BACKEND_URL=https://your-backend-domain.com
   REACT_APP_BACKEND_API_KEY=production-api-key
   ```

3. **Build for production**:

   ```bash
   npm run build
   ```

4. **Deploy to Play Store with the built app**

---

## 🔑 API Key Setup

### Backend API Key (For Security)

Your backend expects an API key in the `X-API-Key` header:

```env
REACT_APP_BACKEND_API_KEY=your-secure-key
```

The backend checks this in `backend/config/auth.py`

**Important**: Change the default `dev-key-12345` in production!

### Update Backend Settings:

```python
# backend/config/settings.py
REQUIRE_AUTH = True  # Enforce API key requirement
```

---

## 📡 How It Works

### Request Flow:

```
User uploads resume in app
    ↓
Upload.tsx passes File to Processing.tsx
    ↓
Processing.tsx calls parseResumeViaBackend(file)
    ↓
api.ts sends FormData to http://backend/parse
    ↓
Backend + Gemini AI processes and returns JSON
    ↓
Results saved to browser IndexedDB
    ↓
User sees parsed resume
```

---

## ✅ Testing the Connection

1. **In Settings page**: You'll see "Backend Connected" if the server is running
2. **Try uploading a resume**: If it fails, check:
   - Backend is running (`python main.py`)
   - Correct URL in `.env.local`
   - API key matches

### Manual Test:

```bash
# Check backend is alive
curl -X GET http://localhost:8000/health \
  -H "X-API-Key: dev-key-12345"

# Should return: {"status": "healthy"}
```

---

## 🎯 Play Store Deployment Checklist

- [ ] Backend server deployed (get the HTTPS URL)
- [ ] API key secured in production
- [ ] `.env.production` updated with real URLs
- [ ] `npm run build` completes successfully
- [ ] Test with production backend URL locally
- [ ] All tests pass
- [ ] Ready to build APK/AAB for Play Store

---

## 🔧 Troubleshooting

### "Backend Unreachable" in Settings

**Solution**:
```bash
# 1. Check backend is running
cd backend
python main.py  # Should show "Uvicorn running on http://0.0.0.0:8000"

# 2. Test health endpoint
curl -X GET http://localhost:8000/health \
  -H "X-API-Key: dev-key-12345"

# 3. Verify .env.local has correct URL
cat .env.local
```

### "Network error - unable to reach backend server"

This means the frontend can't connect. Check:
1. Backend URL is correct in `.env.local`
2. Backend server is actually running
3. No firewall blocking the port
4. For remote backend: ensure HTTPS and CORS enabled (they are in backend/main.py)

### "Server error: 401"

This means the API key is wrong. Check:
1. `X-API-Key` header matches `REACT_APP_BACKEND_API_KEY`
2. Backend has `REQUIRE_AUTH=True` in settings.py

---

## 📝 File Changes Summary

| File | Change |
|------|--------|
| `src/services/api.ts` | ✨ NEW - Backend API client |
| `src/pages/Processing.tsx` | Updated to use backend |
| `src/pages/Upload.tsx` | Simplified to pass File object |
| `src/pages/Settings.tsx` | Now shows backend status |
| `.env.local` | Configuration for local dev |
| `.env.production` | Configuration for production |

---

## 🎁 Next Steps

1. **Test locally**: Run both backend and frontend, upload a test resume
2. **Deploy backend**: Choose a cloud provider and deploy `backend/main.py`
3. **Update production env**: Set real backend URL and API key
4. **Build for Play Store**: Follow Play Store app submission guidelines
5. **Monitor**: Check backend logs for any issues after deployment

---

**Your app is now ready for production! 🚀**
