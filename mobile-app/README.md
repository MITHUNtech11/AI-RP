# 📱 Mobile App (React Native / Expo)

React Native mobile application built with Expo for iOS, Android, and Web.

## 🎯 Features

- ✅ Upload resumes (images, PDFs, documents)
- ✅ View parsed resume data
- ✅ Configure backend API URL
- ✅ API key authentication
- ✅ Error handling with fallback UI
- ✅ Works on iOS, Android, and Web

## 📋 Prerequisites

- Node.js 16+ ([download](https://nodejs.org))
- Expo Go app (iOS: App Store, Android: Google Play)
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile-app

# Remove old cache if needed
rm -rf node_modules package-lock.json
npm install
```

### 2. Start Expo Dev Server

```bash
npm start
# or
npx expo start
```

### 3. Run on Device

**Option A: Mobile Phone (Recommended)**
```
1. Install "Expo Go" app on your phone
2. Run: npm start
3. Scan the QR code shown in terminal
4. App opens in Expo Go
```

**Option B: Android Emulator**
```bash
npm run android
# or press 'a' in terminal
```

**Option C: iOS Simulator (macOS only)**
```bash
npm run ios
# or press 'i' in terminal
```

**Option D: Web Browser**
```bash
npm run web
# or press 'w' in terminal
```

## 📖 Project Structure

```
mobile-app/
├── App.tsx                 # Main app component
├── index.ts               # Entry point (registerRootComponent)
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── babel.config.js        # Babel configuration (CRITICAL!)
├── eas.json               # Expo Services configuration
├── tsconfig.json          # TypeScript configuration
├── assets/                # Images, icons, splash screen
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── node_modules/          # Installed packages
```

## 🔧 Configuration

### Backend URL

The app connects to your backend API. To change the URL:

1. **Open App.tsx** (line 7)
2. Change: `const DEFAULT_API = 'http://10.0.2.2:8000';`
   - For **emulator**: `http://10.0.2.2:8000` (Android emulator default)
   - For **physical device**: `http://YOUR_MACHINE_IP:8000`
   - For **Expo tunnel**: Use Expo's tunnel URL

3. Or configure at runtime in the app UI

### API Key

If your backend requires authentication:
1. Run backend with `REQUIRE_AUTH=true`
2. Enter API key in app's "API Key" field

## 🛠️ Troubleshooting

### "White Screen / No UI Showing"

**Solution 1: Clear Expo Cache**
```bash
# Stop the dev server (Ctrl+C)
# Then clear cache
npx expo start --clear
```

**Solution 2: Reinstall Dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start
```

**Solution 3: Check babel.config.js exists**
```bash
# File should be at: mobile-app/babel.config.js
ls babel.config.js

# If missing, create it:
cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
EOF
```

### "Metro bundler error"

```bash
# Clear all cache and rebuild
npx expo start --clear

# If still broken:
npm install --force
npx expo start
```

### "Cannot connect to backend"

1. **Check backend is running**: `http://localhost:8000/health`
2. **Update backend URL** in app to your machine's IP (not localhost)
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Use: `http://192.168.x.x:8000` (adjust x.x to your IP)
3. **Check firewall**: Allow port 8000

### "Error: Cannot find module 'babel-preset-expo'"

```bash
# Install missing dependency
npm install babel-preset-expo
```

### "EAS Build not found"

If you see EAS build errors, it's safe to ignore for development.

## 📲 Testing Locally

### 1. Start Backend
```bash
# Terminal 1
cd backend
python main.py
```

### 2. Start Frontend
```bash
# Terminal 2
cd mobile-app
npm start
```

### 3. Test in App
1. Scan QR code with Expo Go
2. Set backend URL to `http://10.0.2.2:8000` (or your IP for physical device)
3. Pick a resume file
4. Click "Upload & Parse"
5. View results

## 🔤 Styling

Main styles are defined at the bottom of `App.tsx` using StyleSheet:

```typescript
const styles = StyleSheet.create({
  container: { /* Main container */ },
  title: { /* Title text */ },
  input: { /* Text input fields */ },
  // ... more styles
});
```

To customize:
1. Edit styles in App.tsx
2. Save file (hot reload)
3. Changes appear immediately

## 🌍 Deployment

### Build for Production: Web
```bash
npm run web
# Visit http://localhost:19006
```

### Build for iOS/Android

Using **EAS Build** (Expo's cloud build service):

```bash
# Install Expo CLI globally
npm install -g eas-cli

# Authenticate
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📚 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54 | Framework & CLI |
| `react` | 19 | UI library |
| `react-native` | 0.81 | Mobile framework |
| `expo-image-picker` | ~17 | Pick images |
| `expo-document-picker` | ~14 | Pick documents |
| `expo-status-bar` | ~3 | Status bar control |
| `babel-preset-expo` | ~11 | Babel transpiler |

## 🐛 Debug Mode

Enable verbose logging:

```bash
# Set DEBUG env var
export DEBUG=*
npm start
```

## 📖 Learn More

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Expo CLI**: https://docs.expo.dev/workflow/expo-cli

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes to App.tsx
3. Test on device
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`

## 📞 Support

- 🎥 Debug: Check terminal output for Metro bundler errors
- 📝 Logs: Look in Expo debugger (shake device or press Menu on emulator)
- 🔗 Backend: Verify backend is running and accessible

---

**Ready to develop? Run `npm start` and scan the QR code!** 📱

