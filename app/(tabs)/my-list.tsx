import { CardRowSkeleton } from "@/components/skeleton";
import { Colors, Radii, Spacing, TextStyles } from "@/constants/theme";
import {
  useAsianShorts,
  useCDramas,
  useKDramas,
  useTaiwanDramas,
  useThaiDramas,
} from "@/hooks/use-tmdb";
import {
  backdropUrl,
  getTitle,
  getYear,
  posterUrl,
  TMDBMovie,
  TMDBShow,
} from "@/lib/tmdb";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm * 2) / 3;

type Tab = "C-Drama" | "K-Drama" | "Thai" | "Taiwan" | "Shorts";
const TABS: Tab[] = ["C-Drama", "K-Drama", "Thai", "Taiwan", "Shorts"];

// ─── Short card (vertical poster) ────────────────────────────────────────────

function ShortCard({
  item,
  type,
  onPress,
}: {
  item: TMDBShow | TMDBMovie;
  type: "tv" | "movie";
  onPress: () => void;
}) {
  const poster = posterUrl((item as any).poster_path, "w342");
  const title = getTitle(item as any);
  const year = getYear(item as any);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardPoster}>
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardPlaceholder]}>
            <Ionicons name="film-outline" size={24} color={Colors.hint} />
          </View>
        )}
        <View style={styles.cardTypeBadge}>
          <Text style={styles.cardTypeTxt}>
            {type === "movie" ? "SHORT" : "SERIES"}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
      {year ? <Text style={styles.cardYear}>{year}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Featured banner ──────────────────────────────────────────────────────────

function FeaturedBanner({
  item,
  type,
  onPress,
}: {
  item: TMDBShow | TMDBMovie;
  type: "tv" | "movie";
  onPress: () => void;
}) {
  const backdrop = backdropUrl((item as any).backdrop_path, "w780");
  const title = getTitle(item as any);
  const year = getYear(item as any);

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {backdrop ? (
        <Image
          source={{ uri: backdrop }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: Colors.surfaceVariant },
          ]}
        />
      )}
      <View style={styles.bannerOverlay} />
      <View style={styles.bannerContent}>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeTxt}>✦ FEATURED</Text>
        </View>
        <Text style={styles.bannerTitle} numberOfLines={2}>
          {title}
        </Text>
        {year ? <Text style={styles.bannerYear}>{year}</Text> : null}
        <TouchableOpacity style={styles.bannerPlay} onPress={onPress}>
          <Ionicons name="play" size={14} color="#000" />
          <Text style={styles.bannerPlayTxt}>Watch Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  data,
  loading,
  type,
  onPress,
}: {
  title: string;
  data: (TMDBShow | TMDBMovie)[];
  loading: boolean;
  type: "tv" | "movie";
  onPress: (id: number) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? (
        <CardRowSkeleton />
      ) : (
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => `${type}-${i.id}`}
          contentContainerStyle={styles.rowPad}
          renderItem={({ item }) => (
            <ShortCard
              item={item}
              type={type}
              onPress={() => onPress(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShortTVScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("C-Drama");

  const cdramas = useCDramas();
  const kdramas = useKDramas();
  const thai = useThaiDramas();
  const taiwan = useTaiwanDramas();
  const shorts = useAsianShorts();

  const currentData = useMemo(() => {
    switch (activeTab) {
      case "C-Drama":
        return {
          data: cdramas.data?.results ?? [],
          loading: cdramas.loading,
          type: "tv" as const,
        };
      case "K-Drama":
        return {
          data: kdramas.data?.results ?? [],
          loading: kdramas.loading,
          type: "tv" as const,
        };
      case "Thai":
        return {
          data: thai.data?.results ?? [],
          loading: thai.loading,
          type: "tv" as const,
        };
      case "Taiwan":
        return {
          data: taiwan.data?.results ?? [],
          loading: taiwan.loading,
          type: "tv" as const,
        };
      case "Shorts":
        return {
          data: shorts.data?.results ?? [],
          loading: shorts.loading,
          type: "movie" as const,
        };
    }
  }, [activeTab, cdramas, kdramas, thai, taiwan, shorts]);

  const featured = currentData.data[0];

  const navigate = (id: number) =>
    router.push({
      pathname: "/details",
      params: { id: String(id), type: currentData.type },
    });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ShortTV</Text>
        <Text style={styles.headerSub}>Asian Shorts & Dramas</Text>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Featured banner ── */}
        {currentData.loading ? (
          <View style={styles.bannerSkeleton}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : featured ? (
          <FeaturedBanner
            item={featured}
            type={currentData.type}
            onPress={() => navigate(featured.id)}
          />
        ) : null}

        {/* ── Grid of all items ── */}
        <Section
          title={
            activeTab === "Shorts" ? "Asian Short Films" : `${activeTab} Series`
          }
          data={currentData.data.slice(1)}
          loading={currentData.loading}
          type={currentData.type}
          onPress={navigate}
        />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.primaryText },
  headerSub: {
    ...TextStyles.bodySmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },

  tabsScroll: { flexGrow: 0 },
  tabsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabItem: {
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
  tabText: { ...TextStyles.labelLarge, color: Colors.secondaryText },
  tabTextActive: { color: Colors.onPrimary },

  // Featured banner
  banner: {
    height: 200,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radii.lg,
    overflow: "hidden",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerContent: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    gap: Spacing.xs,
  },
  bannerBadge: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  bannerBadgeTxt: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bannerTitle: { fontSize: 20, fontWeight: "800", color: Colors.primaryText },
  bannerYear: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  bannerPlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primaryText,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.sm,
    marginTop: Spacing.xs,
  },
  bannerPlayTxt: { color: "#000", fontWeight: "700", fontSize: 13 },
  bannerSkeleton: {
    height: 200,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },

  // Section
  section: { marginTop: Spacing.md },
  sectionTitle: {
    ...TextStyles.titleMedium,
    color: Colors.primaryText,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  rowPad: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  // Card
  card: { width: CARD_W },
  cardPoster: {
    width: CARD_W,
    aspectRatio: 0.65,
    borderRadius: Radii.md,
    overflow: "hidden",
    backgroundColor: Colors.surfaceVariant,
  },
  cardPlaceholder: { justifyContent: "center", alignItems: "center" },
  cardTypeBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  cardTypeTxt: { color: Colors.primary, fontSize: 8, fontWeight: "800" },
  cardTitle: {
    ...TextStyles.labelSmall,
    color: Colors.primaryText,
    marginTop: Spacing.xs,
  },
  cardYear: { ...TextStyles.labelSmall, color: Colors.hint },
});
