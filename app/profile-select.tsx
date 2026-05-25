import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Dimensions,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PROFILES = [
  { id: '1', name: 'Min-ho', emoji: '🧑‍💻', color: '#1a3a5c', selected: true, locked: false },
  { id: '2', name: 'Ji-soo', emoji: '👩‍🎨', color: '#5c1a3a', selected: false, locked: false },
  { id: '3', name: 'Kids', emoji: '🧸', color: '#3a5c1a', selected: false, locked: false },
  { id: '4', name: 'Guest', emoji: '👤', color: '#2f2f2f', selected: false, locked: true },
];

function ProfileAvatar({
  profile,
  onPress,
}: {
  profile: (typeof PROFILES)[0];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.avatarWrap} onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.avatarBox,
          { backgroundColor: profile.color },
          profile.selected && styles.avatarSelected,
        ]}>
        <Text style={styles.avatarEmoji}>{profile.emoji}</Text>
        {profile.locked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color={Colors.primaryText} />
          </View>
        )}
      </View>
      <Text style={[styles.avatarName, profile.selected && styles.avatarNameSelected]}>
        {profile.name}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(229,9,20,0.08)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Help button top-right */}
      <SafeAreaView style={styles.topRight} edges={['top']}>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>DANGO</Text>
          <Text style={styles.tagline}>Your Asian Entertainment Hub</Text>
        </View>

        <View style={{ height: Spacing.xl }} />

        {/* Who's watching */}
        <View style={styles.profileSection}>
          <Text style={styles.whoTitle}>Who's Watching?</Text>
          <View style={styles.profileGrid}>
            {PROFILES.map(p => (
              <ProfileAvatar
                key={p.id}
                profile={p}
                onPress={() => router.replace('/(tabs)')}
              />
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.lg }} />

        {/* Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Manage Profiles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn}>
            <Ionicons name="create-outline" size={16} color={Colors.secondaryText} />
            <Text style={styles.ghostBtnText}>Edit Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <Text style={styles.version}>Version 2.4.0</Text>
        <View style={styles.langRow}>
          <Ionicons name="globe-outline" size={12} color={Colors.hint} />
          <Text style={styles.langText}>English (US)</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topRight: {
    position: 'absolute', top: 0, right: 0, zIndex: 10,
    padding: Spacing.lg,
  },
  helpBtn: { padding: Spacing.xs },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoSection: { alignItems: 'center', gap: Spacing.xs },
  logo: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 4,
  },
  tagline: {
    ...TextStyles.labelMedium,
    color: Colors.secondaryText,
    letterSpacing: 0.5,
  },
  profileSection: { alignItems: 'center', gap: Spacing.lg },
  whoTitle: {
    ...TextStyles.titleLarge,
    color: Colors.primaryText,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    maxWidth: width * 0.85,
  },
  avatarWrap: { alignItems: 'center', gap: Spacing.sm },
  avatarBox: {
    width: 88,
    height: 88,
    borderRadius: Radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: Colors.primaryText,
  },
  avatarEmoji: { fontSize: 40 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarName: {
    ...TextStyles.labelMedium,
    color: Colors.secondaryText,
  },
  avatarNameSelected: { color: Colors.primaryText },
  btnGroup: { width: 240, gap: Spacing.md },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.primaryText,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  outlineBtnText: {
    ...TextStyles.labelLarge,
    color: Colors.primaryText,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
  },
  ghostBtnText: {
    ...TextStyles.labelLarge,
    color: Colors.secondaryText,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  version: { ...TextStyles.labelSmall, color: Colors.hint },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  langText: { ...TextStyles.labelSmall, color: Colors.hint },
});
