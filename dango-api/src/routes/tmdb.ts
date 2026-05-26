import { Router } from 'express';

import { tmdbFetch } from '../utils/tmdb';

const router = Router();

// Helper: pass through only the query params we expect from the app.
// (Prevent open proxy abuse.)
function pickPageAndQuery(req: import('express').Request) {
    const page = req.query.page;
    const q: Record<string, string> = {};
    if (typeof page === 'string' && page.length > 0) q.page = page;
    // allowlist additional simple keys used in current app calls
    for (const k of [
        'append_to_response',
        'sort_by',
        'with_origin_country',
        'with_genres',
        'include_adult',
        'query',
        'vote_count.gte',
        'first_air_date.gte',
        'first_air_date.desc',
        'primary_release_date.desc',
        'vote_average.desc',
        'vote_count.desc',
        'with_runtime.lte',
        'with_origin_country'
    ]) {
        const v = req.query[k];
        if (typeof v === 'string' && v.length > 0) q[k] = v;
    }
    return q;
}

router.get('/health', (_req, res) => res.json({ ok: true }));

// Trending
router.get('/trending/all/week', async (req, res) => {
    const data = await tmdbFetch('/trending/all/week', pickPageAndQuery(req));
    res.json(data);
});
router.get('/trending/movie/week', async (req, res) => {
    const data = await tmdbFetch('/trending/movie/week', pickPageAndQuery(req));
    res.json(data);
});
router.get('/trending/tv/week', async (req, res) => {
    const data = await tmdbFetch('/trending/tv/week', pickPageAndQuery(req));
    res.json(data);
});

// Popular / Top / Now
router.get('/movie/popular', async (req, res) => {
    res.json(await tmdbFetch('/movie/popular', pickPageAndQuery(req)));
});
router.get('/tv/popular', async (req, res) => {
    res.json(await tmdbFetch('/tv/popular', pickPageAndQuery(req)));
});
router.get('/movie/top_rated', async (req, res) => {
    res.json(await tmdbFetch('/movie/top_rated', pickPageAndQuery(req)));
});
router.get('/tv/top_rated', async (req, res) => {
    res.json(await tmdbFetch('/tv/top_rated', pickPageAndQuery(req)));
});
router.get('/tv/on_the_air', async (req, res) => {
    res.json(await tmdbFetch('/tv/on_the_air', pickPageAndQuery(req)));
});

// Discover endpoints used by app
router.get('/discover/movie', async (req, res) => {
    res.json(await tmdbFetch('/discover/movie', pickPageAndQuery(req)));
});
router.get('/discover/tv', async (req, res) => {
    res.json(await tmdbFetch('/discover/tv', pickPageAndQuery(req)));
});

// Details
router.get('/movie/:id', async (req, res) => {
    const id = Number(req.params.id);
    const data = await tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar' });
    res.json(data);
});

router.get('/tv/:id', async (req, res) => {
    const id = Number(req.params.id);
    const data = await tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar' });
    res.json(data);
});

router.get('/tv/:showId/season/:seasonNumber', async (req, res) => {
    const showId = Number(req.params.showId);
    const seasonNumber = Number(req.params.seasonNumber);
    const data = await tmdbFetch(`/tv/${showId}/season/${seasonNumber}`);
    res.json(data);
});

// Search
router.get('/search/multi', async (req, res) => {
    // Allow only query + page from client
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const page = typeof req.query.page === 'string' ? req.query.page : '1';
    if (!query) return res.status(400).json({ error: 'query_missing' });

    res.json(
        await tmdbFetch('/search/multi', {
            query,
            page,
            include_adult: 'false'
        })
    );
});

router.get('/search/movie', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const page = typeof req.query.page === 'string' ? req.query.page : '1';
    if (!query) return res.status(400).json({ error: 'query_missing' });

    res.json(await tmdbFetch('/search/movie', { query, page }));
});

router.get('/search/tv', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const page = typeof req.query.page === 'string' ? req.query.page : '1';
    if (!query) return res.status(400).json({ error: 'query_missing' });

    res.json(await tmdbFetch('/search/tv', { query, page }));
});

export const tmdbRouter = router;

