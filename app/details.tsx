import { Skeleton } from '@/components/skeleton';
import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ListItem, resolveCategory, useMyList } from '@/context/my-list-context';
import { useMovieDetail, useSeasonEpisodes, useShowDetail } from '@/hooks/use-tmdb';
import {
    backdropUrl,
    formatRating,
    posterUrl,
    TMDBEpisode,
    TMDBMovieDetail,
    TMDBShowDetail,
} from '@/lib/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
type TabName = 'Episodes' | 'More Like This' | 'Trailers';
const TABS: TabName[] = ['Episodes', 'More Like This', 'Trailers'];

// ─── Episode item ─────────────────────────────────────────────────────────────

function EpisodeItem({
  ep,
  showId,
  season,
  title,
  onPress,
}: {
  ep: TMDBEpisode;
  showId: string;
  season: number;
  title: string;
  onPress: () => void;
}) {
  const still = ep.still_path
    ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
    : null;
  const mins = ep.runtime ? `${ep.runtime}m` : '~50m';

  return (
    <TouchableOpacity style={styles.epRow} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.epThumb}>
        {still ? (
          <Image
            source={{ uri: still }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surfaceVariant }]} />
        )}
        {/* Play overlay */}
        <View style={styles.epPlayOverlay}>
          <Ionicons name="play" size={16} color={Colors.primaryText} />
        </View>
        {/* Episode number badge */}
        <View style={styles.epNumBadge}>
          <Text style={styles.epNumText}>{ep.episode_number}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.epInfo}>
        <Text style={styles.epTitle} numberOfLines={2}>{ep.name}</Text>
        <Text style={styles.epMeta}>{mins}</Text>
        {ep.overview ? (
          <Text style={styles.epOverview} numberOfLines={2}>{ep.overview}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Similar card ─────────────────────────────────────────────────────────────

function SimilarCard({
  poster, title, rating, year, onPress,
}: {
  poster: string | null; title: string; rating: string; year: string; onPress: () => void;
}) {
  const uri = posterUrl(poster, 'w185');
  return (
    <TouchableOpacity style={styles.simCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.simPosterWrap}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="film-outline" size={24} color={Colors.hint} />
          </View>
        )}
        <View style={styles.simRatingBadge}>
          <Text style={styles.simRatingText}>★ {rating}</Text>
        </View>
      </View>
      <Text style={styles.simTitle} numberOfLines={2}>{title}</Text>
      {year ? <Text style={styles.simYear}>{year}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Trailer card ─────────────────────────────────────────────────────────────

function TrailerCard({
  videoKey, name,
}: {
  videoKey: string; name: string;
}) {
  const thumb = `https://img.youtube.com/vi/${videoKey}/hqdefault.jpg`;

  return (
    <TouchableOpacity
      style={styles.trailerCard}
      activeOpacity={0.8}
      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoKey}`)}
    >
      <View style={styles.trailerThumb}>
        <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        {/* Dark overlay */}
        <View style={styles.trailerOverlay} />
        {/* Play button */}
        <View style={styles.trailerPlay}>
          <Ionicons name="logo-youtube" size={36} color="#FF0000" />
        </View>
      </View>
      <Text style={styles.trailerName} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DetailsScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: 'movie' | 'tv' }>();
  const { isInList, toggleList } = useMyList();
  const [activeTab, setActiveTab] = useState<TabName>('Episodes');
  const [selectedSeason, setSelectedSeason] = useState(1);

  const numId = Number(id ?? 0);
  const isMovie = type !== 'tv';

  const movieDetail = useMovieDetail(isMovie ? numId : 0);
  const showDetail  = useShowDetail(!isMovie ? numId : 0);
  const episodesData = useSeasonEpisodes(!isMovie ? numId : 0, selectedSeason);

  const detail: TMDBMovieDetail | TMDBShowDetail | null = isMovie
    ? movieDetail.data
    : showDetail.data;
  const loading = isMovie ? movieDetail.loading : showDetail.loading;
  const error   = isMovie ? movieDetail.error   : showDetail.error;

  const title    = detail ? ((detail as TMDBMovieDetail).title ?? (detail as TMDBShowDetail).name ?? '') : '';
  const overview = detail?.overview ?? '';
  const backdrop = backdropUrl(detail?.backdrop_path ?? null, 'w1280');
  const rating   = detail ? formatRating(detail.vote_average) : '';
  const year     = detail
    ? ((detail as TMDBMovieDetail).release_date ?? (detail as TMDBShowDetail).first_air_date ?? '').slice(0, 4)
    : '';
  const genres   = detail?.genres?.map(g => g.name).join(', ') ?? '';
  const cast     = detail?.credits?.cast?.slice(0, 4).map(c => c.name).join(', ') ?? '';
  const creator  = isMovie
    ? detail?.credits?.crew?.find(c => c.job === 'Director')?.name ?? ''
    : (detail as TMDBShowDetail)?.created_by?.[0]?.name ?? '';

  const seasons  = !isMovie ? (detail as TMDBShowDetail)?.seasons?.filter(s => s.season_number > 0) ?? [] : [];
  const runtime  = isMovie ? (detail as TMDBMovieDetail)?.runtime : null;

  const similar = isMovie
    ? (detail as TMDBMovieDetail)?.similar?.results ?? []
    : (detail as TMDBShowDetail)?.similar?.results ?? [];

  const trailers = detail?.videos?.results?.filter(
    v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  ) ?? [];

  const inList = isInList(numId);

  const handleToggleList = () => {
    if (!detail) return;
    const originCountries = !isMovie
      ? (detail as TMDBShowDetail & { origin_country?: string[] }).origin_country ?? []
      : [];
    const listItem: ListItem = {
      id: numId,
      type: isMovie ? 'movie' : 'tv',
      title,
      posterPath: detail.poster_path ?? null,
      backdropPath: detail.backdrop_path ?? null,
      rating: detail.vote_average,
      year,
      category: resolveCategory(
        isMovie ? 'movie' : 'tv',
        detail.genre_ids ?? detail.genres?.map(g => g.id) ?? [],
        originCountries,
      ),
    };
    toggleList(listItem);
  };

  // ── Tab content ──────────────────────────────────────────────────────────────

  const renderTabContent = () => {
    if (activeTab === 'Episodes') {
      if (isMovie) {
        // Movies don't have episodes — show similar instead
        return renderSimilar();
      }
      return (
        <View style={styles.tabContent}>
          {/* Season selector */}
          {seasons.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seasonTabs}
            >
              {seasons.map(s => (
                <TouchableOpacity
                  key={s.season_number}
                  style={[
                    styles.seasonTab,
                    s.season_number === selectedSeason && styles.seasonTabActive,
                  ]}
                  onPress={() => setSelectedSeason(s.season_number)}
                >
                  <Text style={[
                    styles.seasonTabText,
                    s.season_number === selectedSeason && styles.seasonTabTextActive,
                  ]}>
                    Season {s.season_number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Episodes list */}
          {episodesData.loading ? (
            <View style={styles.tabLoader}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.epList}>
              {(episodesData.data?.episodes ?? []).map(ep => (
                <EpisodeItem
                  key={ep.id}
                  ep={ep}
                  showId={id}
                  season={selectedSeason}
                  title={title}
                  onPress={() => router.push({
                    pathname: '/player',
                    params: {
                      id,
                      type: 'tv',
                      season: String(selectedSeason),
                      episode: String(ep.episode_number),
                      title,
                      posterPath: detail?.poster_path ?? '',
                      backdropPath: detail?.backdrop_path ?? '',
                    },
                  })}
                />
              ))}
            </View>
          )}
        </View>
      );
    }

    if (activeTab === 'More Like This') {
      return renderSimilar();
    }

    if (activeTab === 'Trailers') {
      if (trailers.length === 0) {
        return (
          <View style={styles.emptyTab}>
            <Ionicons name="videocam-outline" size={48} color={Colors.hint} />
            <Text style={styles.emptyTabText}>No trailers available</Text>
          </View>
        );
      }
      return (
        <View style={styles.tabContent}>
          {trailers.map(v => (
            <TrailerCard key={v.id} videoKey={v.key} name={v.name} />
          ))}
        </View>
      );
    }

    return null;
  };

  const renderSimilar = () => {
    if (similar.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Ionicons name="film-outline" size={48} color={Colors.hint} />
          <Text style={styles.emptyTabText}>No recommendations available</Text>
        </View>
      );
    }
    return (
      <View style={styles.tabContent}>
        <FlatList
          data={similar.slice(0, 20)}
          numColumns={3}
          scrollEnabled={false}
          keyExtractor={s => String(s.id)}
          columnWrapperStyle={styles.simGrid}
          renderItem={({ item: s }) => (
            <SimilarCard
              poster={(s as any).poster_path}
              title={(s as any).title ?? (s as any).name ?? ''}
              rating={formatRating(s.vote_average)}
              year={((s as any).release_date ?? (s as any).first_air_date ?? '').slice(0, 4)}
              onPress={() => router.push({
                pathname: '/details',
                params: { id: String(s.id), type },
              })}
            />
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {backdrop ? (
            <Image
              source={{ uri: backdrop }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={400}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d1b2a' }]} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', '#000000']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
          />
          {loading && (
            <ActivityIndicator color={Colors.primary} style={styles.heroLoader} />
          )}
        </View>

        {/* ── Info ── */}
        {loading ? (
          <View style={styles.infoSection}>
            <Skeleton width="60%" height={28} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="40%" height={16} style={{ marginBottom: Spacing.md }} />
            <Skeleton width="100%" height={48} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={48} />
          </View>
        ) : error ? (
          <View style={styles.infoSection}>
            <Text style={styles.errorText}>Failed to load. Check your TMDB API token.</Text>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.titleText}>{title}</Text>

            {/* Meta */}
            <View style={styles.metaRow}>
              <Text style={styles.matchText}>★ {rating}</Text>
              {year ? <Text style={styles.metaText}>{year}</Text> : null}
              {runtime ? (
                <Text style={styles.metaText}>{Math.floor(runtime / 60)}h {runtime % 60}m</Text>
              ) : seasons.length > 0 ? (
                <Text style={styles.metaText}>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</Text>
              ) : null}
              {genres ? (
                <View style={styles.genreChip}>
                  <Text style={styles.genreChipText} numberOfLines={1}>{genres.split(',')[0].trim()}</Text>
                </View>
              ) : null}
            </View>

            {/* Action buttons */}
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => router.push({
                  pathname: '/player',
                  params: { id, type, season: '1', episode: '1', title,
                    posterPath: detail?.poster_path ?? '',
                    backdropPath: detail?.backdrop_path ?? '',
                  },
                })}
                activeOpacity={0.85}>
                <Ionicons name="play" size={20} color="#000" />
                <Text style={styles.playBtnText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.85}>
                <Ionicons name="download-outline" size={20} color={Colors.primaryText} />
                <Text style={styles.downloadBtnText}>
                  {isMovie ? 'Download' : 'Download S1:E1'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Overview */}
            <Text style={styles.description} numberOfLines={4}>{overview}</Text>

            {/* Credits */}
            <View style={styles.credits}>
              {cast ? (
                <View style={styles.creditRow}>
                  <Text style={styles.creditLabel}>Cast: </Text>
                  <Text style={styles.creditValue} numberOfLines={1}>{cast}</Text>
                </View>
              ) : null}
              {creator ? (
                <View style={styles.creditRow}>
                  <Text style={styles.creditLabel}>{isMovie ? 'Director' : 'Creator'}: </Text>
                  <Text style={styles.creditValue}>{creator}</Text>
                </View>
              ) : null}
            </View>

            {/* Icon actions */}
            <View style={styles.iconActions}>
              <TouchableOpacity style={styles.iconAction} onPress={handleToggleList}>
                <Ionicons
                  name={inList ? 'checkmark-circle' : 'add-circle-outline'}
                  size={28}
                  color={inList ? Colors.success : Colors.primaryText}
                />
                <Text style={[styles.iconActionLabel, inList && { color: Colors.success }]}>
                  {inList ? 'In List' : 'My List'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction}>
                <Ionicons name="thumbs-up-outline" size={28} color={Colors.primaryText} />
                <Text style={styles.iconActionLabel}>Rate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction}>
                <Ionicons name="share-outline" size={28} color={Colors.primaryText} />
                <Text style={styles.iconActionLabel}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          {TABS.map(tab => {
            // Hide Episodes tab for movies
            if (tab === 'Episodes' && isMovie) return null;
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabBarItem}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabBarText, isActive && styles.tabBarTextActive]}>
                  {tab}
                </Text>
                {isActive && <View style={styles.tabBarUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab content ── */}
        {!loading && renderTabContent()}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Back button ── */}
      <SafeAreaView style={styles.backBtn} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { height: 300 },
  heroLoader: { position: 'absolute', alignSelf: 'center', top: '40%' },
  backBtn: { position: 'absolute', top: 0, left: 0, padding: Spacing.lg },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Info section
  infoSection: { padding: Spacing.lg, gap: Spacing.md },
  titleText: { fontSize: 26, fontWeight: '800', color: Colors.primaryText, lineHeight: 30 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  matchText: { ...TextStyles.bodyMedium, color: Colors.success, fontWeight: '700' },
  metaText: { ...TextStyles.bodyMedium, color: Colors.secondaryText },
  genreChip: {
    borderWidth: 1, borderColor: Colors.secondaryText,
    paddingHorizontal: Spacing.xs, paddingVertical: 1, borderRadius: Radii.xs,
  },
  genreChipText: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  actionBtns: { gap: Spacing.sm },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryText, paddingVertical: Spacing.sm + 4, borderRadius: Radii.sm,
  },
  playBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant, paddingVertical: Spacing.sm + 4, borderRadius: Radii.sm,
  },
  downloadBtnText: { color: Colors.primaryText, fontWeight: '700', fontSize: 16 },
  description: { ...TextStyles.bodyMedium, color: Colors.primaryText, lineHeight: 21 },
  credits: { gap: 4 },
  creditRow: { flexDirection: 'row', flexWrap: 'wrap' },
  creditLabel: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  creditValue: { ...TextStyles.labelSmall, color: Colors.primaryText, flex: 1 },
  iconActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  iconAction: { alignItems: 'center', gap: Spacing.xs },
  iconActionLabel: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  errorText: { ...TextStyles.bodyMedium, color: Colors.error, textAlign: 'center' },

  // Divider
  divider: { height: 1, backgroundColor: Colors.divider },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabBarItem: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
    alignItems: 'center',
  },
  tabBarText: { ...TextStyles.labelLarge, color: Colors.secondaryText },
  tabBarTextActive: { color: Colors.primaryText },
  tabBarUnderline: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: Colors.primary,
  },

  // Tab content
  tabContent: { paddingTop: Spacing.md },
  tabLoader: { padding: Spacing.xxl, alignItems: 'center' },
  emptyTab: {
    alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md,
  },
  emptyTabText: { ...TextStyles.bodyMedium, color: Colors.hint },

  // Season selector
  seasonTabs: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  seasonTab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.outline,
    backgroundColor: Colors.surface,
  },
  seasonTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seasonTabText: { ...TextStyles.labelLarge, color: Colors.primaryText },
  seasonTabTextActive: { color: Colors.onPrimary },

  // Episode item
  epList: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  epRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', minHeight: 74 },
  epThumb: {
    width: 130, height: 74,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceVariant,
    overflow: 'hidden',
    flexShrink: 0,
  },
  epPlayOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  epNumBadge: {
    position: 'absolute', bottom: Spacing.xs, left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs, paddingVertical: 1,
  },
  epNumText: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  epInfo: { flex: 1, gap: 2, justifyContent: 'center' },
  epTitle: { ...TextStyles.titleSmall, color: Colors.primaryText },
  epMeta: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  epOverview: { ...TextStyles.bodySmall, color: Colors.hint, marginTop: 2 },

  // Similar grid
  simGrid: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.md },
  simCard: { flex: 1 / 3 },
  simPosterWrap: {
    aspectRatio: 0.65,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.xs,
  },
  simRatingBadge: {
    position: 'absolute', bottom: Spacing.xs, right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs, paddingVertical: 1,
  },
  simRatingText: { color: Colors.primaryText, fontSize: 9, fontWeight: '700' },
  simTitle: { ...TextStyles.labelSmall, color: Colors.primaryText },
  simYear: { ...TextStyles.labelSmall, color: Colors.hint },

  // Trailer
  trailerCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  trailerThumb: {
    width: '100%', height: (SCREEN_W - Spacing.lg * 2) * 9 / 16,
    borderRadius: Radii.md, overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
  },
  trailerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  trailerPlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  trailerName: {
    ...TextStyles.titleSmall, color: Colors.primaryText,
    marginTop: Spacing.sm,
  },
});
