import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DOWNLOADS = [
  {
    id: '1', title: 'Midnight in Seoul', sub: '3 Episodes · 1.2 GB',
    color: '#0d1b2a', done: true, progress: 1,
  },
  {
    id: '2', title: 'The Silent Sea', sub: '1 Movie · 850 MB',
    color: '#1b1b2f', done: true, progress: 1,
  },
  {
    id: '3', title: 'Crash Landing on You', sub: '5 Episodes · 2.4 GB',
    color: '#0a1a1a', done: true, progress: 1,
  },
  {
    id: '4', title: 'Kingdom', sub: '2 Episodes · 940 MB',
    color: '#0a1a0a', done: false, progress: 0.6,
  },
];

export default function DownloadsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Smart Downloads banner ── */}
        <View style={styles.smartBanner}>
          <View style={styles.smartIcon}>
            <Ionicons name="wifi" size={20} color={Colors.onSurfaceVariant} />
          </View>
          <View style={styles.smartInfo}>
            <Text style={styles.smartTitle}>Smart Downloads</Text>
            <Text style={styles.smartSub}>ON · We'll download the next episode for you</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.secondaryText} />
        </View>

        {/* ── Section label ── */}
        <Text style={styles.sectionLabel}>TV Shows & Movies</Text>

        {/* ── Download items ── */}
        {DOWNLOADS.map(item => (
          <View key={item.id} style={styles.dlItem}>
            <View style={[styles.dlThumb, { backgroundColor: item.color }]}>
              <Ionicons name="film-outline" size={22} color="rgba(255,255,255,0.35)" />
            </View>
            <View style={styles.dlInfo}>
              <Text style={styles.dlTitle}>{item.title}</Text>
              <Text style={styles.dlSub}>{item.sub}</Text>
              {!item.done && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.progress * 100}%` as any }]} />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.dlAction}>
              {item.done
                ? <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
                : <Ionicons name="pause-circle-outline" size={26} color={Colors.primary} />
              }
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Storage card ── */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageTitle}>Device Storage</Text>
            <Text style={styles.storageUsed}>12.4 GB used of 128 GB</Text>
          </View>
          <View style={styles.storageTrack}>
            <View style={[styles.storageFill, { width: '10%' }]} />
          </View>
          <Text style={styles.storageNote}>5.4 GB used by Dango</Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* ── Coming Soon overlay ── */}
      <View style={styles.blurOverlay} />
      <View style={styles.comingSoonBox}>
        <View style={styles.comingSoonIcon}>
          <Ionicons name="cloud-download-outline" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonSub}>Downloads will be available in a future update.</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  title: { ...TextStyles.titleLarge, color: Colors.primaryText },
  divider: { height: 1, backgroundColor: Colors.divider },

  // Scroll
  scroll: { padding: Spacing.lg, gap: Spacing.lg },

  // Smart banner
  smartBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.outline,
  },
  smartIcon: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  smartInfo: { flex: 1 },
  smartTitle: { ...TextStyles.titleSmall, color: Colors.primaryText },
  smartSub: { ...TextStyles.bodySmall, color: Colors.secondaryText, marginTop: 2 },

  // Section label
  sectionLabel: { ...TextStyles.labelLarge, color: Colors.secondaryText },

  // Download item
  dlItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dlThumb: {
    width: 80, height: 56, borderRadius: Radii.md,
    justifyContent: 'center', alignItems: 'center',
  },
  dlInfo: { flex: 1, gap: 2 },
  dlTitle: { ...TextStyles.titleSmall, color: Colors.primaryText },
  dlSub: { ...TextStyles.bodySmall, color: Colors.secondaryText },
  progressTrack: {
    height: 3, backgroundColor: Colors.surfaceVariant,
    borderRadius: 2, marginTop: Spacing.xs,
  },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  dlAction: { padding: Spacing.xs },

  // Storage card
  storageCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.divider,
    gap: Spacing.sm,
  },
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storageTitle: { ...TextStyles.titleSmall, color: Colors.primaryText },
  storageUsed: { ...TextStyles.bodySmall, color: Colors.secondaryText },
  storageTrack: {
    height: 6, backgroundColor: Colors.surfaceVariant, borderRadius: 3,
  },
  storageFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  storageNote: { ...TextStyles.bodySmall, color: Colors.secondaryText },

  // Coming Soon
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  comingSoonBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  comingSoonIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  comingSoonTitle: {
    ...TextStyles.headlineMedium,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  comingSoonSub: {
    ...TextStyles.bodyMedium,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
