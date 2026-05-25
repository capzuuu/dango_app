import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = '@dango/continue-watching-v1';

export interface ContinueItem {
  id: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  season?: number;
  episode?: number;
  progress: number; // 0–1
  updatedAt: number;
}

interface ContinueWatchingContextValue {
  items: ContinueItem[];
  upsert: (item: Omit<ContinueItem, 'id' | 'updatedAt'>) => void;
  remove: (tmdbId: number) => void;
}

const ContinueWatchingContext = createContext<ContinueWatchingContextValue | undefined>(undefined);

export function ContinueWatchingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContinueItem[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ContinueItem[];
          if (Array.isArray(parsed)) setItems(parsed);
        } catch {}
      }
      hydrated.current = true;
    }).catch(() => { hydrated.current = true; });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const upsert = useCallback((item: Omit<ContinueItem, 'id' | 'updatedAt'>) => {
    const id = `${item.tmdbId}-${item.type}`;
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== id);
      return [{ ...item, id, updatedAt: Date.now() }, ...filtered];
    });
  }, []);

  const remove = useCallback((tmdbId: number) => {
    setItems(prev => prev.filter(i => i.tmdbId !== tmdbId));
  }, []);

  return (
    <ContinueWatchingContext.Provider value={{ items, upsert, remove }}>
      {children}
    </ContinueWatchingContext.Provider>
  );
}

export function useContinueWatching() {
  const ctx = useContext(ContinueWatchingContext);
  if (!ctx) throw new Error('useContinueWatching must be used inside <ContinueWatchingProvider>');
  return ctx;
}
