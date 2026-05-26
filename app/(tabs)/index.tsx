import { MediaCard } from '@/components/media-card';
import { CardRowSkeleton } from '@/components/skeleton';
import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ContinueItem, useContinueWatching } from '@/context/continue-watching-context';
import { ListItem, resolveCategory, useMyList } from '@/context/my-list-context';
import { useProfile } from '@/context/profile-context';
import { useMangaFireHome } from '@/hooks/use-mangafire';
import {
  useAnime,
  useAnime2,
  useAnime3,
  useAnimeMostFavorited,
  useAnimeNowAiring,
  useAnimeTopRated,
  useAnimeUpcoming,
  useKDramas,
  useKDramas2,
  useKDramas3,
  useKDramasMostFavorited,
  useKDramasNowAiring,
  useKDramasTopRated,
  useKDramasUpcoming,
  useMostFavoritedMovies,
  useMostFavoritedTV,
  useNowAiringTV,
  useNowPlayingMovies,
  usePopularMovies,
  usePopularTV,
  useRecentMovies,
  useRecentTV,
  useTopRatedMovies,
  useTopRatedTV,
  useTrendingAll,
  useTrendingTV,
  useUpcomingMovies,
} from '@/hooks/use-tmdb';
import {
    backdropUrl,
    GENRE_MAP,
    getTitle,
    getYear,
    posterUrl,
    TMDBItem,
    TMDBMovie,
    TMDBShow,
} from '@/lib/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 520;
const AUTO_INTERVAL = 4000;

