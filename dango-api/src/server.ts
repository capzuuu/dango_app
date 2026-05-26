import cors from 'cors';
import 'dotenv/config';

import express from 'express';
import { env } from './env';
import { rateLimitKV } from './middleware/rateLimitKV';
import { secretHeaderGuard } from './middleware/secretHeaderGuard';
import { tmdbRouter } from './routes/tmdb';

const app = express();

// JSON body parsing (not strictly needed for GET proxy routes, but harmless)
app.use(express.json({ limit: '1mb' }));

// CORS
const corsOrigins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: corsOrigins.length > 0 ? corsOrigins : '*'
    })
);

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

// Secret header + rate limiting for all API routes under /tmdb
app.use('/tmdb', secretHeaderGuard);
app.use(
    '/tmdb',
    rateLimitKV({
        windowSeconds: env.DANGO_RATE_LIMIT_WINDOW_SECONDS,
        maxRequests: env.DANGO_RATE_LIMIT_MAX_REQUESTS,
        // Keep keying stable across providers
        clientIdFromHeaders: ['x-forwarded-for', 'cf-connecting-ip']
    })
);

app.use('/tmdb', tmdbRouter);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[dango-api] listening on :${port} (${env.NODE_ENV})`);
});

