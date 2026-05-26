import { Colors, Radii, Spacing, TextStyles } from "@/constants/theme";
import { useMangaFireSearch } from "@/hooks/use-mangafire";
import {
  useKDramas,
  usePopularMovies,
  usePopularTV,
  useSearch,
} from "@/hooks/use-tmdb";
import { MangaFireItem } from "@/lib/mangafire";
import {
  formatRating,
  GENRE_MAP,
  getTitle,
  getYear,
  posterUrl,
  TMDBItem,
} from "@/lib/tmdb";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  { id: "kdrama", label: "K-Drama", color: "#1a0a2e", accent: "#9b59b6" },
  { id: "movies", label: "Movies", color: "#0a1a2e", accent: "#3498db" },
  { id: "series", label: "Series", color: "#0a2e1a", accent: "#27ae60" },
  { id: "action", label: "Action", color: "#2e1a1a", accent: "#f44336" },
  { id: "romance", label: "Romance", color: "#2e0a1a", accent: "#e91e63" },
  { id: "thriller", label: "Thriller", color: "#1a2e0a", accent: "#8bc34a" },
  { id: "horror", label: "Horror", color: "#1a1a0a", accent: "#ff6f00" },
  { id: "comedy", label: "Comedy", color: "#1a2e2e", accent: "#00bcd4" },
];

