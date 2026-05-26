import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ListItem, useMyList } from '@/context/my-list-context';
import { posterUrl } from '@/lib/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
const GAP = Spacing.sm;
const H_PAD = Spacing.lg;
const COLS = 3;
const CARD_W = (SCREEN_W - H_PAD * 2 - GAP * (COLS - 1)) / COLS;

const FILTERS = ['All', 'Movies', 'TV Shows', 'K-Dramas', 'Anime'] as const;
type Filter = (typeof FILTERS)[number];

function PosterCard({ item, onPress }: { item: ListItem; onPress: () => void }) {
  const uri = posterUrl(item.posterPath, 'w342');
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.poster}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Ionicons name="film-outline" size={28} color={Colors.hint} />
          </View>
        )}
        {/* Category badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      {item.year ? <Text style={styles.cardYear}>{item.year}</Text> : null}
    </TouchableOpacity>
  );
}

export default function MyListFullScreen() {
  const router = useRouter();
  const { items } = useMyList();
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = filter === 'All'
    ? items
    : items.filter(i => i.category === filter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My List</Text>
          <Text style={styles.headerSub}>{items.length} saved titles</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Count row ── */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} {filter === 'All' ? 'titles' : filter}
        </Text>
      </View>

      {/* ── Grid / Empty ── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={56} color={Colors.surfaceVariant} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            {filter === 'All'
              ? 'Add titles from the home screen to see them here.'
              : `No ${filter} in your list.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={COLS}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const col = index % COLS;
            return (
              <View style={[
                styles.cardWrap,
                col < COLS - 1 && { marginRight: GAP },
              ]}>
                <PosterCard
                  item={item}
                  onPress={() => router.push({
                    pathname: '/details',
                    params: { id: String(item.id), type: item.type },
                  })}
                />
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { ...TextStyles.headlineSmall, color: Colors.primaryText },
  headerSub: { ...TextStyles.bodySmall, color: Colors.secondaryText, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider },

  // Filters
  filtersScroll: { flexGrow: 0 },
  filtersRow: {
    paddingHorizontal: H_PAD,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { ...TextStyles.labelMedium, color: Colors.secondaryText },
  chipTextActive: { color: '#fff' },

  // Count
  countRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: Spacing.sm,
  },
  countText: { ...TextStyles.labelMedium, color: Colors.hint },

  // Grid
  grid: {
    paddingHorizontal: H_PAD,
    paddingBottom: Spacing.xxl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cardWrap: { width: CARD_W },

  // Card
  card: { width: CARD_W },
  poster: {
    width: CARD_W,
    height: CARD_W * 1.48,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
  },
  posterPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  badgeText: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  cardTitle: {
    ...TextStyles.bodySmall,
    color: Colors.primaryText,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  cardYear: { ...TextStyles.labelSmall, color: Colors.hint, marginTop: 2 },

  // Empty
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: { ...TextStyles.titleMedium, color: Colors.primaryText },
  emptyText: { ...TextStyles.bodySmall, color: Colors.hint, textAlign: 'center' },
});
