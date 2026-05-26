import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ListItem, resolveCategory, useMyList } from '@/context/my-list-context';
import {
  useAsianShorts,
  useCDramas,
  useKDramas,
  useTaiwanDramas,
  useThaiDramas,
} from '@/hooks/use-tmdb';
import { DracinReel, getDracinReels, stableDracinNumberId } from '@/lib/dracin';
import {
  backdropUrl,
  formatRating,
  getTitle,
  getYear,
  posterUrl,
  TMDBMovie,
  TMDBShow,
} from '@/lib/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const TAB_BAR_H = 60;

type Tab = 'C-Drama' | 'K-Drama' | 'Thai' | 'Taiwan' | 'Shorts';
const TABS: Tab[] = ['C-Drama', 'K-Drama', 'Thai', 'Taiwan', 'Shorts'];

type ReelItem = TMDBShow | TMDBMovie;
type MediaType = 'tv' | 'movie';
type ReelSource = 'dracin' | 'tmdb';

interface NormalizedReel {
  id: string;
  numericId: number;
  source: ReelSource;
  mediaType: MediaType;
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
  raw: ReelItem | DracinReel;
}

function tabToDracinCategory(tab: Tab) {
  switch (tab) {
    case 'C-Drama': return 'china';
    case 'K-Drama': return 'korea';
    case 'Thai': return 'thai';
    case 'Taiwan': return 'taiwan';
    case 'Shorts': return 'short';
  }
}

function tmdbToReel(item: ReelItem, type: MediaType): NormalizedReel {
  return {
    id: String(item.id),
    numericId: item.id,
    source: 'tmdb',
    mediaType: type,
    title: getTitle(item as any),
    overview: (item as any).overview ?? '',
    posterUrl: posterUrl((item as any).poster_path, 'w500'),
    backdropUrl: backdropUrl((item as any).backdrop_path, 'w1280'),
    videoUrl: null,
    sourceUrl: null,
    year: getYear(item as any),
    rating: (item as any).vote_average ?? 0,
    platform: 'TMDB',
    episodes: null,
    raw: item,
  };
}

function dracinToReel(item: DracinReel): NormalizedReel {
  return {
    id: item.id,
    numericId: stableDracinNumberId(item.id),
    source: 'dracin',
    mediaType: 'tv',
    title: item.title,
    overview: item.overview,
    posterUrl: item.posterUrl,
    backdropUrl: item.backdropUrl,
    videoUrl: item.videoUrl,
    sourceUrl: item.sourceUrl,
    year: item.year,
    rating: item.rating,
    platform: item.platform,
    episodes: item.episodes,
    raw: item,
  };
}