function ResultRow({ item, onPress }: { item: TMDBItem; onPress: () => void }) {
  const poster = posterUrl(item.poster_path, "w185");
  const title = getTitle(item);
  const year = getYear(item);
  const type = (item as any).media_type === "tv" ? "TV Show" : "Movie";
  const genres = item.genre_ids
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .join(", ");
  const rating = formatRating(item.vote_average);

  return (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {poster ? (
        <Image
          source={{ uri: poster }}
          style={styles.resultThumb}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
          <Ionicons name="film-outline" size={20} color={Colors.hint} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.resultMeta}>
          {type}
          {year ? ` · ${year}` : ""}
          {genres ? ` · ${genres}` : ""}
        </Text>
      </View>
      <View style={styles.scoreBox}>
        <Ionicons name="star" size={11} color={Colors.primary} />
        <Text style={styles.scoreText}>{rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MangaResultRow({
  item,
  onPress,
}: {
  item: MangaFireItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {item.posterUrl ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.resultThumb}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
          <Ionicons name="book-outline" size={20} color={Colors.hint} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.resultMeta}>Manga · MangaFire</Text>
      </View>
      <View style={styles.mangaPill}>
        <Ionicons name="book" size={11} color={Colors.primary} />
        <Text style={styles.mangaPillText}>Read</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const searchResults = useSearch(query);
  const mangaResults = useMangaFireSearch(query);
  const kdramas = useKDramas();
  const movies = usePopularMovies();
  const tv = usePopularTV();

  // Trending tags derived from popular data
  const trendingTags = [
    ...(kdramas.data?.results.slice(0, 3).map((i) => getTitle(i)) ?? []),
    ...(movies.data?.results.slice(0, 2).map((i) => getTitle(i)) ?? []),
    ...(tv.data?.results.slice(0, 2).map((i) => getTitle(i)) ?? []),
  ].slice(0, 7);

  const handlePress = (item: TMDBItem) => {
    const type = (item as any).media_type === "tv" ? "tv" : "movie";
    router.push({
      pathname: "/details",
      params: { id: String(item.id), type },
    });
  };

  const handleMangaPress = (item: MangaFireItem) => {
    router.push({
      pathname: "/manga-reader",
      params: {
        url: item.url,
        title: item.title,
        posterUrl: item.posterUrl ?? "",
      },
    });
  };

  const isSearching = query.trim().length > 0;
  const mediaResults =
    searchResults.data?.results.filter(
      (i) =>
        (i as any).media_type === "movie" || (i as any).media_type === "tv",
    ) ?? [];
  const combinedLoading = searchResults.loading || mangaResults.loading;
  const hasAnyResults = mediaResults.length > 0 || mangaResults.data.length > 0;

  const movieResults = mediaResults.filter(
    (i) => (i as any).media_type === "movie",
  );

  const tvResults = mediaResults.filter((i) => (i as any).media_type === "tv");

  const isKDrama = (item: TMDBItem) => {
    const anyItem = item as any;
    const originCountries: string[] = Array.isArray(anyItem.origin_country)
      ? anyItem.origin_country
      : [];
    const hasKR = originCountries.includes("KR");
    const hasDrama =
      Array.isArray(item.genre_ids) && item.genre_ids.includes(18); // Drama
    return hasKR || hasDrama;
  };

  const isAnime = (item: TMDBItem) => {
    const anyItem = item as any;
    const originCountries: string[] = Array.isArray(anyItem.origin_country)
      ? anyItem.origin_country
      : [];
    const hasJP = originCountries.includes("JP");
    const hasAnimation =
      Array.isArray(item.genre_ids) && item.genre_ids.includes(16); // Animation
    return hasJP || hasAnimation;
  };

  const kdramaResults = tvResults.filter(isKDrama);
  const animeResults = tvResults.filter(isAnime);

  const seriesResults = tvResults.filter(
    (item) => !isKDrama(item) && !isAnime(item),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.hint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, series, kdramas, manga..."
            placeholderTextColor={Colors.hint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.hint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Search results ── */}
      {isSearching ? (
        <View style={styles.resultsContainer}>
          {combinedLoading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginTop: Spacing.xxl }}
            />
          ) : searchResults.error && mangaResults.error ? (
            <Text style={styles.errorText}>
              Could not load results right now.
            </Text>
          ) : !hasAnyResults ? (
            <View style={styles.emptySearch}>
              <Ionicons name="search-outline" size={48} color={Colors.hint} />
              <Text style={styles.emptyText}>
                No results for &quot;{query}&quot;
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            >
              {/* Movies */}
              {movieResults.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Movies</Text>
                  {movieResults.map((item) => (
                    <ResultRow
                      key={`movie-${item.id}`}
                      item={item}
                      onPress={() => handlePress(item)}
                    />
                  ))}
                  <View style={{ height: Spacing.md }} />
                </>
              )}

              {/* K-Drama */}
              {kdramaResults.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>K-Drama</Text>
                  {kdramaResults.map((item) => (
                    <ResultRow
                      key={`kdrama-${item.id}`}
                      item={item}
                      onPress={() => handlePress(item)}
                    />
                  ))}
                  <View style={{ height: Spacing.md }} />
                </>
              )}

              {/* Anime */}
              {animeResults.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Anime</Text>
                  {animeResults.map((item) => (
                    <ResultRow
                      key={`anime-${item.id}`}
                      item={item}
                      onPress={() => handlePress(item)}
                    />
                  ))}
                  <View style={{ height: Spacing.md }} />
                </>
              )}

              {/* Series */}
              {seriesResults.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Series</Text>
                  {seriesResults.map((item) => (
                    <ResultRow
                      key={`series-${item.id}`}
                      item={item}
                      onPress={() => handlePress(item)}
                    />
                  ))}
                  <View style={{ height: Spacing.md }} />
                </>
              )}

              {/* Manga */}
              {mangaResults.data.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Manga</Text>
                  {mangaResults.data.map((item) => (
                    <MangaResultRow
                      key={`manga-${item.id}`}
                      item={item}
                      onPress={() => handleMangaPress(item)}
                    />
                  ))}
                  <View style={{ height: Spacing.xxl }} />
                </>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        /* ── Browse mode ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Trending tags */}
          <Text style={styles.sectionTitle}>Trending Searches</Text>
          <View style={styles.tagsWrap}>
            {trendingTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                activeOpacity={0.75}
                onPress={() => setQuery(tag)}
              >
                <Ionicons name="trending-up" size={12} color={Colors.primary} />
                <Text style={styles.tagText} numberOfLines={1}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Categories */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            Categories
          </Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catCard, { backgroundColor: cat.color }]}
                activeOpacity={0.8}
                onPress={() => setQuery(cat.label)}
              >
                <View
                  style={[styles.catAccentBar, { backgroundColor: cat.accent }]}
                />
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recommended — top K-Dramas */}
          <View style={styles.recHeader}>
            <Text style={styles.sectionTitle}>Recommended K-Dramas</Text>
          </View>
          {kdramas.loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            kdramas.data?.results.slice(0, 6).map((item) => (
              <ResultRow
                key={item.id}
                item={{ ...item, media_type: "tv" } as TMDBItem}
                onPress={() =>
                  router.push({
                    pathname: "/details",
                    params: { id: String(item.id), type: "tv" },
                  })
                }
              />
            ))
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...TextStyles.headlineMedium, color: Colors.primaryText },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: Colors.primaryText, fontWeight: "700" },

  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  searchInput: { flex: 1, color: Colors.primaryText, fontSize: 14 },

  // Results
  resultsContainer: { flex: 1 },
  resultsList: { paddingHorizontal: Spacing.lg },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  resultThumb: { width: 56, height: 80, borderRadius: Radii.sm },
  resultThumbPlaceholder: {
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: { flex: 1 },
  resultTitle: {
    ...TextStyles.titleSmall,
    color: Colors.primaryText,
    marginBottom: 3,
  },
  resultMeta: { ...TextStyles.bodySmall, color: Colors.secondaryText },
  scoreBox: { flexDirection: "row", alignItems: "center", gap: 3 },
  scoreText: { ...TextStyles.labelMedium, color: Colors.primaryText },
  mangaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  mangaPillText: { ...TextStyles.labelSmall, color: Colors.primaryText },

  emptySearch: {
    alignItems: "center",
    paddingTop: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyText: { ...TextStyles.bodyMedium, color: Colors.hint },
  errorText: {
    ...TextStyles.bodyMedium,
    color: Colors.error,
    textAlign: "center",
    padding: Spacing.lg,
  },

  // Browse
  scroll: { paddingHorizontal: Spacing.lg },
  sectionTitle: {
    ...TextStyles.titleMedium,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.outline,
    maxWidth: 180,
  },
  tagText: {
    ...TextStyles.bodySmall,
    color: Colors.primaryText,
    flexShrink: 1,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  catCard: {
    width: "47%",
    height: 80,
    borderRadius: Radii.lg,
    justifyContent: "flex-end",
    padding: Spacing.md,
    overflow: "hidden",
  },
  catAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  catLabel: { ...TextStyles.titleSmall, color: Colors.primaryText },
  recHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
