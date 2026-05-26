# Dango Server

Express.js backend for Dango that proxies TMDB API requests and keeps the API key secure on the server.

## Why?

- 🔒 **Secure**: API key stays on the server, never exposed to the client
- ⚡ **Fast**: Direct server-to-server communication with TMDB
- 🛡️ **Controlled**: Rate limiting and request validation can be added easily
- 📦 **Scalable**: Separate backend and frontend

## Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Create `.env` file

Copy `.env.example` to `.env` and add your TMDB API key:

```bash
cp .env.example .env
```

Then edit `.env`:

```
PORT=3000
TMDB_API_KEY=your_actual_api_key_here
```

### 3. Start the server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production (compiled):**

```bash
npm run build
npm start
```

## Usage

The server proxies all requests to `/api/tmdb/*` to the TMDB API:

```
GET /api/tmdb/trending/tv/week?page=1
→ https://api.themoviedb.org/3/trending/tv/week?page=1&api_key=***
```

## Frontend Configuration

Update your frontend to call the backend instead of TMDB directly:

```typescript
// Before: https://api.themoviedb.org/3
// After:  http://localhost:3000/api/tmdb
```

Example with curl:

```bash
curl http://localhost:3000/api/tmdb/trending/tv/week
```

## API Endpoints

All TMDB v3 endpoints are available at `/api/tmdb/{endpoint}`:

- `GET /api/tmdb/trending/tv/week`
- `GET /api/tmdb/discover/tv`
- `GET /api/tmdb/movie/popular`
- `GET /api/tmdb/search/multi?query=...`
- etc.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port (default: 3000) |
| `TMDB_API_KEY` | **Yes** | Your TMDB API key |

## Deployment

### Using Railway, Heroku, or similar

1. Set environment variables in your hosting dashboard
2. Deploy the backend separately
3. Update frontend to call the deployed backend URL
4. Frontend build no longer needs `TMDB_API_KEY`

Example with environment variable:

```bash
TMDB_API_KEY=your_key PORT=3000 npm start
```

## Development

### Building

```bash
npm run build
```

### Type checking

```bash
npm run typecheck
```

### Running in development mode

```bash
npm run dev
```

## Files

- `src/index.ts` - Main Express server
- `src/routes/tmdb.ts` - TMDB proxy routes
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template
