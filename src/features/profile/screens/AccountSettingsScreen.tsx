import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { ConfirmModal } from '../../../shared/components';
import { logout } from '../../auth/services/authService';
import { SettingsShell } from '../components/SettingsShell';

type Row = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string; danger?: boolean };
const ROWS: Row[] = [
  { label: 'Edit profile', icon: 'person-outline', route: 'EditProfile' },
  { label: 'Change password', icon: 'lock-closed-outline', route: 'ChangePassword' },
  { label: 'Change email', icon: 'mail-outline', route: 'ChangeEmail' },
  { label: 'Notification preferences', icon: 'notifications-outline', route: 'NotificationPreferences' },
  { label: 'Deactivate account', icon: 'trash-outline', route: 'DeactivateAccount', danger: true },
];

export default function AccountSettingsScreen({ navigation }: any) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // The local tokens are cleared even if the server call fails.
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
      // Reset the stack so Back can't return to the app after logging out.
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  return (
    <SettingsShell title="Settings" onBack={() => navigation.goBack()}>
      <View style={s.list}>
        {ROWS.map((r) => (
          <Pressable key={r.route} style={s.row} onPress={() => navigation.navigate(r.route)} accessibilityRole="button">
            <Ionicons name={r.icon} size={20} color={r.danger ? colors.error : colors.primary} />
            <Text style={[s.label, r.danger && { color: colors.error }]}>{r.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}

        <Pressable style={[s.row, s.logout]} onPress={() => setConfirmOpen(true)} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={colors.primary} />
          <Text style={s.label}>Log out</Text>
        </Pressable>
      </View>

      <ConfirmModal
        visible={confirmOpen}
        title="Log out?"
        message="You will need to log in again to keep borrowing and lending."
        confirmLabel={loggingOut ? 'Logging out…' : 'Log out'}
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  logout: { marginTop: spacing.lg },
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
});