type Category = 'all' | 'movies' | 'series' | 'kdrama' | 'anime' | 'manga';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'kdrama', label: 'K-Drama' },
  { key: 'anime',  label: 'Anime' },
  { key: 'manga',  label: 'Manga' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Merge arrays, deduplicate by id, keep first occurrence */
function mergeUnique(...arrays: TMDBItem[][]): TMDBItem[] {
  const seen = new Set<number>();
  const result: TMDBItem[] = [];
  for (const arr of arrays) {
    for (const item of arr) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
  }
  return result;
}

function toItem(item: TMDBMovie, type: 'movie'): TMDBItem;
function toItem(item: TMDBShow, type: 'tv'): TMDBItem;
function toItem(item: TMDBMovie | TMDBShow, type: 'movie' | 'tv'): TMDBItem {
  return { ...item, media_type: type } as TMDBItem;
}

// ─── Hero Slide ───────────────────────────────────────────────────────────────

function HeroSlide({
  item,
  inList,
  onPlay,
  onList,
}: {
  item: TMDBItem;
  inList: boolean;
  onPlay: () => void;
  onList: () => void;
}) {
  const backdrop = backdropUrl(item.backdrop_path, 'w1280');
  const title = getTitle(item);
  const year = getYear(item);
  const genres = item.genre_ids.slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean);

  return (
    <View style={heroStyles.slide}>
      {backdrop ? (
        <Image
          source={{ uri: backdrop }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={500}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d1b2a' }]} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.5)', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={heroStyles.content}>
        {genres.length > 0 && (
          <View style={heroStyles.badgeRow}>
            {genres.map((g, i) => (
              <View key={g} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {i > 0 && <View style={heroStyles.dot} />}
                <Text style={heroStyles.badge}>{g.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={heroStyles.title} numberOfLines={2}>{title}</Text>
        {year ? <Text style={heroStyles.year}>{year}</Text> : null}
        <View style={heroStyles.buttons}>
          <TouchableOpacity style={heroStyles.playBtn} onPress={onPlay} activeOpacity={0.85}>
            <Ionicons name="play" size={18} color="#000" />
            <Text style={heroStyles.playBtnText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={heroStyles.listBtn} onPress={onList} activeOpacity={0.85}>
            <Ionicons name={inList ? 'checkmark' : 'add'} size={18} color={Colors.primaryText} />
            <Text style={heroStyles.listBtnText}>{inList ? 'In List' : 'My List'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Infinite Hero Carousel ───────────────────────────────────────────────────
// Strategy: wrap real slides with clones at both ends.
//   [clone of last] [slide 0] [slide 1] ... [slide N-1] [clone of first]
// When user reaches a clone, silently jump to the real counterpart.

function HeroCarousel({
  items,
  loading,
  onPress,
}: {
  items: TMDBItem[];
  loading: boolean;
  onPress: (item: TMDBItem) => void;
}) {
  const { isInList, toggleList } = useMyList();
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(1);           // starts at 1 (first real slide)
  const [activeIndex, setActiveIndex] = useState(0); // 0-based real index for dots
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isJumping = useRef(false);

  // Build looped array: [last, ...real, first]
  const looped = useMemo(() => {
    if (items.length === 0) return [];
    return [items[items.length - 1], ...items, items[0]];
  }, [items]);

  const total = looped.length;
  const realCount = items.length;

  // ── timer helpers ──────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scrollToIndex = useCallback((idx: number, animated = true) => {
    scrollRef.current?.scrollTo({ x: idx * SCREEN_W, animated });
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (realCount < 2) return;
    timerRef.current = setInterval(() => {
      const next = indexRef.current + 1;
      indexRef.current = next;
      scrollToIndex(next, true);
      // Update dot (real index = looped index - 1, clamped)
      const realIdx = Math.min(Math.max(next - 1, 0), realCount - 1);
      setActiveIndex(realIdx % realCount);
    }, AUTO_INTERVAL);
  }, [realCount, stopTimer, scrollToIndex]);

  // ── mount: jump to first real slide without animation ─────────────────────
  useEffect(() => {
    if (looped.length === 0) return;
    // Give ScrollView time to lay out before jumping
    const t = setTimeout(() => {
      scrollToIndex(1, false);
      indexRef.current = 1;
      setActiveIndex(0);
      startTimer();
    }, 100);
    return () => clearTimeout(t);
  }, [looped.length, scrollToIndex, startTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── handle swipe end ───────────────────────────────────────────────────────
  const onMomentumEnd = useCallback((e: any) => {
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    indexRef.current = rawIndex;

    // Real dot index
    const realIdx = rawIndex - 1;
    setActiveIndex(((realIdx % realCount) + realCount) % realCount);

    // Silently jump if we hit a clone
    if (rawIndex === 0) {
      // Hit clone of last → jump to real last
      isJumping.current = true;
      const jumpTo = realCount;
      setTimeout(() => {
        scrollToIndex(jumpTo, false);
        indexRef.current = jumpTo;
        isJumping.current = false;
      }, 50);
    } else if (rawIndex === total - 1) {
      // Hit clone of first → jump to real first
      isJumping.current = true;
      setTimeout(() => {
        scrollToIndex(1, false);
        indexRef.current = 1;
        isJumping.current = false;
      }, 50);
    }

    startTimer();
  }, [realCount, total, scrollToIndex, startTimer]);

  // ── dot tap ────────────────────────────────────────────────────────────────
  const goTo = useCallback((realIdx: number) => {
    stopTimer();
    const loopedIdx = realIdx + 1;
    scrollToIndex(loopedIdx, true);
    indexRef.current = loopedIdx;
    setActiveIndex(realIdx);
    startTimer();
  }, [stopTimer, scrollToIndex, startTimer]);

  // ── my list toggle ─────────────────────────────────────────────────────────
  const handleToggle = useCallback((item: TMDBItem) => {
    const mediaType = (item as any).media_type ?? 'movie';
    const listItem: ListItem = {
      id: item.id,
      type: mediaType,
      title: getTitle(item),
      posterPath: item.poster_path ?? null,
      backdropPath: item.backdrop_path ?? null,
      rating: item.vote_average,
      year: getYear(item),
      category: resolveCategory(
        mediaType,
        item.genre_ids ?? [],
        (item as any).origin_country ?? [],
      ),
    };
    toggleList(listItem);
  }, [toggleList]);

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading || looped.length === 0) {
    return (
      <View style={[heroStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d1b2a' }]} />
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.5)', '#000000']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.15 }}
          end={{ x: 0, y: 1 }}
        />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={heroStyles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScrollBeginDrag={stopTimer}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {looped.map((item, i) => (
          <HeroSlide
            key={`${item.id}-${i}`}
            item={item}
            inList={isInList(item.id)}
            onPlay={() => onPress(item)}
            onList={() => handleToggle(item)}
          />
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {realCount > 1 && (
        <View style={heroStyles.dots}>
          {items.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={8}>
              <View
                style={[
                  heroStyles.dotItem,
                  i === activeIndex && heroStyles.dotItemActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Continue card ────────────────────────────────────────────────────────────

function ContinueCard({ item, onPress, onRemove }: { item: ContinueItem; onPress: () => void; onRemove: () => void }) {
  const thumb = item.backdropPath
    ? backdropUrl(item.backdropPath, 'w300')
    : item.posterPath
    ? posterUrl(item.posterPath, 'w185')
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.continueCard}>
      <View style={styles.continueBg}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d1b2a' }]} />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
        <View style={styles.playCircle}>
          <Ionicons name="play" size={18} color={Colors.primaryText} />
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={14} color={Colors.primaryText} />
        </TouchableOpacity>
        {item.type === 'tv' && item.season != null && (
          <View style={styles.epBadge}>
            <Text style={styles.epBadgeText}>S{item.season}:E{item.episode}</Text>
          </View>
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${item.progress * 100}%` as any }]} />
        </View>
      </View>
      <Text style={styles.continueTitle} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );
}

// ─── Media row ────────────────────────────────────────────────────────────────

function MediaRow({
  data,
  loading,
  type,
  onPress,
}: {
  data: (TMDBMovie | TMDBShow)[];
  loading: boolean;
  type: 'movie' | 'tv';
  onPress: (id: number, type: 'movie' | 'tv') => void;
}) {
  if (loading) return <CardRowSkeleton />;
  return (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowPad}
      keyExtractor={i => `${type}-${i.id}`}
      renderItem={({ item }) => (
        <MediaCard
          item={item}
          onPress={() => onPress(item.id, type)}
          style={{ marginRight: Spacing.sm }}
        />
      )}
    />
  );
}

// ─── Category Filter Bar ─────────────────────────────────────────────────────

function MangaRow({
  data,
  loading,
  onPress,
}: {
  data: import('@/lib/mangafire').MangaFireItem[];
  loading: boolean;
  onPress: (item: import('@/lib/mangafire').MangaFireItem) => void;
}) {
  if (loading) return <CardRowSkeleton />;

  return (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowPad}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.mangaCard} onPress={() => onPress(item)} activeOpacity={0.85}>
          <View style={styles.mangaPoster}>
            {item.posterUrl ? (
              <Image source={{ uri: item.posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : (
              <View style={styles.mangaPlaceholder}>
                <Ionicons name="book-outline" size={24} color={Colors.hint} />
              </View>
            )}
            <View style={styles.mangaBadge}>
              <Text style={styles.mangaBadgeText}>MANGA</Text>
            </View>
          </View>
          <Text style={styles.mangaTitle} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function CategoryBar({ active, onChange }: { active: Category; onChange: (c: Category) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={catStyles.bar}
      contentContainerStyle={catStyles.content}
    >
      {CATEGORIES.map(c => (
        <TouchableOpacity key={c.key} onPress={() => onChange(c.key)} style={catStyles.item}>
          <Text style={[catStyles.label, active === c.key && catStyles.labelActive]}>{c.label}</Text>
          {active === c.key && <View style={catStyles.underline} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const catStyles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  item: { alignItems: 'center', paddingBottom: 4 },
  label: { ...TextStyles.titleMedium, color: Colors.secondaryText },
  labelActive: { color: Colors.primaryText },
  underline: { height: 2, width: '100%', backgroundColor: Colors.primary, marginTop: 3, borderRadius: 1 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { items: continueItems, remove: removeContinue } = useContinueWatching();
  const mangaFire = useMangaFireHome();

  const [category, setCategory] = useState<Category>('all');

  const trending         = useTrendingAll();
  const popular          = usePopularMovies();
  const topMovies        = useTopRatedMovies();
  const nowPlaying       = useNowPlayingMovies();
  const upcoming         = useUpcomingMovies();
  const recentMovies     = useRecentMovies();
  const favMovies        = useMostFavoritedMovies();

  const nowAiringTV      = useNowAiringTV();
  const popularTV        = usePopularTV();
  const topRatedTV       = useTopRatedTV();
  const trendingTV       = useTrendingTV();
  const recentTV         = useRecentTV();
  const favTV            = useMostFavoritedTV();

  const kdramas          = useKDramas();
  const kdramas2         = useKDramas2();
  const kdramas3         = useKDramas3();
  const kdramasTopRated  = useKDramasTopRated();
  const kdramasNowAiring = useKDramasNowAiring();
  const kdramasFav       = useKDramasMostFavorited();
  const kdramasUpcoming  = useKDramasUpcoming();

  const anime            = useAnime();
  const anime2           = useAnime2();
  const anime3           = useAnime3();
  const animeTopRated    = useAnimeTopRated();
  const animeNowAiring   = useAnimeNowAiring();
  const animeFav         = useAnimeMostFavorited();
  const animeUpcoming    = useAnimeUpcoming();

  // Build hero slides: mix of trending, movies, K-dramas, anime
  const heroItems = useMemo<TMDBItem[]>(() => {
    const trendingItems = ((trending.data?.results ?? []) as TMDBItem[]).slice(0, 4);
    const movieItems    = (popular.data?.results ?? []).slice(0, 3).map(i => toItem(i, 'movie'));
    const seriesItems   = (popularTV.data?.results ?? []).slice(0, 3).map(i => toItem(i, 'tv'));
    const kdramaItems   = (kdramas.data?.results ?? []).slice(0, 3).map(i => toItem(i, 'tv'));
    const animeItems    = (anime.data?.results  ?? []).slice(0, 3).map(i => toItem(i, 'tv'));
    // interleave by picking one from each source in rotation
    const sources = [trendingItems, movieItems, seriesItems, kdramaItems, animeItems];
    const interleaved: TMDBItem[] = [];
    const seen = new Set<number>();
    const maxLen = Math.max(...sources.map(s => s.length));
    for (let i = 0; i < maxLen; i++) {
      for (const src of sources) {
        if (src[i] && !seen.has(src[i].id)) {
          seen.add(src[i].id);
          interleaved.push(src[i]);
        }
      }
    }
    return interleaved.slice(0, 15);
  }, [trending.data, popular.data, popularTV.data, kdramas.data, anime.data]);

  const allKDramas = useMemo(() =>
    mergeUnique(
      (kdramas.data?.results ?? []).map(i => toItem(i, 'tv')),
      (kdramas2.data?.results ?? []).map(i => toItem(i, 'tv')),
      (kdramas3.data?.results ?? []).map(i => toItem(i, 'tv')),
    ),
    [kdramas.data, kdramas2.data, kdramas3.data]
  );

  const allAnime = useMemo(() =>
    mergeUnique(
      (anime.data?.results ?? []).map(i => toItem(i, 'tv')),
      (anime2.data?.results ?? []).map(i => toItem(i, 'tv')),
      (anime3.data?.results ?? []).map(i => toItem(i, 'tv')),
    ),
    [anime.data, anime2.data, anime3.data]
  );

  const tv = (d: TMDBShow[] | undefined) => (d ?? []).map(i => toItem(i, 'tv'));
  const mv = (d: TMDBMovie[] | undefined) => (d ?? []).map(i => toItem(i, 'movie'));

  const handlePress = (id: number, type: 'movie' | 'tv') =>
    router.push({ pathname: '/details', params: { id: String(id), type } });

  const handleMangaPress = (item: import('@/lib/mangafire').MangaFireItem) => {
    router.push({
      pathname: '/manga-reader',
      params: {
        url: item.url,
        title: item.title,
        posterUrl: item.posterUrl ?? '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero Carousel ── */}
        <HeroCarousel
          items={heroItems}
          loading={trending.loading}
          onPress={item => handlePress(item.id, (item as any).media_type ?? 'movie')}
        />

        {/* ── Category Filter Bar ── */}
        <CategoryBar active={category} onChange={setCategory} />

        {/* ── All ── */}
        {(category === 'all') && (
          <>
            <SectionHeader title="Trending Now" />
            <MediaRow data={(trending.data?.results ?? []) as TMDBItem[]} loading={trending.loading} type="movie"
              onPress={(id, _) => { const it = trending.data?.results.find(r => r.id === id); handlePress(id, (it as any)?.media_type ?? 'movie'); }} />
            <SectionHeader title="Popular Movies & Shows" />
            <MediaRow data={allAnime} loading={anime.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Manga" />
            <MangaRow data={mangaFire.data} loading={mangaFire.loading} onPress={handleMangaPress} />
            <SectionHeader title="Now Airing" />
            <MediaRow data={tv(nowAiringTV.data?.results)} loading={nowAiringTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Upcoming Releases" />
            <MediaRow data={mv(upcoming.data?.results)} loading={upcoming.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Top Rated" />
            <MediaRow data={mv(topMovies.data?.results)} loading={topMovies.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Recently Added" />
            <MediaRow data={mv(recentMovies.data?.results)} loading={recentMovies.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Most Favorited" />
            <MediaRow data={mv(favMovies.data?.results)} loading={favMovies.loading} type="movie" onPress={handlePress} />
          </>
        )}

        {/* ── Movies ── */}
        {(category === 'movies') && (
          <>
            <SectionHeader title="Trending Now" />
            <MediaRow data={(trending.data?.results ?? []).filter(i => (i as any).media_type === 'movie') as TMDBItem[]} loading={trending.loading} type="movie"
              onPress={(id, _) => handlePress(id, 'movie')} />
            <SectionHeader title="Popular Movies" />
            <MediaRow data={mv(popular.data?.results)} loading={popular.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Now Airing" />
            <MediaRow data={mv(nowPlaying.data?.results)} loading={nowPlaying.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Upcoming Releases" />
            <MediaRow data={mv(upcoming.data?.results)} loading={upcoming.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Top Rated" />
            <MediaRow data={mv(topMovies.data?.results)} loading={topMovies.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Recently Added" />
            <MediaRow data={mv(recentMovies.data?.results)} loading={recentMovies.loading} type="movie" onPress={handlePress} />
            <SectionHeader title="Most Favorited" />
            <MediaRow data={mv(favMovies.data?.results)} loading={favMovies.loading} type="movie" onPress={handlePress} />
          </>
        )}

        {/* ── Series ── */}
        {(category === 'series') && (
          <>
            <SectionHeader title="Trending Now" />
            <MediaRow data={tv(trendingTV.data?.results)} loading={trendingTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Popular Series" />
            <MediaRow data={tv(popularTV.data?.results)} loading={popularTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Now Airing" />
            <MediaRow data={tv(nowAiringTV.data?.results)} loading={nowAiringTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Upcoming Releases" />
            <MediaRow data={tv(nowAiringTV.data?.results)} loading={nowAiringTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Top Rated" />
            <MediaRow data={tv(topRatedTV.data?.results)} loading={topRatedTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Recently Added" />
            <MediaRow data={tv(recentTV.data?.results)} loading={recentTV.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Most Favorited" />
            <MediaRow data={tv(favTV.data?.results)} loading={favTV.loading} type="tv" onPress={handlePress} />
          </>
        )}

        {/* ── K-Drama ── */}
        {(category === 'kdrama') && (
          <>
            <SectionHeader title="Trending Now" />
            <MediaRow data={allKDramas} loading={kdramas.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Popular K-Dramas" />
            <MediaRow data={allKDramas} loading={kdramas.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Now Airing" />
            <MediaRow data={tv(kdramasNowAiring.data?.results)} loading={kdramasNowAiring.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Upcoming Releases" />
            <MediaRow data={tv(kdramasUpcoming.data?.results)} loading={kdramasUpcoming.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Top Rated" />
            <MediaRow data={tv(kdramasTopRated.data?.results)} loading={kdramasTopRated.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Recently Added" />
            <MediaRow data={tv(kdramasNowAiring.data?.results)} loading={kdramasNowAiring.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Most Favorited" />
            <MediaRow data={tv(kdramasFav.data?.results)} loading={kdramasFav.loading} type="tv" onPress={handlePress} />
          </>
        )}

        {/* ── Anime ── */}
        {(category === 'anime') && (
          <>
            <SectionHeader title="Trending Now" />
            <MediaRow data={allAnime} loading={anime.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Popular Anime" />
            <MediaRow data={tv(animeFav.data?.results)} loading={animeFav.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Now Airing" />
            <MediaRow data={tv(animeNowAiring.data?.results)} loading={animeNowAiring.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Upcoming Releases" />
            <MediaRow data={tv(animeUpcoming.data?.results)} loading={animeUpcoming.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Top Rated" />
            <MediaRow data={tv(animeTopRated.data?.results)} loading={animeTopRated.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Recently Added" />
            <MediaRow data={tv(animeNowAiring.data?.results)} loading={animeNowAiring.loading} type="tv" onPress={handlePress} />
            <SectionHeader title="Most Favorited" />
            <MediaRow data={tv(animeFav.data?.results)} loading={animeFav.loading} type="tv" onPress={handlePress} />
          </>
        )}

        {(category === 'manga') && (
          <>
            <SectionHeader title="Featured" />
            <MangaRow data={mangaFire.home.featured} loading={mangaFire.loading} onPress={handleMangaPress} />
            <SectionHeader title="Most Viewed" />
            <MangaRow data={mangaFire.home.mostViewed} loading={mangaFire.loading} onPress={handleMangaPress} />
            <SectionHeader title="Recently Updated" />
            <MangaRow data={mangaFire.home.recentlyUpdated} loading={mangaFire.loading} onPress={handleMangaPress} />
            <SectionHeader title="New Release" />
            <MangaRow data={mangaFire.home.newRelease} loading={mangaFire.loading} onPress={handleMangaPress} />
            {mangaFire.error && mangaFire.data.length === 0 ? (
              <Text style={styles.mangaError}>MangaFire is unavailable right now.</Text>
            ) : null}
          </>
        )}

        {continueItems.filter(i => i.type !== 'manga').length > 0 && (
          <>
            <SectionHeader title="Continue Watching" />
            <FlatList
              data={continueItems.filter(i => i.type !== 'manga')}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowPad}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <ContinueCard
                  item={item}
                  onRemove={() => removeContinue({ type: item.type, tmdbId: item.tmdbId })}
                  onPress={() =>
                    router.push({
                      pathname: '/player',
                      params: {
                        id: String(item.tmdbId),
                        type: item.type,
                        season: String(item.season ?? 1),
                        episode: String(item.episode ?? 1),
                        title: item.title,
                        posterPath: item.posterPath ?? '',
                        backdropPath: item.backdropPath ?? '',
                      },
                    })
                  }
                />
              )}
            />
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* ── Top Nav (overlaid) ── */}
      <SafeAreaView style={styles.topNav} edges={['top']} pointerEvents="box-none">
        <Image source={require('@/assets/images/dango-logo.png')} style={styles.logoImg} contentFit="contain" contentPosition="left" />
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Ionicons name="search" size={26} color={Colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile-select')}>
            <View style={[styles.avatarBox, { backgroundColor: activeProfile.color }]}>
              <Text style={styles.avatarEmoji}>{activeProfile.emoji}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Hero styles ──────────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  container: { height: HERO_H, width: SCREEN_W },
  slide: { width: SCREEN_W, height: HERO_H, justifyContent: 'flex-end' },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.sm, flexWrap: 'wrap', gap: Spacing.xs,
  },
  badge: { ...TextStyles.labelLarge, color: Colors.secondaryText, letterSpacing: 1 },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.secondaryText,
    marginHorizontal: Spacing.xs,
  },
  title: { fontSize: 34, fontWeight: '800', color: Colors.primaryText, lineHeight: 38, marginBottom: 4 },
  year: { ...TextStyles.bodySmall, color: Colors.secondaryText, marginBottom: Spacing.md },
  buttons: { flexDirection: 'row', gap: Spacing.md },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryText,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.sm,
  },
  playBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  listBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  listBtnText: { color: Colors.primaryText, fontWeight: '700', fontSize: 16 },
  dots: {
    position: 'absolute', bottom: Spacing.lg,
    left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs,
  },
  dotItem: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotItemActive: { width: 20, backgroundColor: Colors.primary },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  logoImg: { width: 110, height: 40, alignSelf: 'center' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarBox: {
    width: 32, height: 32, borderRadius: Radii.sm,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: { fontSize: 18 },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: { ...TextStyles.titleMedium, color: Colors.primaryText },
  rowPad: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  mangaCard: { width: 112, marginRight: Spacing.sm },
  mangaPoster: {
    width: 112,
    height: 164,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
  },
  mangaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mangaBadge: {
    position: 'absolute',
    left: Spacing.xs,
    bottom: Spacing.xs,
    borderRadius: Radii.xs,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  mangaBadgeText: { color: Colors.primary, fontSize: 9, fontWeight: '800' },
  mangaTitle: { ...TextStyles.labelMedium, color: Colors.primaryText, marginTop: Spacing.xs },
  mangaError: {
    ...TextStyles.bodySmall,
    color: Colors.hint,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  continueCard: { width: 220, marginRight: Spacing.sm },
  continueBg: {
    height: 124, borderRadius: Radii.md,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  playCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtn: {
    position: 'absolute', top: Spacing.xs, right: Spacing.xs,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  epBadge: {
    position: 'absolute', top: Spacing.xs, left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs, paddingVertical: 1,
  },
  epBadgeText: { ...TextStyles.labelSmall, color: Colors.primaryText },
  progressTrack: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: Colors.surfaceVariant,
  },
  progressFill: { height: 4, backgroundColor: Colors.primary },
  continueTitle: { ...TextStyles.labelMedium, color: Colors.primaryText, marginTop: Spacing.xs },
});
