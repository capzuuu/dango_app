# 📱 Deployment Guide: EAS Android Build + Vercel Server

This guide walks you through building your Dango app for Android using EAS and hosting your backend server on Vercel.

---

## 📋 Prerequisites

### Required Accounts & Tools
- ✅ **Expo Account** - [Create at expo.dev](https://expo.dev)
- ✅ **EAS CLI** - Already configured in your project
- ✅ **Vercel Account** - [Create at vercel.com](https://vercel.com)
- ✅ **Git Repository** - Your code should be pushed to GitHub/GitLab
- ✅ **Android Keystore** - Needed for production signing

---

## 🚀 Part 1: Build Android App with EAS

### Step 1: Authenticate with EAS

```bash
eas login
```

This will open a browser to authenticate your Expo account.

### Step 2: Configure Your App

Your `app.json` already has:
- ✅ EAS Project ID configured
- ✅ Android package name: `com.dango.streaming`
- ✅ Version: `1.0.0`

If you want to update the owner or other details:

```bash
eas update-metadata --platform android
```

### Step 3: Set Up Android Credentials

```bash
eas credentials
```

Select:
1. **Platform**: Android
2. **Operation**: Set up new Android credentials
3. **Choose the Google Play console option** (recommended for production)

This will guide you through:
- Creating or selecting a Google Play project
- Setting up signing credentials
- Storing credentials securely on EAS

### Step 4: Update Backend URL Before Build

**Important**: Update your app to use your production Vercel server URL instead of localhost.

Edit [.env](./env) and update with your Vercel domain (after you deploy):
```
EXPO_PUBLIC_TMDB_BACKEND_URL=https://your-server.vercel.app/api/tmdb
```

### Step 5: Build the APK for Testing

```bash
eas build --platform android --profile preview
```

This creates an APK you can test on physical Android devices or emulators.

**Output**: Download link to your APK
- Transfer to Android device or use `adb install`
- Test all functionality before production build

### Step 6: Build App Bundle for Production

```bash
eas build --platform android --profile production
```

This creates an App Bundle (.aab) optimized for Google Play Store.

**What happens**:
1. EAS compiles your app on their servers
2. Signs it with your credentials
3. Provides download link (available for 30 days)

### Step 7: Automate Future Builds (Optional)

Configure GitHub Actions for automatic builds on commit:

```bash
eas build --platform android --auto-submit --non-interactive
```

---

## 🌐 Part 2: Host Server on Vercel

### Step 1: Prepare Server for Vercel

Your server needs a Vercel configuration. Create [vercel.json](./server/vercel.json):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "TMDB_API_KEY": "@tmdb_api_key"
  },
  "functions": {
    "src/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js",
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
  ]
}
```

### Step 2: Create `.vercelignore`

Create [server/.vercelignore](./.vercelignore):

```
node_modules
.env
.env.local
*.log
.DS_Store
src/**/*.test.ts
```

### Step 3: Update Environment Variables

In [server/.env](./server/.env), ensure you have:

```env
TMDB_API_KEY=your_actual_key_here
```

### Step 4: Deploy to Vercel

**Option A: GitHub Integration (Recommended)**

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click **"New Project"**
4. Import your GitHub repository
5. Select **"Root Directory"**: `server`
6. Add environment variable:
   - Name: `TMDB_API_KEY`
   - Value: Your TMDB API key
7. Click **Deploy**

**Option B: Vercel CLI**

```bash
cd server

# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

When prompted:
- Select your Vercel account
- Link to existing project or create new
- Add environment variable `TMDB_API_KEY` when prompted

### Step 5: Test Vercel Deployment

```bash
# Get your Vercel URL (shown after deployment or check vercel.json)
curl https://your-server.vercel.app/health

# Should return:
# {"status":"ok","timestamp":"2026-05-27T..."}
```

### Step 6: Update App with Production URL

Once you have your Vercel URL, update your app's environment:

**Frontend .env**:
```
EXPO_PUBLIC_TMDB_BACKEND_URL=https://your-server.vercel.app/api/tmdb
```

Then rebuild with EAS:
```bash
eas build --platform android --profile production
```

---

## 🔐 Environment Variables Checklist

### Frontend (.env)
- [ ] `EXPO_PUBLIC_TMDB_BACKEND_URL` = Your Vercel server URL

### Backend (server/.env)
- [ ] `TMDB_API_KEY` = Your actual TMDB API key
- [ ] `PORT` = 3000 (default, Vercel sets automatically)

### Vercel Dashboard
- [ ] Add `TMDB_API_KEY` secret in project settings

---

## ⚠️ Important Security Notes

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use Vercel secrets** for sensitive data, not hardcoded
3. **Rotate API keys regularly** if compromised
4. **Enable CORS carefully** - Your frontend domain is already whitelisted

---

## 🐛 Troubleshooting

### EAS Build Issues

**Build fails with "Credentials not found"**
```bash
eas credentials --reset
eas credentials  # Reconfigure
```

**Build hangs or timeout**
```bash
# Try verbose output
eas build --platform android --verbose
```

### Vercel Deployment Issues

**"TMDB_API_KEY is not set"**
- Verify environment variable added in Vercel dashboard
- Wait 5 minutes for rebuild after adding env var
- Redeploy: `vercel --prod`

**CORS errors on frontend**
- Ensure CORS middleware is enabled in `server/src/index.ts`
- Check that request URL matches exactly

**500 errors on API calls**
- Check Vercel logs: `vercel logs` or dashboard
- Test locally first: `cd server && npm run dev`

---

## 📊 Useful Commands Reference

### EAS Commands
```bash
eas login                                    # Authenticate
eas credentials                              # Manage signing credentials
eas build --platform android                 # Build
eas build --platform android --profile preview   # Test APK
eas build --platform android --profile production # Release bundle
eas build --status                           # Check build status
eas logs                                     # View build logs
eas analytics                                # View analytics
```

### Vercel Commands
```bash
vercel login                                 # Authenticate
vercel                                       # Preview deploy
vercel --prod                                # Production deploy
vercel env pull                              # Pull env vars
vercel logs [project]                        # View logs
vercel list                                  # List deployments
```

---

## ✅ Deployment Checklist

- [ ] EAS credentials configured for Android
- [ ] Backend URL updated in frontend .env
- [ ] `vercel.json` created in server directory
- [ ] Environment variables added to Vercel
- [ ] Test build created and tested on Android device
- [ ] Vercel server responding to health check
- [ ] Production build created
- [ ] App ready for Google Play submission

---

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit to App Stores](https://docs.expo.dev/submit/introduction/)
- [Vercel Node.js Deployment](https://vercel.com/docs/frameworks/nodejs)
- [Express on Vercel](https://vercel.com/templates/node/express)

---

**Need help?** Check the troubleshooting section or review individual guide sections above.
