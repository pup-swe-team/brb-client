import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../../../theme';
import { ConfirmModal } from '../../../shared/components';
import { logout } from '../../auth/services/authService';
import { SettingsShell } from '../components/SettingsShell';
import { RevokeLenderModals } from '../components/RevokeLenderModals';
import {
  getLenderRoleStatus,
  RevokeBlockedError,
  revokeLenderRole,
} from '../services/lenderRoleService';

type Row = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string; danger?: boolean };
const ROWS: Row[] = [
  { label: 'Edit profile', icon: 'person-outline', route: 'EditProfile' },
  { label: 'Change password', icon: 'lock-closed-outline', route: 'ChangePassword' },
  { label: 'Change email', icon: 'mail-outline', route: 'ChangeEmail' },
  { label: 'Notification preferences', icon: 'notifications-outline', route: 'NotificationPreferences' },
  // CP-205: the "Revoke Lender role" row sits here (HTML 70), shown only to Lenders. See below.
  { label: 'Deactivate account', icon: 'trash-outline', route: 'DeactivateAccount', danger: true },
];

export default function AccountSettingsScreen({ navigation }: any) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // CP-205 Revoke Lender status. isLender null = unknown, so the row stays hidden.
  const [isLender, setIsLender] = useState<boolean | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');
  const [revokeMessage, setRevokeMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLenderRoleStatus()
        .then(({ isLender: lender }) => {
          if (active) setIsLender(lender);
        })
        .catch(() => {
          if (active) setIsLender(null);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const handleRevoke = async () => {
    if (revoking) return;
    setRevoking(true);
    setRevokeError('');
    try {
      await revokeLenderRole();
      setRevokeOpen(false);
      setIsLender(false);
      setRevokeMessage('Your Lender status was revoked. You can still borrow, and you can reapply anytime.');
    } catch (error) {
      if (error instanceof RevokeBlockedError) {
        setRevokeOpen(false);
        setBlockedOpen(true);
      } else {
        setRevokeError('We couldn’t revoke your Lender status. Please try again.');
      }
    } finally {
      setRevoking(false);
    }
  };

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
        {revokeMessage ? (
          <View style={s.notice} accessibilityRole="alert">
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={s.noticeText}>{revokeMessage}</Text>
          </View>
        ) : null}

        {ROWS.map((r) => (
          <React.Fragment key={r.route}>
            {r.route === 'DeactivateAccount' && isLender === true ? (
              <Pressable
                style={s.row}
                onPress={() => {
                  setRevokeError('');
                  setRevokeOpen(true);
                }}
                accessibilityRole="button"
              >
                <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
                <Text style={s.label}>Revoke Lender role</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
            <Pressable style={s.row} onPress={() => navigation.navigate(r.route)} accessibilityRole="button">
              <Ionicons name={r.icon} size={20} color={r.danger ? colors.error : colors.primary} />
              <Text style={[s.label, r.danger && { color: colors.error }]}>{r.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </React.Fragment>
        ))}

        <Pressable style={[s.row, s.logout]} onPress={() => setConfirmOpen(true)} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={colors.primary} />
          <Text style={s.label}>Log out</Text>
        </Pressable>
      </View>

      <RevokeLenderModals
        confirmVisible={revokeOpen}
        blockedVisible={blockedOpen}
        loading={revoking}
        error={revokeError}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeOpen(false)}
        onCloseBlocked={() => setBlockedOpen(false)}
        onViewLends={() => {
          setBlockedOpen(false);
          navigation.navigate('Tabs', { screen: 'Profile', params: { initialRole: 'Lender' } });
        }}
      />

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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  noticeText: { flex: 1, color: colors.text, fontSize: 13 },
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
});