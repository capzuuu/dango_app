import { MediaCard } from '@/components/media-card';
import { CardRowSkeleton } from '@/components/skeleton';
import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ContinueItem, useContinueWatching } from '@/context/continue-watching-context';
import { ListItem, resolveCategory, useMyList } from '@/context/my-list-context';
import {
  useAnime,
  useKDramas,
  usePopularMovies,
  usePopularTV,
  useTopRatedMovies,
  useTopRatedTV,
  useTrendingAll,
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { items: continueItems, remove: removeContinue } = useContinueWatching();

  const trending    = useTrendingAll();
  const popular     = usePopularMovies();
  const kdramas     = useKDramas();
  const tvShows     = usePopularTV();
  const topMovies   = useTopRatedMovies();
  const topTV       = useTopRatedTV();
  const anime       = useAnime();

  // Build hero slides: top 10 from trending (mix of movies + TV)
  const heroItems = useMemo<TMDBItem[]>(() => {
    const t = (trending.data?.results ?? []) as TMDBItem[];
    return t.slice(0, 10);
  }, [trending.data]);

  // Build merged rows
  const allMovies = useMemo(() =>
    mergeUnique(
      (popular.data?.results ?? []).map(i => toItem(i, 'movie')),
      (topMovies.data?.results ?? []).map(i => toItem(i, 'movie')),
    ),
    [popular.data, topMovies.data]
  );

  const allTV = useMemo(() =>
    mergeUnique(
      (tvShows.data?.results ?? []).map(i => toItem(i, 'tv')),
      (topTV.data?.results ?? []).map(i => toItem(i, 'tv')),
    ),
    [tvShows.data, topTV.data]
  );

  const allKDramas = useMemo(() =>
    (kdramas.data?.results ?? []).map(i => toItem(i, 'tv')),
    [kdramas.data]
  );

  const handlePress = (id: number, type: 'movie' | 'tv') =>
    router.push({ pathname: '/details', params: { id: String(id), type } });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero Carousel ── */}
        <HeroCarousel
          items={heroItems}
          loading={trending.loading}
          onPress={item => handlePress(item.id, (item as any).media_type ?? 'movie')}
        />

        {/* ── Trending Now ── */}
        <SectionHeader title="Trending Now" />
        <MediaRow
          data={(trending.data?.results ?? []) as TMDBItem[]}
          loading={trending.loading}
          type="movie"
          onPress={(id, _) => {
            const item = trending.data?.results.find(r => r.id === id);
            handlePress(id, (item as any)?.media_type ?? 'movie');
          }}
        />

        {/* ── Popular Movies ── */}
        <SectionHeader title="Popular Movies" />
        <MediaRow
          data={popular.data?.results ?? []}
          loading={popular.loading}
          type="movie"
          onPress={handlePress}
        />

        {/* ── Top Rated Movies ── */}
        <SectionHeader title="Top Rated Movies" />
        <MediaRow
          data={topMovies.data?.results ?? []}
          loading={topMovies.loading}
          type="movie"
          onPress={handlePress}
        />

        {/* ── K-Dramas ── */}
        <SectionHeader title="K-Dramas" />
        <MediaRow
          data={allKDramas}
          loading={kdramas.loading}
          type="tv"
          onPress={handlePress}
        />

        {/* ── Anime ── */}
        <SectionHeader title="Anime" />
        <MediaRow
          data={anime.data?.results ?? []}
          loading={anime.loading}
          type="tv"
          onPress={handlePress}
        />

        {/* ── Popular Series ── */}
        <SectionHeader title="Popular Series" />
        <MediaRow
          data={tvShows.data?.results ?? []}
          loading={tvShows.loading}
          type="tv"
          onPress={handlePress}
        />

        {/* ── Top Rated Series ── */}
        <SectionHeader title="Top Rated Series" />
        <MediaRow
          data={topTV.data?.results ?? []}
          loading={topTV.loading}
          type="tv"
          onPress={handlePress}
        />

        {/* ── Continue Watching ── */}
        {continueItems.length > 0 && (
          <>
            <SectionHeader title="Continue Watching" />
            <FlatList
              data={continueItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowPad}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <ContinueCard
                  item={item}
                  onRemove={() => removeContinue(item.tmdbId)}
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
        <Text style={styles.logo}>DANGO</Text>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Ionicons name="search" size={26} color={Colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile-select')}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>M</Text>
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
  logo: { color: Colors.primary, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarBox: {
    width: 32, height: 32, borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.primaryText, fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: { ...TextStyles.titleMedium, color: Colors.primaryText },
  rowPad: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
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
