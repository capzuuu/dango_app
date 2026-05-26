import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { tmdbRouter } from './routes/tmdb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TMDB_API_KEY || '';

if (!API_KEY) {
    console.error('❌ TMDB_API_KEY is not set in environment variables');
    process.exit(1);
}

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── TMDB API routes ──────────────────────────────────────────────────────
app.use('/api/tmdb', tmdbRouter(API_KEY));

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📍 TMDB proxy available at http://localhost:${PORT}/api/tmdb`);
});
