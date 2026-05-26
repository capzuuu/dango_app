import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { ListItem, useMyList } from '@/context/my-list-context';
import { useProfile } from '@/context/profile-context';
import { posterUrl } from '@/lib/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── My List mini card ───────────────────────────────────────────────────────

function MiniPosterCard({ item, onPress }: { item: ListItem; onPress: () => void }) {
  const uri = posterUrl(item.posterPath, 'w185');
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.miniCard}>
      <View style={styles.miniPoster}>
        {uri
          ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}><Ionicons name="film-outline" size={20} color={Colors.hint} /></View>
        }
      </View>
      <Text style={styles.miniTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );
}

// ─── Settings data ────────────────────────────────────────────────────────────

const ACCOUNT_TILES = [
  { icon: 'person-outline',       label: 'Personal Information', sub: 'Email, phone, and name' },
  { icon: 'lock-closed-outline',  label: 'Password & Security',  sub: 'Two-factor authentication' },
  { icon: 'card-outline',         label: 'Payment Methods',      sub: 'Visa •••• 4242', last: true },
];

const SUPPORT_TILES = [
  { icon: 'help-circle-outline',         label: 'Help Center',     sub: null },
  { icon: 'document-text-outline',       label: 'Terms of Service', sub: null },
  { icon: 'information-circle-outline',  label: 'About Dango',     sub: null, last: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsTile({ icon, label, sub, last, onPress }: {
  icon: string; label: string; sub?: string | null; last?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tile, !last && styles.tileBorder]}
      activeOpacity={0.75}
      onPress={onPress ?? (() => Alert.alert(label, 'Coming soon.'))}>
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

function ToggleTile({ icon, label, value, onToggle, last }: {
  icon: string; label: string; value: boolean; onToggle: () => void; last?: boolean;
}) {
  return (
    <View style={[styles.tile, !last && styles.tileBorder]}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon as any} size={20} color={Colors.onSurfaceVariant} />
      </View>
      <View style={styles.tileInfo}>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.surfaceVariant, true: Colors.primary }}
        thumbColor={Colors.primaryText}
      />
    </View>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { activeProfile } = useProfile();

  const { items: myListItems } = useMyList();
  const [notifications, setNotifications] = React.useState(true);
  const [smartDownloads, setSmartDownloads] = React.useState(true);

  function handleSwitchProfile() {
    router.push('/profile-select');
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => router.replace('/profile-select'),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile header ── */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarStack} onPress={handleSwitchProfile} activeOpacity={0.8}>
            <View style={[styles.avatarBg, { backgroundColor: activeProfile.color }]}>
              <Text style={styles.avatarEmoji}>{activeProfile.emoji}</Text>
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{activeProfile.name}</Text>
            <TouchableOpacity onPress={handleSwitchProfile}>
              <View style={styles.switchBadge}>
                <Ionicons name="swap-horizontal" size={12} color={Colors.primary} />
                <Text style={styles.switchText}>Switch Profile</Text>
              </View>
            </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => Alert.alert('Manage Subscription', 'Coming soon.')}>
            <Text style={styles.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* ── My List ── */}
        <View style={styles.myListSection}>
          <View style={styles.myListHeader}>
            <Text style={styles.groupTitle}>MY LIST</Text>
            {myListItems.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/my-list')}>
                <Text style={styles.seeAllText}>See All ({myListItems.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          {myListItems.length === 0 ? (
            <View style={styles.myListEmpty}>
              <Ionicons name="bookmark-outline" size={32} color={Colors.hint} />
              <Text style={styles.myListEmptyText}>No saved titles yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.myListRow}>
              {myListItems.slice(0, 10).map(item => (
                <MiniPosterCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push({ pathname: '/details', params: { id: String(item.id), type: item.type } })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Account ── */}
        <SettingsGroup title="Account">
          {ACCOUNT_TILES.map(t => <SettingsTile key={t.label} {...t} />)}
        </SettingsGroup>

        {/* ── Preferences ── */}
        <SettingsGroup title="Preferences">
          <ToggleTile
            icon="download-outline"
            label="Smart Downloads"
            value={smartDownloads}
            onToggle={() => setSmartDownloads(v => !v)}
          />
          <ToggleTile
            icon="notifications-outline"
            label="Notifications"
            value={notifications}
            onToggle={() => setNotifications(v => !v)}
            last
          />
        </SettingsGroup>

        {/* ── Support ── */}
        <SettingsGroup title="Support">
          {SUPPORT_TILES.map(t => <SettingsTile key={t.label} {...t} />)}
        </SettingsGroup>

        {/* ── Sign out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Dango v2.4.0 · © 2026</Text>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// needed for hooks inside functional component
import React from 'react';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  myListSection: { gap: Spacing.sm },
  myListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  myListRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  seeAllText: { ...TextStyles.labelMedium, color: Colors.primary },
  miniCard: { width: 80, alignItems: 'center', gap: Spacing.xs },
  miniPoster: { width: 80, height: 112, borderRadius: Radii.sm, overflow: 'hidden', backgroundColor: Colors.surfaceVariant },
  myListEmpty: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  myListEmptyText: { ...TextStyles.bodySmall, color: Colors.hint },
  miniTitle: { ...TextStyles.labelSmall, color: Colors.secondaryText, textAlign: 'center' },
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },

  profileHeader: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
  avatarStack: { position: 'relative' },
  avatarBg: { width: 88, height: 88, borderRadius: Radii.xl, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
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
  switchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radii.full,
  },
  switchText: { ...TextStyles.labelSmall, color: Colors.primary, letterSpacing: 0.5 },

  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(229,9,20,0.25)',
  },
  subIcon: { width: 48, height: 48, borderRadius: Radii.md, backgroundColor: 'rgba(229,9,20,0.1)', justifyContent: 'center', alignItems: 'center' },
  subInfo: { flex: 1 },
  subLabel: { ...TextStyles.bodySmall, color: Colors.secondaryText },
  subValue: { ...TextStyles.bodyMedium, color: Colors.primaryText, fontWeight: '600' },
  manageBtn: { borderWidth: 1, borderColor: Colors.outline, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  manageBtnText: { ...TextStyles.labelMedium, color: Colors.primaryText },

  group: { gap: Spacing.sm },
  groupTitle: { ...TextStyles.labelLarge, color: Colors.secondaryText, letterSpacing: 0.5 },
  groupCard: { backgroundColor: Colors.surface, borderRadius: Radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.divider },
  tile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  tileBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tileIcon: { width: 36, height: 36, borderRadius: Radii.sm, backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  tileInfo: { flex: 1 },
  tileLabel: { ...TextStyles.bodyMedium, color: Colors.primaryText },
  tileSub: { ...TextStyles.bodySmall, color: Colors.secondaryText, marginTop: 2 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.error,
    borderRadius: Radii.sm, paddingVertical: Spacing.sm + 4,
  },
  signOutText: { ...TextStyles.labelLarge, color: Colors.error },
  versionText: { ...TextStyles.labelSmall, color: Colors.hint, textAlign: 'center' },
});
