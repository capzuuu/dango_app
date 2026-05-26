# dango-api

Express + TypeScript backend for Dango.

## Endpoints
- `GET /health`
- `GET /tmdb/*` (requires secret header + KV rate limiting)

## Security
All requests to `/tmdb/*` must include:
- Header name: `DANGO_API_SECRET_HEADER_NAME` (default `x-dango-secret`)
- Header value: `DANGO_API_SECRET`

Rate limit is enforced per-client+route using Upstash/Vercel KV:
- `DANGO_RATE_LIMIT_WINDOW_SECONDS`
- `DANGO_RATE_LIMIT_MAX_REQUESTS`

## Env vars
Copy `.env.example` to `.env` and fill values.

## Local dev
```bash
cd dango-api
npm i
npm run dev
```

Test:
```bash
curl -sS http://localhost:3001/health
curl -sS -H "x-dango-secret: YOUR_SECRET" "http://localhost:3001/tmdb/trending/all/week?page=1"
```

## Deploy (Vercel)
Deploy the `dango-api` as a Node server.

Set Vercel environment variables:
- `DANGO_API_SECRET`
- `TMDB_ACCESS_TOKEN`
- Upstash/Vercel KV vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- (optional) `CORS_ORIGINS`

If you use a custom domain for the API, ensure CORS allows the Expo web origin (if using web).

