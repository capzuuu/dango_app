import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import { kvIncrWithTTL } from '../utils/kv';

type Options = {
    windowSeconds: number;
    maxRequests: number;
    clientIdFromHeaders?: string[];
};

function getClientIp(req: Request, headersToCheck: string[] = []) {
    // Vercel/Proxies commonly set x-forwarded-for: "client, proxy1, proxy2"
    for (const h of headersToCheck) {
        const v = req.header(h);
        if (v) return v.split(',')[0].trim();
    }
    return (req.ip ?? '').toString();
}

export function rateLimitKV(options: Options) {
    const { windowSeconds, maxRequests, clientIdFromHeaders = [] } = options;

    return async function rateLimit(req: Request, res: Response, next: NextFunction) {
        const ip = getClientIp(req, clientIdFromHeaders);
        const route = req.baseUrl + req.path;

        // Keyed by client + route
        const rawKey = `rl:${ip}:${route}`;
        const key = crypto.createHash('sha256').update(rawKey).digest('hex');

        try {
            const current = await kvIncrWithTTL(key, windowSeconds);

            if (current > maxRequests) {
                return res.status(429).json({ error: 'rate_limited' });
            }

            next();
        } catch (e) {
            // Fail open on KV issues to avoid taking down the API.
            next();
        }
    };
}

