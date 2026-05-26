import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "@dango/continue-watching-v1";

export interface ContinueItem {
  id: string;
  // For TMDB-based media
  tmdbId?: number;
  // For MangaFire-based manga
  mangaUrl?: string;

  type: "movie" | "tv" | "manga";
  title: string;

  // TMDB
  posterPath?: string | null;
  backdropPath?: string | null;

  // MangaFire
  posterUrl?: string | null;

  // TMDB
  season?: number;
  episode?: number;

  // Manga
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: string;
  resumeProgress?: number; // 0–1 scroll progress inside chapter

  progress: number; // 0–1 (kept for backwards compatibility; TMDB uses it, manga uses progress too)
  updatedAt: number;
}

interface ContinueWatchingContextValue {
  items: ContinueItem[];
  upsert: (item: Omit<ContinueItem, "id" | "updatedAt">) => void;
  remove: (key: {
    type: ContinueItem["type"];
    tmdbId?: number;
    mangaUrl?: string;
    chapterId?: string;
  }) => void;
}

const ContinueWatchingContext = createContext<
  ContinueWatchingContextValue | undefined
>(undefined);

export function ContinueWatchingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<ContinueItem[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as ContinueItem[];
            if (Array.isArray(parsed)) setItems(parsed);
          } catch {}
        }
        hydrated.current = true;
      })
      .catch(() => {
        hydrated.current = true;
      });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const upsert = useCallback((item: Omit<ContinueItem, "id" | "updatedAt">) => {
    const id =
      item.type === "manga"
        ? `manga-${item.mangaUrl}-${item.chapterId ?? ""}`
        : `tmdb-${item.tmdbId}-${item.type}`;

    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return [{ ...item, id, updatedAt: Date.now() }, ...filtered];
    });
  }, []);

  const remove = useCallback(
    (key: {
      type: ContinueItem["type"];
      tmdbId?: number;
      mangaUrl?: string;
      chapterId?: string;
    }) => {
      if (key.type === "manga") {
        const id = `manga-${key.mangaUrl}-${key.chapterId ?? ""}`;
        setItems((prev) => prev.filter((i) => i.id !== id));
        return;
      }
      const id = `tmdb-${key.tmdbId}-${key.type}`;
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [],
  );

  return (
    <ContinueWatchingContext.Provider value={{ items, upsert, remove }}>
      {children}
    </ContinueWatchingContext.Provider>
  );
}

export function useContinueWatching() {
  const ctx = useContext(ContinueWatchingContext);
  if (!ctx)
    throw new Error(
      "useContinueWatching must be used inside <ContinueWatchingProvider>",
    );
  return ctx;
}
