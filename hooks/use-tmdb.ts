/**
 * Custom hooks for TMDB data fetching.
 * Each hook returns { data, loading, error } and fetches on mount.
 */

import {
    getAnime,
    getKDramas,
    getMovieDetail,
    getPopularMovies,
    getPopularTV,
    getSeasonEpisodes,
    getShowDetail,
    getTopRatedMovies,
    getTopRatedTV,
    getTrendingAll,
    getTrendingMovies,
    getTrendingTV,
    searchMulti,
    TMDBItem,
    TMDBMovie,
    TMDBMovieDetail,
    TMDBPage,
    TMDBShow,
    TMDBShowDetail,
} from '@/lib/tmdb';
import { useEffect, useRef, useState } from 'react';

// ─── Generic fetch hook ───────────────────────────────────────────────────────

function useFetch<T>(fetcher: () => Promise<T>, cacheKey: string, skip = false) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then(result => {
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, skip]);

  return { data, loading, error };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTrendingAll() {
  return useFetch<TMDBPage<TMDBItem>>(() => getTrendingAll(), 'trending-all');
}

export function useTrendingMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getTrendingMovies(), 'trending-movies');
}

export function useTrendingTV() {
  return useFetch<TMDBPage<TMDBShow>>(() => getTrendingTV(), 'trending-tv');
}

export function usePopularMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getPopularMovies(), 'popular-movies');
}

export function usePopularTV() {
  return useFetch<TMDBPage<TMDBShow>>(() => getPopularTV(), 'popular-tv');
}

export function useTopRatedMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getTopRatedMovies(), 'top-rated-movies');
}

export function useTopRatedTV() {
  return useFetch<TMDBPage<TMDBShow>>(() => getTopRatedTV(), 'top-rated-tv');
}

export function useKDramas() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramas(), 'kdramas');
}

export function useAnime() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnime(), 'anime');
}

// ─── Detail hooks ─────────────────────────────────────────────────────────────

export function useMovieDetail(id: number) {
  return useFetch<TMDBMovieDetail>(() => getMovieDetail(id), `movie-${id}`, id === 0);
}

export function useShowDetail(id: number) {
  return useFetch<TMDBShowDetail>(() => getShowDetail(id), `show-${id}`, id === 0);
}

export function useSeasonEpisodes(showId: number, season: number) {
  return useFetch<{ episodes: import('@/lib/tmdb').TMDBEpisode[] }>(
    () => getSeasonEpisodes(showId, season),
    `episodes-${showId}-${season}`,
    showId === 0,
  );
}

// ─── Search hook ──────────────────────────────────────────────────────────────

export function useSearch(query: string) {
  const [data, setData] = useState<TMDBPage<TMDBItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    let cancelled = false;

    const timer = setTimeout(() => {
      searchMulti(trimmed)
        .then(result => {
          if (!cancelled) { setData(result); setLoading(false); }
        })
        .catch(err => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setLoading(false);
          }
        });
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return { data, loading, error };
}
