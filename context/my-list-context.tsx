/**
 * Global My List context — persisted to AsyncStorage.
 * Wrap the app root with <MyListProvider> then call useMyList() anywhere.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaType = 'movie' | 'tv';

export interface ListItem {
  id: number;
  type: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  year: string;
  category: string; // 'Movies' | 'TV Shows' | 'K-Dramas' | 'Anime'
}

interface MyListContextValue {
  items: ListItem[];
  isInList: (id: number) => boolean;
  addToList: (item: ListItem) => void;
  removeFromList: (id: number) => void;
  toggleList: (item: ListItem) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@dango/my-list-v1';

// Use undefined as default so we can detect missing provider
const MyListContext = createContext<MyListContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MyListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ListItem[]>([]);
  const hydrated = useRef(false);

  // Load persisted list once on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as ListItem[];
            if (Array.isArray(parsed)) setItems(parsed);
          } catch {
            // corrupted data — start fresh
          }
        }
        hydrated.current = true;
      })
      .catch(() => {
        hydrated.current = true;
      });
  }, []);

  // Persist on every change (skip the initial empty state before hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const isInList = useCallback(
    (id: number) => items.some(item => item.id === id),
    [items]
  );

  const addToList = useCallback((newItem: ListItem) => {
    setItems(prev =>
      prev.some(i => i.id === newItem.id) ? prev : [newItem, ...prev]
    );
  }, []);

  const removeFromList = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleList = useCallback((newItem: ListItem) => {
    setItems(prev =>
      prev.some(i => i.id === newItem.id)
        ? prev.filter(i => i.id !== newItem.id)
        : [newItem, ...prev]
    );
  }, []);

  const value: MyListContextValue = {
    items,
    isInList,
    addToList,
    removeFromList,
    toggleList,
  };

  return (
    <MyListContext.Provider value={value}>
      {children}
    </MyListContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMyList(): MyListContextValue {
  const ctx = useContext(MyListContext);
  if (ctx === undefined) {
    throw new Error('useMyList must be used inside <MyListProvider>');
  }
  return ctx;
}

// ─── Category resolver ────────────────────────────────────────────────────────

export function resolveCategory(
  type: MediaType,
  genreIds: number[],
  originCountries: string[] = []
): string {
  if (type === 'movie') return 'Movies';
  if (originCountries.includes('KR')) return 'K-Dramas';
  if (originCountries.includes('JP') && genreIds.includes(16)) return 'Anime';
  return 'TV Shows';
}
