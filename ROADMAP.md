# Dango App — Roadmap

## 1. Backend (Express + Vercel)
- [ ] Create a new `dango-api` project
- [ ] Set up Express.js with CORS
- [ ] Create TMDB proxy endpoint (so API key is never in the APK)
- [ ] Deploy to Vercel
- [ ] Add `TMDB_ACCESS_TOKEN` to Vercel environment variables
- [ ] Update Dango app `.env` to point to the Vercel backend URL

## 2. Security
- [ ] Regenerate TMDB API key (current one was exposed in chat)
- [ ] Remove `EXPO_PUBLIC_TMDB_ACCESS_TOKEN` from `.env` in the app
- [ ] Move all TMDB calls in `lib/tmdb.ts` to use the backend URL instead
- [ ] Add `.env` to `.gitignore` (already done ✅)

## 3. App Fixes & Features
- [ ] Fix top bar auto-hide in player (done ✅)
- [ ] Fix season/episode tracking in player (done ✅)
- [ ] Fix continue watching (done ✅)
- [ ] Fix episode cards clipping in details screen (done ✅)
- [ ] Fix autoplay (done ✅)
- [ ] Add proper error boundaries so crashes show a friendly screen
- [ ] Add loading skeleton for the player
- [ ] Add real authentication (login / register)
- [ ] Add user profiles (currently just UI)
- [ ] Add download functionality (currently just a button)
- [ ] Add notifications for new episodes

## 4. Production Build
- [ ] Update `app.json` with correct app name, version, and package (done ✅)
- [ ] Set up `eas.json` with preview and production profiles (done ✅)
- [ ] Link Expo project ID (done ✅)
- [ ] Replace `your-expo-username` in `app.json` with real username
- [ ] Set splash screen background to `#000000`
- [ ] Test APK on a real Android device before uploading
- [ ] Build APK with `eas build --platform android --profile preview`
- [ ] Upload APK to APKPure

## 5. Updates & Maintenance
- [ ] Set up `eas update` for OTA JS-only updates
- [ ] Bump `versionCode` in `app.json` for every new APK upload
- [ ] Monitor TMDB API usage on the TMDB dashboard
- [ ] Set up error tracking (e.g. Sentry) to catch crashes from real users

## 6. Future (Nice to Have)
- [ ] iOS build and App Store / TestFlight release
- [ ] Google Play Store release (requires content licensing)
- [ ] Replace Videasy with a licensed or self-hosted video source
- [ ] Add a proper database for user watchlists (e.g. Supabase)
- [ ] Add search filters (by genre, year, rating)
- [ ] Add a recommendation engine based on watch history
