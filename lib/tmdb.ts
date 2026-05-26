/**
 * TMDB API v3 client
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 *
 * Set EXPO_PUBLIC_TMDB_ACCESS_TOKEN in your .env file.
 * Get a free token at: https://www.themoviedb.org/settings/api
 */

const ACCESS_TOKEN = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN ?? '';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p';

if (!ACCESS_TOKEN) {
  console.warn('[TMDB] EXPO_PUBLIC_TMDB_ACCESS_TOKEN is not set. Add it to your .env file.');
}

// ─── Image helpers ────────────────────────────────────────────────────────────

export const posterUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342') =>
  path ? /^https?:\/\//i.test(path) ? path : `${IMAGE_BASE}/${size}${path}` : null;

export const backdropUrl = (path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780') =>
  path ? /^https?:\/\//i.test(path) ? path : `${IMAGE_BASE}/${size}${path}` : null;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'movie';
  popularity: number;
}

export interface TMDBShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  media_type?: 'tv';
  popularity: number;
}

export type TMDBItem = (TMDBMovie | TMDBShow) & { media_type: 'movie' | 'tv' };

export interface TMDBPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetail extends TMDBMovie {
  tagline: string;
  runtime: number;
  genres: { id: number; name: string }[];
  status: string;
  budget: number;
  revenue: number;
  production_countries: { iso_3166_1: string; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos?: {
    results: { id: string; key: string; name: string; type: string; site: string }[];
  };
  similar?: TMDBPage<TMDBMovie>;
}

export interface TMDBShowDetail extends TMDBShow {
  tagline: string;
  genres: { id: number; name: string }[];
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    air_date: string;
  }[];
  created_by: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  videos?: {
    results: { id: string; key: string; name: string; type: string; site: string }[];
  };
  similar?: TMDBPage<TMDBShow>;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
  air_date: string;
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // Build query string manually — React Native's JS engine may not have URL constructor
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const msg = `TMDB ${res.status}: ${res.statusText} — ${endpoint} — ${body}`;
    console.error('[TMDB]', msg);
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** Trending movies this week */
export const getTrendingMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/trending/movie/week', { page: String(page) });

/** Trending TV shows this week */
export const getTrendingTV = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/trending/tv/week', { page: String(page) });

/** Trending all (movies + TV) */
export const getTrendingAll = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBItem>>('/trending/all/week', { page: String(page) });

/** Popular movies */
export const getPopularMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/movie/popular', { page: String(page) });

/** Popular TV shows */
export const getPopularTV = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/tv/popular', { page: String(page) });

/** Top-rated movies */
export const getTopRatedMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/movie/top_rated', { page: String(page) });

/** Top-rated TV shows */
export const getTopRatedTV = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/tv/top_rated', { page: String(page) });

/** Now playing in theatres */
export const getNowPlayingMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/movie/now_playing', { page: String(page) });

/** Upcoming movies */
export const getUpcomingMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/movie/upcoming', { page: String(page) });

/** Most favorited movies (vote_count weighted) */
export const getMostFavoritedMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/discover/movie', {
    sort_by: 'vote_count.desc',
    page: String(page),
  });

/** Now airing TV */
export const getNowAiringTV = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/tv/on_the_air', { page: String(page) });

/** Most favorited TV */
export const getMostFavoritedTV = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    sort_by: 'vote_count.desc',
    page: String(page),
  });

/** Recently added movies (sorted by release date) */
export const getRecentMovies = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/discover/movie', {
    sort_by: 'primary_release_date.desc',
    'vote_count.gte': '50',
    page: String(page),
  });

/** Recently added TV */
export const getRecentTV = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    sort_by: 'first_air_date.desc',
    'vote_count.gte': '20',
    page: String(page),
  });

/**
 * K-Drama: Korean TV shows
 */
export const getKDramas = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '18',
    sort_by: 'popularity.desc',
    page: String(page),
  });

export const getKDramasTopRated = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '18',
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    page: String(page),
  });

export const getKDramasNowAiring = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '18',
    sort_by: 'first_air_date.desc',
    page: String(page),
  });

export const getKDramasMostFavorited = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '18',
    sort_by: 'vote_count.desc',
    page: String(page),
  });

export const getKDramasUpcoming = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '18',
    sort_by: 'first_air_date.desc',
    'first_air_date.gte': new Date().toISOString().slice(0, 10),
    page: String(page),
  });

/**
 * Anime: Japanese animation
 */
export const getAnime = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'JP',
    with_genres: '16',
    sort_by: 'popularity.desc',
    page: String(page),
  });

export const getAnimeTopRated = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'JP',
    with_genres: '16',
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    page: String(page),
  });

export const getAnimeNowAiring = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'JP',
    with_genres: '16',
    sort_by: 'first_air_date.desc',
    page: String(page),
  });

export const getAnimeMostFavorited = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'JP',
    with_genres: '16',
    sort_by: 'vote_count.desc',
    page: String(page),
  });

export const getAnimeUpcoming = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'JP',
    with_genres: '16',
    sort_by: 'first_air_date.desc',
    'first_air_date.gte': new Date().toISOString().slice(0, 10),
    page: String(page),
  });

/** C-Drama: Chinese TV shows */
export const getCDramas = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'CN',
    with_genres: '18',
    sort_by: 'popularity.desc',
    page: String(page),
  });

/** Short Asian films / shorts */
export const getAsianShorts = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/discover/movie', {
    with_origin_country: 'CN|KR|JP|TH',
    sort_by: 'popularity.desc',
    'with_runtime.lte': '40',
    page: String(page),
  });

/** Thai dramas */
export const getThaiDramas = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'TH',
    with_genres: '18',
    sort_by: 'popularity.desc',
    page: String(page),
  });

/** Taiwanese dramas */
export const getTaiwanDramas = (page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/discover/tv', {
    with_origin_country: 'TW',
    with_genres: '18',
    sort_by: 'popularity.desc',
    page: String(page),
  });

/** Movie details with credits + videos + similar */
export const getMovieDetail = (id: number) =>
  tmdbFetch<TMDBMovieDetail>(`/movie/${id}`, {
    append_to_response: 'credits,videos,similar',
  });

/** TV show details with credits + videos + similar */
export const getShowDetail = (id: number) =>
  tmdbFetch<TMDBShowDetail>(`/tv/${id}`, {
    append_to_response: 'credits,videos,similar',
  });

/** Season episodes */
export const getSeasonEpisodes = (showId: number, season: number) =>
  tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${showId}/season/${season}`);

/** Search multi (movies + TV) */
export const searchMulti = (query: string, page = 1) =>
  tmdbFetch<TMDBPage<TMDBItem>>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  });

/** Search movies only */
export const searchMovies = (query: string, page = 1) =>
  tmdbFetch<TMDBPage<TMDBMovie>>('/search/movie', {
    query,
    page: String(page),
  });

/** Search TV only */
export const searchTV = (query: string, page = 1) =>
  tmdbFetch<TMDBPage<TMDBShow>>('/search/tv', {
    query,
    page: String(page),
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the display title regardless of movie vs TV */
export const getTitle = (item: TMDBMovie | TMDBShow): string =>
  (item as TMDBMovie).title ?? (item as TMDBShow).name ?? 'Unknown';

/** Returns the release year */
export const getYear = (item: TMDBMovie | TMDBShow): string => {
  const date = (item as TMDBMovie).release_date ?? (item as TMDBShow).first_air_date ?? '';
  return date.slice(0, 4);
};

/** Formats vote average to one decimal */
export const formatRating = (v: number) => v.toFixed(1);

/** Genre ID → name map (common ones) */
export const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV-specific
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
};
