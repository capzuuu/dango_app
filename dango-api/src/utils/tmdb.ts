import { env } from '../env';

const BASE_URL = 'https://api.themoviedb.org/3';

type Query = Record<string, string | number | boolean | undefined | null>;

function toQueryString(params: Query): string {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
    return entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
}

export async function tmdbFetch<T>(path: string, params: Query = {}): Promise<T> {
    const qs = toQueryString(params);
    const url = `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        const msg = `TMDB ${res.status}: ${res.statusText} — ${path} — ${body}`;
        // eslint-disable-next-line no-console
        console.error('[dango-api][tmdb]', msg);
        throw new Error(msg);
    }

    return (await res.json()) as T;
}

