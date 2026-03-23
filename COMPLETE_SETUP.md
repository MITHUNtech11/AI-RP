# AI Resume Parser - Complete Setup Guide

## 📋 Project Structure

```
AI-resume-parser/
├── mobile-app/              # 📱 React Native/Expo Frontend (FOR PLAY STORE)
│   ├── src/
│   │   ├── services/api.ts  # Backend communication
│   │   ├── context/         # State management
│   │   ├── types/           # TypeScript types
│   │   ├── screens/         # App screens
│   │   └── App.tsx          # Main entry point
│   ├── SETUP.md             # Mobile app setup guide
│   └── package.json         # Dependencies
│
├── backend/                 # 🌐 FastAPI Backend
│   ├── main.py              # Run this: python main.py (port 8000)
│   ├── requirements.txt      # Python dependencies
│   ├── config/              # Settings & authentication
│   ├── services/            # File converters, logging
│   ├── resume_parser/       # AI parsing logic (Gemini + Azure)
│   └── README.md            # Backend documentation
│
└── [OTHER FILES]
    ├── README.md            # Project overview
    ├── ARCHITECTURE.md      # System design
    └── ...
```

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
```bash
# Check Python version (3.8+)
python --version

# Check Node.js version (18+)
node --version

# Check pip
pip --version
```

### Step 1: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with your API keys
echo GEMINI_API_KEY=your-key-here > .env
echo API_KEY=dev-key-12345 >> .env

# Start the backend server
python main.py

# ✅ Should see: "Uvicorn running on http://0.0.0.0:8000"
```

**Backend is running at**: `http://localhost:8000`

### Step 2: Configure Mobile App

**Find your machine's WiFi IP:**
```bash
# Windows
ipconfig
# Look for IPv4 Address under your WiFi adapter (e.g., 192.168.1.100)

# Mac/Linux  
ifconfig
# Look for inet address under en0/eth0
```

**Update mobile app config:**
```bash
# Edit this file
mobile-app/src/services/api.ts

# Change this line to your IP:
return 'http://192.168.1.100:8000';  // Replace with YOUR IP
```

**Note**: Your phone must be on the SAME WiFi network!

### Step 3: Run Mobile App

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start Expo
npm start

# In your terminal:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Scan QR code with Expo app for physical device
```

---

## 🔧 Detailed Setup

### Backend Setup

**Option A: Development (Recommended)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Or create .env manually
# Add your GEMINI_API_KEY and API_KEY

# Run server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Option B: Using Python directly**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Mobile App Setup

1. **Install dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure backend URL**:
   - File: `src/services/api.ts`
   - Update: Your machine's WiFi IP address
   - For production: Use your deployed backend URL

3. **Update package.json** (if needed):
   ```bash
   # Add any missing packages
   npm install @react-native-async-storage/async-storage expo-document-picker
   ```

4. **Run the app**:
   ```bash
   npm start
   ```

---

## 🔐 Configuration Files

### Backend Environment (.env)

```env
# Google AI API Key (for Gemini)
GEMINI_API_KEY=your-google-ai-key

# API Key for frontend authentication
API_KEY=dev-key-12345

# File processing limits
MAX_FILE_SIZE_MB=50
ALLOWED_FORMATS=pdf,docx,jpg,png,txt

# Authentication requirement
REQUIRE_AUTH=true
```

### Mobile App Environment

These are set in your `src/services/api.ts`:

```typescript
// Development
const BACKEND_URL = 'http://192.168.1.100:8000';
const API_KEY = 'dev-key-12345';

// Production (for Play Store)
const BACKEND_URL = 'https://your-backend-domain.com';
const API_KEY = 'production-secure-key';
```

---

## 📱 Play Store Deployment

### Step 1: Deploy Backend to Cloud

Choose one (or use your own):
- **Heroku**: `heroku create && git push heroku main`
- **AWS**: Use EC2 or Lambda with API Gateway
- **Google Cloud**: Cloud Run or App Engine
- **Azure**: App Service
- **DigitalOcean**: App Platform

Get your backend URL: `https://your-domain.com`

