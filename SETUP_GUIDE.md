# 🚀 Backend Setup Guide

Your Dango project now has a secure backend! Here's how to get it running.

## What Changed?

✅ **Backend Created**: Express.js server in `/server`  
✅ **API Key Protected**: Moved from frontend to backend  
✅ **Frontend Updated**: Now calls your backend instead of TMDB directly  
✅ **Configuration Ready**: All `.env` files pre-configured

## Installation

### Quick Setup (All at Once)

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
bash setup.sh
```

### Manual Setup

**Step 1: Install Frontend Dependencies**
```bash
npm install
```

**Step 2: Install Backend Dependencies**
```bash
cd server
npm install
cd ..
```

## Running the App

### Terminal 1 - Start Backend Server
```bash
cd server
npm run dev
```

Expected output:
```
✅ Server running on http://localhost:3000
📍 TMDB proxy available at http://localhost:3000/api/tmdb
```

### Terminal 2 - Start Frontend
```bash
npx expo start
```

Then choose your platform (w for web, i for iOS simulator, a for Android emulator, or scan QR for Expo Go)

## Project Files

### Backend Files (NEW)
```
server/
├── src/
│   ├── index.ts          # Main Express server
│   └── routes/
│       └── tmdb.ts       # TMDB proxy routes
├── .env                  # Your TMDB API key (SECRET!)
├── .env.example          # Template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # Backend documentation
```

### Updated Frontend Files
```
.env                      # Now points to backend at localhost:3000
lib/tmdb.ts              # Updated to call backend instead of TMDB
```

## Configuration

### Frontend (.env)
```
EXPO_PUBLIC_TMDB_BACKEND_URL=http://localhost:3000/api/tmdb
```

### Backend (server/.env)
```
PORT=3000
TMDB_API_KEY=your_key_here
```

The backend `.env` is already pre-configured with your TMDB API key!

## How It Works

```
Frontend (Expo App)
    ↓
    GET /api/tmdb/trending/tv/week
    ↓
Backend (Express Server)
    ↓
    GET https://api.themoviedb.org/3/trending/tv/week?api_key=***
    ↓
TMDB API
    ↓
    ← JSON Response
    ↓
Backend
    ↓
    ← JSON Response (no key in response)
    ↓
Frontend
```

## Troubleshooting

### Backend won't start
```bash
# Make sure you're in the server directory
cd server

# Try clearing node_modules
rm -rf node_modules
npm install

# Then run again
npm run dev
```

### Frontend can't connect to backend
- Make sure backend is running on `http://localhost:3000`
- Check the browser console for errors
- Verify `EXPO_PUBLIC_TMDB_BACKEND_URL` in `.env`

### "Cannot find module" error
```bash
# In the server directory
npm install
npm run typecheck
```

### CORS errors
- Make sure backend is running first
- Try clearing cache: `npx expo start -c`

## Next Steps

### Development
- Backend code is in `server/src/`
- Frontend code is in `app/`
- Frontend calls backend via `lib/tmdb.ts`

### Deployment

**For Production:**

1. **Deploy Backend First**
   - Deploy to Railway, Heroku, or similar
   - Set environment variable: `TMDB_API_KEY=your_key`
   - Get your backend URL (e.g., `https://dango-api.railway.app`)

2. **Update Frontend**
   - Set `EXPO_PUBLIC_TMDB_BACKEND_URL=https://dango-api.railway.app/api/tmdb`
   - Deploy frontend with EAS

### Adding Features

You can now add middleware to the backend:
- ✅ Rate limiting
- ✅ Request logging
- ✅ Response caching
- ✅ Authentication
- ✅ Analytics
- ✅ Error tracking

## Files to Review

- `README.md` - Main project README
- `server/README.md` - Backend documentation
- `lib/tmdb.ts` - Frontend API client
- `server/src/routes/tmdb.ts` - Backend routes

## Security Benefits

🔒 API key never leaves the backend  
🔒 No API key in client code  
🔒 Can add authentication  
🔒 Can validate requests  
🔒 Can implement rate limiting  

---

Happy coding! 🎉
