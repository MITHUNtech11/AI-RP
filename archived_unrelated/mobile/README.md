Expo React Native mobile app instructions

This folder contains a minimal scaffold and guidance to create an Expo + TypeScript mobile app
that calls the Resume Parser backend and the Gemini proxy endpoint.

Quick start (on your machine):

1. Install Expo CLI (if not installed):

```bash
npx create-expo-app@latest mobile-app --template expo-template-blank-typescript
cd mobile-app
npm install
```

2. Add the sample `src/api.ts` shown below into `src/` and update `App.tsx` to call your backend.

3. Run locally:

```bash
npm start
# then press 'a' to open Android emulator or scan QR with Expo Go
```

Notes on keys and config
- Do NOT hardcode `API_KEY` or `GEMINI` keys in the mobile app for production.
- Recommended: Keep the Gemini key on the backend and call `/generate` (already added).
- For storing the user's backend `API_KEY` (if required), use `expo-secure-store`.

Sample fetch flow (see `src/api.ts`): the mobile app sends a prompt to `/generate`.
