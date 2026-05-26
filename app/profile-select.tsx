import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { PROFILES, Profile, useProfile } from '@/context/profile-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PIN = '1234'; // demo PIN for locked profiles

function ProfileAvatar({
  profile,
  isActive,
  onPress,
}: {
  profile: Profile;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.avatarWrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatarBox, { backgroundColor: profile.color }, isActive && styles.avatarSelected]}>
        <Text style={styles.avatarEmoji}>{profile.emoji}</Text>
        {profile.locked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color={Colors.primaryText} />
          </View>
        )}
      </View>
      <Text style={[styles.avatarName, isActive && styles.avatarNameSelected]}>{profile.name}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileSelectScreen() {
  const router = useRouter();
  const { activeProfile, setActiveProfile } = useProfile();
  const [pinVisible, setPinVisible] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  function handleSelect(profile: Profile) {
    if (profile.locked) {
      setPendingProfile(profile);
      setPinInput('');
      setPinError(false);
      setPinVisible(true);
    } else {
      setActiveProfile(profile);
      router.replace('/(tabs)');
    }
  }

  function handlePinSubmit() {
    if (pinInput === PIN) {
      setActiveProfile(pendingProfile!);
      setPinVisible(false);
      router.replace('/(tabs)');
    } else {
      setPinError(true);
      setPinInput('');
    }
  }

  function handleManageProfiles() {
    Alert.alert('Manage Profiles', 'Profile management coming soon.');
  }

  function handleEditSettings() {
    Alert.alert('Edit Settings', 'Settings coming soon.');
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(229,9,20,0.08)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.topRight} edges={['top']}>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>DANGO</Text>
          <Text style={styles.tagline}>Your Asian Entertainment Hub</Text>
        </View>

        <View style={{ height: Spacing.xl }} />

        <View style={styles.profileSection}>
          <Text style={styles.whoTitle}>Who's Watching?</Text>
          <View style={styles.profileGrid}>
            {PROFILES.map(p => (
              <ProfileAvatar
                key={p.id}
                profile={p}
                isActive={activeProfile.id === p.id}
                onPress={() => handleSelect(p)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.lg }} />

        <View style={styles.btnGroup}>
          <TouchableOpacity style={styles.outlineBtn} onPress={handleManageProfiles}>
            <Text style={styles.outlineBtnText}>Manage Profiles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleEditSettings}>
            <Ionicons name="create-outline" size={16} color={Colors.secondaryText} />
            <Text style={styles.ghostBtnText}>Edit Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <Text style={styles.version}>Version 2.4.0</Text>
        <View style={styles.langRow}>
          <Ionicons name="globe-outline" size={12} color={Colors.hint} />
          <Text style={styles.langText}>English (US)</Text>
        </View>
      </SafeAreaView>

      {/* PIN Modal */}
      <Modal visible={pinVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter PIN</Text>
            <Text style={styles.modalSub}>This profile is locked</Text>
            <TextInput
              style={[styles.pinInput, pinError && styles.pinInputError]}
              value={pinInput}
              onChangeText={t => { setPinInput(t); setPinError(false); }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor={Colors.hint}
              autoFocus
            />
            {pinError && <Text style={styles.pinErrorText}>Incorrect PIN. Try again.</Text>}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPinVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handlePinSubmit}>
                <Text style={styles.modalConfirmText}>Unlock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topRight: { position: 'absolute', top: 0, right: 0, zIndex: 10, padding: Spacing.lg },
  helpBtn: { padding: Spacing.xs },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  logoSection: { alignItems: 'center', gap: Spacing.xs },
  logo: { color: Colors.primary, fontSize: 48, fontWeight: '900', letterSpacing: 4 },
  tagline: { ...TextStyles.labelMedium, color: Colors.secondaryText, letterSpacing: 0.5 },
  profileSection: { alignItems: 'center', gap: Spacing.lg },
  whoTitle: { ...TextStyles.titleLarge, color: Colors.primaryText },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.lg, maxWidth: width * 0.85 },
  avatarWrap: { alignItems: 'center', gap: Spacing.sm },
  avatarBox: { width: 88, height: 88, borderRadius: Radii.lg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarSelected: { borderWidth: 3, borderColor: Colors.primaryText },
  avatarEmoji: { fontSize: 40 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  avatarName: { ...TextStyles.labelMedium, color: Colors.secondaryText },
  avatarNameSelected: { color: Colors.primaryText },
  btnGroup: { width: 240, gap: Spacing.md },
  outlineBtn: { borderWidth: 1, borderColor: Colors.primaryText, borderRadius: Radii.sm, paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  outlineBtnText: { ...TextStyles.labelLarge, color: Colors.primaryText },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm + 2 },
  ghostBtnText: { ...TextStyles.labelLarge, color: Colors.secondaryText },
  footer: { alignItems: 'center', paddingBottom: Spacing.lg, gap: Spacing.xs },
  version: { ...TextStyles.labelSmall, color: Colors.hint },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  langText: { ...TextStyles.labelSmall, color: Colors.hint },
  // PIN modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#1a1a1a', borderRadius: Radii.lg, padding: Spacing.xl, width: 300, alignItems: 'center', gap: Spacing.md },
  modalTitle: { ...TextStyles.titleMedium, color: Colors.primaryText },
  modalSub: { ...TextStyles.bodySmall, color: Colors.secondaryText },
  pinInput: { width: '100%', borderWidth: 1, borderColor: Colors.surfaceVariant, borderRadius: Radii.sm, padding: Spacing.md, color: Colors.primaryText, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  pinInputError: { borderColor: Colors.primary },
  pinErrorText: { ...TextStyles.labelSmall, color: Colors.primary },
  modalBtns: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: Colors.surfaceVariant, borderRadius: Radii.sm, paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  modalCancelText: { ...TextStyles.labelLarge, color: Colors.secondaryText },
  modalConfirm: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radii.sm, paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  modalConfirmText: { ...TextStyles.labelLarge, color: Colors.primaryText },
});
