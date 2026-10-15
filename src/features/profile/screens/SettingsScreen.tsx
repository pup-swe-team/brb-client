import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  BlockedModal,
  Card,
  ConfirmModal,
  ScreenContainer,
  TopBar,
} from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import { extractApiError, logout } from '../../auth/services/authService';
import { InlineBanner } from '../components/InlineBanner';
import { DeactivationBlockedError, deactivateAccount } from '../services/accountService';

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
};

// Profile > Settings menu (design 70) plus the Deactivate Account flow:
// confirm (74) -> or the "Can't deactivate yet" message (75).
// "Revoke Lender Role" is intentionally not here: it belongs to the lender-role task.
export default function SettingsScreen({ navigation }: any) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [blockedVisible, setBlockedVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleDeactivate() {
    setConfirmVisible(false);
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await deactivateAccount();
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } catch (err) {
      if (err instanceof DeactivationBlockedError) {
        setBlockedVisible(true);
      } else {
        setError(extractApiError(err));
      }
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
    } catch {
      // The token is cleared in logout()'s finally block, so leave either way.
    }
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  const items: MenuItem[] = [
    { label: 'Edit Profile', icon: 'person-outline', route: 'EditProfile' },
    { label: 'Change Password', icon: 'lock-closed-outline', route: 'ChangePassword' },
    { label: 'Change Email', icon: 'mail-outline', route: 'ChangeEmail' },
    { label: 'Notification Preferences', icon: 'notifications-outline', route: 'NotificationPreferences' },
    {
      label: 'Deactivate Account',
      icon: 'power-outline',
      danger: true,
      onPress: () => setConfirmVisible(true),
    },
    { label: 'Terms and Conditions', icon: 'document-text-outline', route: 'Terms' },
    { label: 'Privacy Policy', icon: 'shield-outline', route: 'Privacy' },
    { label: 'Log out', icon: 'log-out-outline', danger: true, onPress: handleLogout },
  ];

  return (
    <View style={s.root}>
      <TopBar title="Settings" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll>
        {error ? <InlineBanner variant="error" message={error} /> : null}

        <Card style={s.card}>
          {items.map((item, index) => {
            const color = item.danger ? colors.error : colors.text;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                disabled={busy}
                onPress={() => (item.route ? navigation.navigate(item.route) : item.onPress?.())}
                style={[s.row, index < items.length - 1 && s.rowDivider]}
              >
                <Ionicons name={item.icon} size={20} color={color} />
                <Text style={[text.body, s.label, { color }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </Card>
      </ScreenContainer>

      <ConfirmModal
        visible={confirmVisible}
        title="Deactivate your account?"
        message="Your profile and listings will be hidden and you’ll be logged out. You can reactivate by logging in again."
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmVisible(false)}
      />

      <BlockedModal
        visible={blockedVisible}
        title="Can’t deactivate yet"
        message="You have an open order or an open Unreturned case. Finish or resolve it first, then try again."
        actionLabel="View Orders"
        onAction={() => {
          setBlockedVisible(false);
          navigation.navigate('Tabs', { screen: 'Profile' });
        }}
        onClose={() => setBlockedVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  card: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flex: 1 },
});