### Step 2: Update Mobile App Configuration

```typescript
// src/services/api.ts
const BACKEND_URL = 'https://your-domain.com';  // Your deployed backend
const API_KEY = 'production-api-key';           // Secure key from backend
```

### Step 3: Build for Android

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure Expo project
eas build:configure

# Create production build
eas build --platform android --release

# This generates an APK/AAB ready for Play Store
```

### Step 4: Submit to Play Store

1. Create Google Play Console account
2. Create new app
3. Fill in app details
4. Upload APK/AAB from EAS
5. Review and publish

---

## 📡 API Integration

### How Frontend Talks to Backend

```
Mobile App
  ├─ User selects resume file
  ├─ App reads file → Creates FormData
  ├─ Sends FormData to: POST /parse
  │
Backend receives
  ├─ Validates API key
  ├─ Converts file to processable format
  ├─ Sends to Gemini AI
  ├─ Receives structured JSON
  │
Mobile App receives
  ├─ Parses response
  ├─ Saves to AsyncStorage
  └─ Displays results
```

### API Endpoints

**Health Check**
```bash
GET /health
Headers: X-API-Key: dev-key-12345
Response: {"status": "healthy"}
```

**Parse Resume**
```bash
POST /parse
Headers: X-API-Key: dev-key-12345
Body: FormData with file
Response:
{
  "status": "success",
  "data": {
    "personalInfo": { "fullName": "...", ... },
    "skills": ["..."],
    "experience": [...]
  },
  "file_id": "..."
}
```

---

## ✅ Testing the Integration

### 1. Test Backend Alone

```bash
# Check if backend is running
curl -X GET http://localhost:8000/health \
  -H "X-API-Key: dev-key-12345"

# Test with a sample resume
curl -X POST http://localhost:8000/parse \
  -H "X-API-Key: dev-key-12345" \
  -F "file=@sample_resume.pdf"
```

### 2. Test Frontend Connection

```bash
# In mobile app
1. Start app: npm start
2. Check Settings page for "Backend Connected" status
3. Try uploading a test resume
4. Check backend logs for requests
```

### 3. Full Integration Test

1. ✅ Backend running on `localhost:8000`
2. ✅ Mobile app configured with your IP
3. ✅ Phone on same WiFi network
4. ✅ Upload resume in app
5. ✅ Check backend logs for activity
6. ✅ See parsed results in app

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Backend Unreachable" | Make sure `python main.py` is running; verify IP in `api.ts` |
| "Connection Error" on mobile | Phone and computer must be on SAME WiFi; disable firewall temporarily |
| "API Key Invalid" | Check API keys match in backend `.env` and mobile `api.ts` |
| "File not supported" | Check backend's `ALLOWED_FORMATS` setting |
| Build fails on Expo | Clear cache: `npm cache clean --force` |
| Can't find local IP | Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) |

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server (RUN THIS) |
| `mobile-app/src/services/api.ts` | Backend API client |
| `mobile-app/App.tsx` | Main mobile app component |
| `mobile-app/SETUP.md` | Detailed mobile app setup |
| `backend/README.md` | Detailed backend setup |
| `backend/requirements.txt` | Python dependencies |
| `mobile-app/package.json` | Node.js dependencies |

---

## 🎓 Next Steps

1. ✅ Set up backend
2. ✅ Set up mobile app
3. ✅ Test locally
4. 📤 Deploy backend to cloud
5. 📦 Build APK for Play Store
6. 🚀 Submit to Play Store

---

## 📞 Support

Check these docs:
- [Backend README](./backend/README.md)
- [Mobile App SETUP](./mobile-app/SETUP.md)
- [Architecture](./ARCHITECTURE.md)

---

**Last Updated**: March 2026
**Version**: 2.0.0 (Backend Integration)
