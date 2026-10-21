import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
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
      </View>
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
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
});
