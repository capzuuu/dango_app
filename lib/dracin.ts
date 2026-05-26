const DRACIN_BASE_URL = process.env.EXPO_PUBLIC_DRACIN_BASE_URL ?? 'https://api-dracin.dobda.id';
const DRACIN_REELS_ENDPOINT = process.env.EXPO_PUBLIC_DRACIN_REELS_ENDPOINT ?? '/v1/drama/list';
const DRACIN_API_KEY = process.env.EXPO_PUBLIC_DRACIN_API_KEY ?? '';

export interface DracinReel {
  id: string;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  year: string;
  rating: number;
  platform: string;
  episodes: number | null;
  language: string;
}

export interface DracinPage {
  page: number;
  results: DracinReel[];
  total_pages: number;
  total_results: number;
}

type UnknownRecord = Record<string, any>;

function firstString(source: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNumber(source: UnknownRecord, keys: string[]): number {
  for (const key of keys) {
    const value = source[key];
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function asAbsoluteUrl(value: string): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${DRACIN_BASE_URL}${value}`;
  return value;
}

function extractItems(payload: any): UnknownRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  return [];
}

function normalizeReel(raw: UnknownRecord, index: number): DracinReel {
  const id = firstString(raw, ['id', 'drama_id', 'series_id', 'book_id', 'slug']) || String(index + 1);
  const title = firstString(raw, ['title', 'name', 'drama_title', 'series_name', 'book_name']) || 'Untitled Drama';
  const poster = firstString(raw, ['poster', 'poster_url', 'cover', 'cover_url', 'image', 'image_url', 'thumbnail']);
  const backdrop = firstString(raw, ['backdrop', 'backdrop_url', 'banner', 'banner_url', 'horizontal_cover']);
  const video = firstString(raw, ['video_url', 'play_url', 'stream_url', 'm3u8', 'mp4']);
  const source = firstString(raw, ['url', 'share_url', 'web_url', 'source_url']);
  const release = firstString(raw, ['year', 'release_year', 'release_date', 'created_at', 'updated_at']);

  return {
    id,
    title,
    overview: firstString(raw, ['overview', 'description', 'desc', 'synopsis', 'summary']),
    posterUrl: asAbsoluteUrl(poster),
    backdropUrl: asAbsoluteUrl(backdrop),
    videoUrl: asAbsoluteUrl(video),
    sourceUrl: asAbsoluteUrl(source),
    year: release.slice(0, 4),
    rating: firstNumber(raw, ['rating', 'score', 'vote_average']),
    platform: firstString(raw, ['platform', 'provider', 'source']) || 'Dracin',
    episodes: firstNumber(raw, ['episodes', 'episode_count', 'total_episodes']) || null,
    language: firstString(raw, ['language', 'lang']) || 'id',
  };
}

async function dracinFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const qs = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const url = `${DRACIN_BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (DRACIN_API_KEY) {
    headers.Authorization = `Bearer ${DRACIN_API_KEY}`;
    headers['x-api-key'] = DRACIN_API_KEY;
  }

  const res = await fetch(url, { headers });
  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message = typeof body === 'string' ? body.slice(0, 180) : JSON.stringify(body);
    throw new Error(`Dracin ${res.status}: ${message}`);
  }

  return body as T;
}

export async function getDracinReels(params: Record<string, string> = {}): Promise<DracinPage> {
  const payload = await dracinFetch<any>(DRACIN_REELS_ENDPOINT, params);
  const results = extractItems(payload).map(normalizeReel);

  return {
    page: Number(payload?.page ?? payload?.data?.page ?? params.page ?? 1),
    results,
    total_pages: Number(payload?.total_pages ?? payload?.data?.total_pages ?? 1),
    total_results: Number(payload?.total_results ?? payload?.data?.total_results ?? results.length),
  };
}

export function stableDracinNumberId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 900000000;
}
