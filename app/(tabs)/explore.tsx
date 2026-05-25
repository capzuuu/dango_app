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

// ─── Settings data ────────────────────────────────────────────────────────────

const ACCOUNT_TILES = [
  { icon: 'person-outline', label: 'Personal Information', sub: 'Email, phone, and name' },
  { icon: 'lock-closed-outline', label: 'Password & Security', sub: 'Two-factor authentication' },
  { icon: 'card-outline', label: 'Payment Methods', sub: 'Visa •••• 4242', last: true },
];

const PREF_TILES = [
  { icon: 'download-outline', label: 'Smart Downloads', sub: 'On Wi-Fi only' },
  { icon: 'language-outline', label: 'Language', sub: 'English (US)' },
  { icon: 'notifications-outline', label: 'Notifications', sub: null, last: true },
];

const SUPPORT_TILES = [
  { icon: 'help-circle-outline', label: 'Help Center', sub: null },
  { icon: 'document-text-outline', label: 'Terms of Service', sub: null },
  { icon: 'information-circle-outline', label: 'About Dango', sub: null, last: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsTile({
  icon, label, sub, last,
}: {
  icon: string; label: string; sub?: string | null; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.tile, !last && styles.tileBorder]}
      activeOpacity={0.75}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon as any} size={20} color={Colors.onSurfaceVariant} />
      </View>
      <View style={styles.tileInfo}>
        <Text style={styles.tileLabel}>{label}</Text>
        {sub && <Text style={styles.tileSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.hint} />
    </TouchableOpacity>
  );
}

function SettingsGroup({ title, tiles }: { title: string; tiles: typeof ACCOUNT_TILES }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {tiles.map(t => (
          <SettingsTile key={t.label} {...t} />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile header ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarStack}>
            <View style={styles.avatarBg}>
              <Text style={styles.avatarEmoji}>🧑‍💻</Text>
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Rivers</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>PREMIUM PLAN</Text>
            </View>
          </View>
        </View>

        {/* ── Subscription card ── */}
        <View style={styles.subCard}>
          <View style={styles.subIcon}>
            <Ionicons name="star" size={24} color={Colors.primary} />
          </View>
          <View style={styles.subInfo}>
            <Text style={styles.subLabel}>Subscription Status</Text>
            <Text style={styles.subValue}>Next billing: Nov 12, 2026</Text>
          </View>
          <TouchableOpacity style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* ── Settings groups ── */}
        <SettingsGroup title="Account" tiles={ACCOUNT_TILES} />
        <SettingsGroup title="Preferences" tiles={PREF_TILES} />
        <SettingsGroup title="Support" tiles={SUPPORT_TILES} />

        {/* ── Sign out ── */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.versionText}>Dango v2.4.0 · © 2026</Text>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },

  // Profile header
  profileHeader: {
    alignItems: 'center', gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  avatarStack: { position: 'relative' },
  avatarBg: {
    width: 88, height: 88, borderRadius: Radii.xl,
    backgroundColor: '#1a3a5c',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarEmoji: { fontSize: 40 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  profileInfo: { alignItems: 'center', gap: Spacing.xs },
  profileName: { ...TextStyles.titleLarge, color: Colors.primaryText },
  planBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radii.full,
  },
  planText: { ...TextStyles.labelSmall, color: Colors.primary, letterSpacing: 0.5 },

  // Subscription card
  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(229,9,20,0.25)',
  },
  subIcon: {
    width: 48, height: 48, borderRadius: Radii.md,
    backgroundColor: 'rgba(229,9,20,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  subInfo: { flex: 1 },
  subLabel: { ...TextStyles.bodySmall, color: Colors.secondaryText },
  subValue: { ...TextStyles.bodyMedium, color: Colors.primaryText, fontWeight: '600' },
  manageBtn: {
    borderWidth: 1, borderColor: Colors.outline,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
  },
  manageBtnText: { ...TextStyles.labelMedium, color: Colors.primaryText },

  // Settings group
  group: { gap: Spacing.sm },
  groupTitle: { ...TextStyles.labelLarge, color: Colors.secondaryText, letterSpacing: 0.5 },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.divider,
  },
  tile: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  tileBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tileIcon: {
    width: 36, height: 36, borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  tileInfo: { flex: 1 },
  tileLabel: { ...TextStyles.bodyMedium, color: Colors.primaryText },
  tileSub: { ...TextStyles.bodySmall, color: Colors.secondaryText, marginTop: 2 },

  // Sign out
  signOutSection: {},
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.error,
    borderRadius: Radii.sm, paddingVertical: Spacing.sm + 4,
  },
  signOutText: { ...TextStyles.labelLarge, color: Colors.error },

  // Footer
  versionText: {
    ...TextStyles.labelSmall, color: Colors.hint,
    textAlign: 'center',
  },
});