function ReelAction({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionCircle, active && styles.actionCircleActive]}>
        <Ionicons name={icon} size={24} color={active ? Colors.onPrimary : Colors.primaryText} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReelCard({
  item,
  height,
  onOpen,
  onToggleList,
  onShare,
  inList,
}: {
  item: NormalizedReel;
  height: number;
  onOpen: () => void;
  onToggleList: () => void;
  onShare: () => void;
  inList: boolean;
}) {
  const backdrop = item.backdropUrl;
  const poster = item.posterUrl;
  const rating = formatRating(item.rating);

  return (
    <View style={[styles.reel, { height }]}>
      {poster || backdrop ? (
        <Image
          source={{ uri: poster ?? backdrop ?? '' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.emptyBackdrop]} />
      )}

      <Image
        source={{ uri: backdrop ?? poster ?? '' }}
        style={styles.backdropGhost}
        contentFit="cover"
        blurRadius={18}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity style={styles.playTarget} onPress={onOpen} activeOpacity={0.9}>
        <View style={styles.playCircle}>
          <Ionicons name="play" size={34} color="#000" />
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <ReelAction
          icon={inList ? 'checkmark' : 'add'}
          label="List"
          active={inList}
          onPress={onToggleList}
        />
        <ReelAction icon="information" label="Info" onPress={onOpen} />
        <ReelAction icon="share-social-outline" label="Share" onPress={onShare} />
      </View>

      <View style={styles.reelInfo}>
        <View style={styles.badgeRow}>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>{item.source === 'dracin' ? 'DRACIN' : item.mediaType === 'movie' ? 'SHORT' : 'DRAMA'}</Text>
          </View>
          {item.year ? <Text style={styles.metaText}>{item.year}</Text> : null}
          <Text style={styles.metaText}>{rating}</Text>
          {item.episodes ? <Text style={styles.metaText}>{item.episodes} eps</Text> : null}
          <Text style={styles.metaText}>{item.platform}</Text>
        </View>

        <Text style={styles.reelTitle} numberOfLines={2}>{item.title}</Text>
        {item.overview ? <Text style={styles.overview} numberOfLines={3}>{item.overview}</Text> : null}

        <TouchableOpacity style={styles.watchBtn} onPress={onOpen} activeOpacity={0.85}>
          <Ionicons name="play" size={16} color="#000" />
          <Text style={styles.watchText}>Watch Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShortTVScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isInList, toggleList } = useMyList();
  const [activeTab, setActiveTab] = useState<Tab>('C-Drama');
  const [dracinItems, setDracinItems] = useState<DracinReel[]>([]);
  const [dracinLoading, setDracinLoading] = useState(true);
  const [dracinError, setDracinError] = useState<string | null>(null);

  const cdramas = useCDramas();
  const kdramas = useKDramas();
  const thai = useThaiDramas();
  const taiwan = useTaiwanDramas();
  const shorts = useAsianShorts();

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'C-Drama':
        return { data: cdramas.data?.results ?? [], loading: cdramas.loading, type: 'tv' as const };
      case 'K-Drama':
        return { data: kdramas.data?.results ?? [], loading: kdramas.loading, type: 'tv' as const };
      case 'Thai':
        return { data: thai.data?.results ?? [], loading: thai.loading, type: 'tv' as const };
      case 'Taiwan':
        return { data: taiwan.data?.results ?? [], loading: taiwan.loading, type: 'tv' as const };
      case 'Shorts':
        return { data: shorts.data?.results ?? [], loading: shorts.loading, type: 'movie' as const };
    }
  }, [activeTab, cdramas, kdramas, thai, taiwan, shorts]);

  const reelHeight = SCREEN_H - TAB_BAR_H;
  const tmdbReels = useMemo(
    () => currentData.data.map(item => tmdbToReel(item, currentData.type)),
    [currentData],
  );
  const dracinReels = useMemo(
    () => dracinItems.map(dracinToReel),
    [dracinItems],
  );
  const reels = dracinReels.length > 0 ? dracinReels : tmdbReels;
  const loading = dracinLoading && currentData.loading && reels.length === 0;

  useEffect(() => {
    let cancelled = false;

    setDracinLoading(true);
    setDracinError(null);

    getDracinReels({
      page: '1',
      category: tabToDracinCategory(activeTab),
      lang: 'id',
    })
      .then(page => {
        if (!cancelled) {
          setDracinItems(page.results);
          setDracinLoading(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setDracinItems([]);
          setDracinError(error instanceof Error ? error.message : 'Dracin request failed');
          setDracinLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const openReel = (item: NormalizedReel) => {
    if (item.videoUrl || item.sourceUrl) {
      Linking.openURL(item.videoUrl ?? item.sourceUrl ?? '').catch(() => {});
      return;
    }

    if (item.source === 'tmdb') {
      router.push({ pathname: '/details', params: { id: String(item.numericId), type: item.mediaType } });
    }
  };

  const handleShare = (item: NormalizedReel) => {
    Share.share({
      title: item.title,
      message: item.sourceUrl ?? item.videoUrl ?? item.title,
    }).catch(() => {});
  };

  const handleToggleList = (item: NormalizedReel) => {
    const raw = item.raw as any;
    const listItem: ListItem = {
      id: item.numericId,
      type: item.mediaType,
      title: item.title,
      posterPath: item.source === 'tmdb' ? raw.poster_path ?? null : item.posterUrl,
      backdropPath: item.source === 'tmdb' ? raw.backdrop_path ?? null : item.backdropUrl,
      rating: item.rating,
      year: item.year,
      category: resolveCategory(
        item.mediaType,
        raw.genre_ids ?? [],
        raw.origin_country ?? [],
      ),
    };
    toggleList(listItem);
  };

  return (
    <View style={styles.container}>
      <FlatList<NormalizedReel>
        data={reels}
        key={activeTab}
        keyExtractor={item => `${item.source}-${item.id}`}
        pagingEnabled
        snapToInterval={reelHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ReelCard
            item={item}
            height={reelHeight}
            inList={isInList(item.numericId)}
            onOpen={() => openReel(item)}
            onShare={() => handleShare(item)}
            onToggleList={() => handleToggleList(item)}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.loadingReel, { height: reelHeight }]}>
            {loading ? (
              <ActivityIndicator color={Colors.primary} size="large" />
            ) : (
              <>
                <Ionicons name="film-outline" size={42} color={Colors.hint} />
                <Text style={styles.emptyText}>No reels found</Text>
                {dracinError ? <Text style={styles.emptyHint}>Dracin unavailable, check API credentials.</Text> : null}
              </>
            )}
          </View>
        }
      />

      <SafeAreaView style={[styles.topOverlay, { paddingTop: insets.top ? 0 : Spacing.md }]} edges={['top']}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.headerTitle}>ShortTV</Text>
            <Text style={styles.headerSub}>{dracinReels.length > 0 ? 'Dracin reels' : 'Drama reels'}</Text>
          </View>
          <TouchableOpacity style={styles.soundBtn} activeOpacity={0.85}>
            <Ionicons name="volume-high" size={18} color={Colors.primaryText} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tabItem, activeTab === item && styles.tabItemActive]}
              onPress={() => setActiveTab(item)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  reel: {
    width: SCREEN_W,
    backgroundColor: Colors.background,
    justifyContent: 'flex-end',
  },
  emptyBackdrop: {
    backgroundColor: Colors.surfaceVariant,
  },
  backdropGhost: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    transform: [{ scale: 1.08 }],
  },
  playTarget: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  actions: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 128,
    alignItems: 'center',
    gap: Spacing.md,
  },
  action: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionLabel: {
    ...TextStyles.labelSmall,
    color: Colors.primaryText,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 8,
  },
  reelInfo: {
    paddingLeft: Spacing.lg,
    paddingRight: 88,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  liveBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  liveBadgeText: {
    color: Colors.onPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  metaText: {
    ...TextStyles.labelMedium,
    color: Colors.secondaryText,
  },
  reelTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  overview: {
    ...TextStyles.bodyMedium,
    color: Colors.secondaryText,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryText,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  watchText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryText,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 10,
  },
  headerSub: {
    ...TextStyles.labelMedium,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  soundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tabItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    ...TextStyles.labelMedium,
    color: Colors.primaryText,
  },
  tabTextActive: {
    color: Colors.onPrimary,
  },
  loadingReel: {
    width: SCREEN_W,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  emptyText: {
    ...TextStyles.bodyMedium,
    color: Colors.secondaryText,
  },
  emptyHint: {
    ...TextStyles.bodySmall,
    color: Colors.hint,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
