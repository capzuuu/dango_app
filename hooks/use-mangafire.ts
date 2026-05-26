import { getMangaFireHome, MANGAFIRE_FALLBACK_HOME, MangaFireHome, MangaFireItem, searchMangaFire } from '@/lib/mangafire';
import { useEffect, useState } from 'react';

function uniqueManga(items: MangaFireItem[]): MangaFireItem[] {
  const seen = new Set<string>();

  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function filterManga(items: MangaFireItem[], query: string): MangaFireItem[] {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return [];

  return uniqueManga(items).filter(item => {
    const title = item.title.toLowerCase();
    return words.every(word => title.includes(word));
  });
}

async function searchMangaFireWithFallback(query: string): Promise<MangaFireItem[]> {
  try {
    const mangaFireResults = await searchMangaFire(query);

    if (mangaFireResults.length > 0) return mangaFireResults;
  } catch {
    // MangaFire often blocks direct search requests. The local/home fallback below keeps search useful.
  }

  const home = await getMangaFireHome().catch(() => MANGAFIRE_FALLBACK_HOME);
  const localResults = filterManga([
    ...home.featured,
    ...home.mostViewed,
    ...home.recentlyUpdated,
    ...home.newRelease,
    ...MANGAFIRE_FALLBACK_HOME.featured,
  ], query);

  return localResults;
}

export function useMangaFireHome() {
  const [data, setData] = useState<MangaFireItem[]>([]);
  const [home, setHome] = useState<MangaFireHome>(MANGAFIRE_FALLBACK_HOME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getMangaFireHome()
      .then(mangaHome => {
        if (!cancelled) {
          setHome(mangaHome);
          setData(mangaHome.featured);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setHome(MANGAFIRE_FALLBACK_HOME);
          setData(MANGAFIRE_FALLBACK_HOME.featured);
          setError(err instanceof Error ? err.message : 'Failed to load MangaFire');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, home, loading, error };
}

export function useMangaFireSearch(query: string) {
  const [data, setData] = useState<MangaFireItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchMangaFireWithFallback(trimmed)
        .then(results => {
          if (!cancelled) {
            setData(results);
            setError(null);
            setLoading(false);
          }
        })
        .catch(err => {
          if (!cancelled) {
            setData([]);
            setError(err instanceof Error ? err.message : 'Manga search failed');
            setLoading(false);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { data, loading, error };
}
