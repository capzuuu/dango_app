import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ListItem, useMyList } from '@/context/my-list-context';
import { formatRating, posterUrl } from '@/lib/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'Movies' | 'TV Shows' | 'K-Dramas' | 'Anime';
const FILTER_TABS: FilterTab[] = ['All', 'Movies', 'TV Shows', 'K-Dramas', 'Anime'];

// ─── Poster card ──────────────────────────────────────────────────────────────

function PosterCard({
  item,
  onPress,
  onRemove,
}: {
  item: ListItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const uri = posterUrl(item.posterPath, 'w342');

  return (
    <TouchableOpacity style={styles.posterWrap} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.posterContainer}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.posterPlaceholder]}>
            <Ionicons name="film-outline" size={24} color={Colors.hint} />
          </View>
        )}

        {/* Remove button */}
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={Colors.primaryText} />
        </TouchableOpacity>

        {/* Rating pill */}
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={9} color={Colors.primary} />
          <Text style={styles.ratingText}>{formatRating(item.rating)}</Text>
        </View>

        {/* Type badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'movie' ? 'MOVIE' : 'TV'}
          </Text>
        </View>
      </View>
      <Text style={styles.posterTitle} numberOfLines={2}>{item.title}</Text>
      {item.year ? <Text style={styles.posterYear}>{item.year}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyListScreen() {
  const router = useRouter();
  const { items, removeFromList } = useMyList();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const filtered = activeTab === 'All'
    ? items
    : items.filter(i => i.category === activeTab);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My List</Text>
          <Text style={styles.subtitle}>{items.length} title{items.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ── */}
      <FlatList
        data={FILTER_TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={t => t}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
        renderItem={({ item: tab }) => {
          const isActive = tab === activeTab;
          const count = tab === 'All'
            ? items.length
            : items.filter(i => i.category === tab).length;
          return (
            <TouchableOpacity
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.divider} />

      {/* ── Grid ── */}
      <FlatList
        data={filtered}
        key={activeTab}
        numColumns={3}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={filtered.length > 0 ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PosterCard
            item={item}
            onPress={() =>
              router.push({
                pathname: '/details',
                params: { id: String(item.id), type: item.type },
              })
            }
            onRemove={() => removeFromList(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={56} color={Colors.hint} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'All'
                ? 'Tap + My List on any title to save it here'
                : `No ${activeTab.toLowerCase()} saved yet`}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  title: { ...TextStyles.titleLarge, color: Colors.primaryText },
  subtitle: { ...TextStyles.bodySmall, color: Colors.hint, marginTop: 2 },

  // Tabs
  tabsScroll: { flexGrow: 0 },
  tabsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surface,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: { ...TextStyles.labelLarge, color: Colors.primaryText },
  tabTextActive: { color: Colors.onPrimary },
  tabCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: Colors.secondaryText },
  tabCountTextActive: { color: Colors.onPrimary },

  // Divider
  divider: { height: 1, backgroundColor: Colors.divider },

  // Grid
  grid: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  gridRow: { gap: Spacing.md, marginBottom: Spacing.md },
  posterWrap: { flex: 1 / 3 },
  posterContainer: {
    aspectRatio: 0.65,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
  },
  posterPlaceholder: {
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtn: {
    position: 'absolute', top: Spacing.xs, right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  ratingPill: {
    position: 'absolute',
    bottom: Spacing.xs, right: Spacing.xs,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs, paddingVertical: 2,
  },
  ratingText: { color: Colors.primaryText, fontSize: 9, fontWeight: '700' },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.xs, left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs, paddingVertical: 2,
  },
  typeBadgeText: { color: Colors.secondaryText, fontSize: 8, fontWeight: '700' },
  posterTitle: {
    ...TextStyles.labelSmall,
    color: Colors.primaryText,
    marginTop: Spacing.xs,
  },
  posterYear: {
    ...TextStyles.labelSmall,
    color: Colors.hint,
    marginTop: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { ...TextStyles.titleMedium, color: Colors.primaryText },
  emptySubtitle: {
    ...TextStyles.bodyMedium, color: Colors.hint,
    textAlign: 'center', lineHeight: 22,
  },
});
