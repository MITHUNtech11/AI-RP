# Mobile App Configuration

## Development Setup

### 1. Prerequisites
```bash
# Install Node.js (v18+) and npm
# Install Expo CLI globally
npm install -g expo-cli
```

### 2. Update Backend IP

The mobile app needs to connect to your backend server. You must update the IP address in your WiFi network:

**In `src/services/api.ts`:**
```typescript
return 'http://192.168.1.100:8000'; // Update with your machine's IP
```

To find your machine's IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Look for the IPv4 address under your WiFi adapter (not 127.0.0.1).

**Important**: Your phone and computer must be on the **SAME WiFi network**.

### 3. Start the Backend

```bash
# From project root
cd backend
python main.py
# Should show: Uvicorn running on http://0.0.0.0:8000
```

### 4. Run Mobile App

```bash
# From project root
cd mobile-app
npm install  # If not already installed
npm start
```

This opens Expo CLI. Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo app for physical device

### 5. Test Connection

In the app, look for connection status. It should show "Backend Connected" if successful.

---

## Environment Variables

### Development (.env.local)
```env
REACT_APP_BACKEND_URL=http://192.168.1.100:8000
REACT_APP_BACKEND_API_KEY=dev-key-12345
```

### Production (for Play Store)
```env
REACT_APP_BACKEND_URL=https://your-backend-domain.com
REACT_APP_BACKEND_API_KEY=production-api-key
```

---

## Project Structure

```
mobile-app/
├── src/
│   ├── services/
│   │   └── api.ts           # Backend API calls
│   ├── types/
│   │   └── resume.ts        # TypeScript types
│   ├── context/
│   │   └── ResumeContext.tsx # State management
│   ├── screens/             # App screens
│   ├── components/          # Reusable components
│   └── App.tsx              # Main entry point
├── assets/                  # Images, icons
├── app.json                 # Expo configuration
├── eas.json                 # Expo Application Services config
├── package.json
└── tsconfig.json
```

---

## Play Store Deployment

### 1. Build APK/AAB

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create production build
eas build --platform android
```

### 2. Update Production Configuration

Before building, update:
- `.env.production` with your real backend URL
- `app.json` with your app version
- `eas.json` with your Google Play credentials

### 3. Submit to Play Store

Follow [Expo's Play Store guide](https://docs.expo.dev/distribution/submit-to-app-stores/).

---

## Troubleshooting

### "Backend Unreachable"
- Make sure backend is running: `python backend/main.py`
- Check your IP address is correct in `src/services/api.ts`
- Verify phone and computer are on same WiFi
- Disable firewall temporarily to test

### "Connection Error"
- Check WiFi connection
- Try pinging your computer from phone
- Make sure backend port 8000 is not blocked

### Build Issues
- Clear cache: `npm cache clean --force`
- Delete `node_modules`: `rm -r node_modules && npm install`
- Update Expo: `npm install -g expo-cli@latest`

---

## API Integration

The app communicates with backend via:
- **Endpoint**: `POST /parse`
- **Header**: `X-API-Key: dev-key-12345` (configurable)
- **Body**: Multipart FormData with file

See `src/services/api.ts` for implementation details.

---

## Next Steps

1. ✅ Backend running
2. ✅ IP configured in `api.ts`
3. ✅ Backend API key matches env
4. ✅ Test on emulator/device
5. 📱 Build APK for Play Store
6. 📤 Submit to Play Store
