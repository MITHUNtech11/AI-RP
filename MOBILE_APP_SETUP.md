# 🚀 How to Run the Mobile App - Fix Applied

Your mobile app had 3 issues that I've fixed:

## ✅ Issues Fixed

1. **Missing `babel.config.js`** ← This was the main issue!
2. **Outdated React/React-DOM versions** ← Caused dependency conflicts
3. **Missing `eas.json`** ← Expo Services config

## 🎯 Now Your App Will Show UI!

---

## 📱 How to Run

### Step 1: Already Done! ✓
I've:
- ✅ Created `babel.config.js` 
- ✅ Fixed dependency versions
- ✅ Installed all packages

### Step 2: Start the Backend (if not already running)

```bash
cd backend
python main.py
```

✅ Server should be at: `http://localhost:8000`

### Step 3: Start the Mobile App

```bash
cd mobile-app
npm start
```

You'll see:
```
┌─────────────────────────┐
│ Expo Dev Server         │
├─────────────────────────┤
│ ▒▒▒▒▒▒▒▒ QR Code ▒▒▒▒▒▒▒ │
│ Scan with Expo Go app   │
└─────────────────────────┘

Press: 
  a - Android
  i - iOS  
  w - Web
  q - Quit
```

### Step 4: Open on Phone

**Option A: Scan QR Code (Recommended)**
```
1. Install Expo Go app (App Store or Google Play)
2. Open Expo Go
3. Scan QR code from terminal
4. App opens automatically
```

**Option B: Web Browser**
```
Press 'w' in terminal
Opens at http://localhost:19006
```

**Option C: Android Emulator**
```
Press 'a' in terminal
(If you have Android Studio configured)
```

---

## 🎨 What You Should See

Once the app loads, you'll see:

```
┌─────────────────────────────────────┐
│ AI Resume Parser (Mobile)           │
├─────────────────────────────────────┤
│ Backend URL                         │
│ [____________________________]       │
│                                     │
│ API Key (optional)                  │
│ [____________________________]       │
│                                     │
│  [ Pick Image ] [ Pick Document ]  │
│                                     │
│  Selected: None                     │
│                                     │
│      [ Upload & Parse ]             │
│                                     │
│  Result                             │
│  No result yet                      │
├─────────────────────────────────────┤
```

---

## 🔧 Configuration

### For Local Backend (iOS Simulator / Android Emulator)
- Leave URL as: `http://10.0.2.2:8000` (pre-configured)

### For Local Backend (Physical Phone on Same WiFi)
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Change URL to: `http://192.168.x.x:8000` (replace x.x with your IP last 2 octets)
3. Example: `http://192.168.1.100:8000`

### For Production Backend
- Get your backend server URL
- Enter in app's "Backend URL" field

---

## 📝 Testing the App

1. **Pick a resume file** → Click "Pick Image" or "Pick Document"
2. **Select a file** → Choose your resume.pdf or image
3. **Configure backend** → Enter backend URL if needed
4. **Click Upload & Parse** → Wait for response
5. **View results** → JSON data appears below

---

## ⚠️ If You Still Get White Screen

### Option 1: Clear Expo Cache
```bash
cd mobile-app
npx expo start --clear
```

### Option 2: Run with Verbose Logging
```bash
cd mobile-app
npm start -- --verbose
```

### Option 3: Check Terminal for Errors
Look in the terminal running `npm start` for any error messages. Common issues:
- `Metro bundler error` → Run with `--clear`
- `Cannot find module` → Run `npm install` again
- `Backend not found` → Check backend URL in app

### Option 4: Full Reset
```bash
cd mobile-app
rm -rf node_modules package-lock.json .expo
npm install
npm start --clear
```

---

## 🎯 What Changed in Your Project

```
mobile-app/
├── babel.config.js          ← ✅ CREATED (was missing!)
├── eas.json                 ← ✅ CREATED (was missing!)
├── package.json             ← ✅ UPDATED (fixed React version)
├── App.tsx                  ← No changes
├── index.ts                 ← No changes
├── app.json                 ← No changes
└── node_modules/            ← ✅ REINSTALLED
```

---

## 🎬 Next Steps

1. ✅ Run `npm start` in mobile-app/
2. ✅ Scan QR code with Expo Go
3. ✅ You should now see the UI!
4. ✅ Test uploading a resume

---

## 💡 Pro Tips

- **Hot Reload**: Changes to App.tsx auto-refresh (just save and wait)
- **Debugger**: Shake phone or press Menu (Android) for debugger  
- **Metro Bundler**: Keep terminal running while developing
- **Clear Cache**: Use `--clear` if weird errors appear

---

## 🆘 Still Not Working?

Check:
1. ✓ `babel.config.js` exists in mobile-app/
2. ✓ `npm install` completed without errors
3. ✓ Backend is running (`http://localhost:8000/health`)
4. ✓ Expo Go app is installed on phone
5. ✓ Running from project root `cd mobile-app && npm start`

---

**You're ready to go! Start with:**
```bash
npm start
```

**Then scan the QR code! 📱✨**
