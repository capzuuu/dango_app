/**
 * Custom hooks for TMDB data fetching.
 * Each hook returns { data, loading, error } and fetches on mount.
 */

import {
    getAnime,
    getAnimeMostFavorited,
    getAnimeNowAiring,
    getAnimeTopRated,
    getAnimeUpcoming,
    getAsianShorts,
    getCDramas,
    getKDramas,
    getKDramasMostFavorited,
    getKDramasNowAiring,
    getKDramasTopRated,
    getKDramasUpcoming,
    getMostFavoritedMovies,
    getMostFavoritedTV,
    getMovieDetail,
    getNowAiringTV,
    getNowPlayingMovies,
    getPopularMovies,
    getPopularTV,
    getRecentMovies,
    getRecentTV,
    getSeasonEpisodes,
    getShowDetail,
    getTaiwanDramas,
    getThaiDramas,
    getTopRatedMovies,
    getTopRatedTV,
    getTrendingAll,
    getTrendingMovies,
    getTrendingTV,
    getUpcomingMovies,
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

export function useNowPlayingMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getNowPlayingMovies(), 'now-playing-movies');
}

export function useUpcomingMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getUpcomingMovies(), 'upcoming-movies');
}

export function useMostFavoritedMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getMostFavoritedMovies(), 'most-favorited-movies');
}

export function useNowAiringTV() {
  return useFetch<TMDBPage<TMDBShow>>(() => getNowAiringTV(), 'now-airing-tv');
}

export function useMostFavoritedTV() {
  return useFetch<TMDBPage<TMDBShow>>(() => getMostFavoritedTV(), 'most-favorited-tv');
}

export function useRecentMovies() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getRecentMovies(), 'recent-movies');
}

export function useRecentTV() {
  return useFetch<TMDBPage<TMDBShow>>(() => getRecentTV(), 'recent-tv');
}

export function useKDramas() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramas(), 'kdramas');
}

export function useKDramas2() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramas(2), 'kdramas-2');
}

export function useKDramas3() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramas(3), 'kdramas-3');
}

export function useKDramasTopRated() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramasTopRated(), 'kdramas-top-rated');
}

export function useKDramasNowAiring() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramasNowAiring(), 'kdramas-now-airing');
}

export function useKDramasMostFavorited() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramasMostFavorited(), 'kdramas-most-favorited');
}

export function useKDramasUpcoming() {
  return useFetch<TMDBPage<TMDBShow>>(() => getKDramasUpcoming(), 'kdramas-upcoming');
}

export function useAnime() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnime(), 'anime');
}

export function useAnime2() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnime(2), 'anime-2');
}

export function useAnime3() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnime(3), 'anime-3');
}

export function useAnimeTopRated() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnimeTopRated(), 'anime-top-rated');
}

export function useAnimeNowAiring() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnimeNowAiring(), 'anime-now-airing');
}

export function useAnimeMostFavorited() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnimeMostFavorited(), 'anime-most-favorited');
}

export function useAnimeUpcoming() {
  return useFetch<TMDBPage<TMDBShow>>(() => getAnimeUpcoming(), 'anime-upcoming');
}

export function useCDramas() {
  return useFetch<TMDBPage<TMDBShow>>(() => getCDramas(), 'cdramas');
}

export function useAsianShorts() {
  return useFetch<TMDBPage<TMDBMovie>>(() => getAsianShorts(), 'asian-shorts');
}

export function useThaiDramas() {
  return useFetch<TMDBPage<TMDBShow>>(() => getThaiDramas(), 'thai-dramas');
}

export function useTaiwanDramas() {
  return useFetch<TMDBPage<TMDBShow>>(() => getTaiwanDramas(), 'taiwan-dramas');
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
