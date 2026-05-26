import { Request, Response, Router } from 'express';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Factory function to create TMDB router with API key
 * The API key is passed from the server and never exposed to the client
 */
export function tmdbRouter(apiKey: string): Router {
    const router = Router();

    /**
     * Generic proxy handler for TMDB endpoints
     * Matches any path and forwards to TMDB with the secure API key
     */
    router.all('*', async (req: Request, res: Response) => {
        try {
            // Get the full path from the request
            // /api/tmdb/trending/all/week -> /trending/all/week
            const path = req.path;
            const query = new URLSearchParams(req.query as Record<string, string>);

            // Add the API key (never exposed to client)
            query.set('api_key', apiKey);

            // Build the full TMDB URL
            const url = `${TMDB_BASE_URL}${path}?${query.toString()}`;

            // Forward the request to TMDB
            const response = await fetch(url, {
                method: req.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
            });

            // Check for errors
            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                console.error(
                    `[TMDB Proxy] Error: ${response.status} ${response.statusText}`,
                    `Path: ${path}`,
                    `Error: ${errorBody.slice(0, 200)}`
                );
                return res.status(response.status).json({
                    error: `TMDB API error: ${response.statusText}`,
                    status: response.status,
                });
            }

            // Parse and return the response
            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('[TMDB Proxy] Fetch error:', error);
            res.status(500).json({
                error: 'Failed to fetch from TMDB API',
            });
        }
    });

    return router;
}
