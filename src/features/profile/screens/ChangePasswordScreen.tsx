import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import {
  Button,
  Input,
  PasswordRequirements,
  ScreenContainer,
  TopBar,
  isPasswordValid,
} from '../../../shared/components';
import { colors, spacing } from '../../../theme';
import { extractApiError, getApiErrorCode } from '../../auth/services/authService';
import { InlineBanner } from '../components/InlineBanner';
import type { BannerVariant } from '../components/InlineBanner';
import { WRONG_CURRENT_PASSWORD_CODE, changePassword } from '../services/accountService';

type Errors = { current?: string; next?: string; confirm?: string };

export default function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<{ variant: BannerVariant; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  async function handleUpdate() {
    if (loading) return;
    setBanner(null);

    const next: Errors = {};
    if (!currentPassword) next.current = 'Please enter your current password.';
    if (!newPassword) {
      next.next = 'Please enter a new password.';
    } else if (!isPasswordValid(newPassword)) {
      next.next = 'Your password does not meet all the requirements.';
    } else if (newPassword === currentPassword) {
      next.next = 'Your new password must be different from your current one.';
    }
    if (!confirmPassword) {
      next.confirm = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      next.confirm = 'Passwords do not match.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setBanner({ variant: 'success', message: 'Your password has been updated.' });
      leaveTimer.current = setTimeout(() => navigation.goBack(), 1200);
    } catch (err) {
      if (getApiErrorCode(err) === WRONG_CURRENT_PASSWORD_CODE) {
        setErrors({ current: 'Your current password is incorrect.' });
      } else {
        setBanner({ variant: 'error', message: extractApiError(err) });
      }
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <TopBar title="Change Password" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll keyboardAware>
        {banner ? <InlineBanner variant={banner.variant} message={banner.message} /> : null}

        <Input
          label="Current Password"
          required
          password
          value={currentPassword}
          onChangeText={(value) => {
            setCurrentPassword(value);
            setErrors((e) => ({ ...e, current: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.current}
        />

        <View style={s.group}>
          <Input
            label="New Password"
            required
            password
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              setErrors((e) => ({ ...e, next: undefined }));
            }}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.next}
          />
          <PasswordRequirements password={newPassword} />
        </View>

        <Input
          label="Confirm New Password"
          required
          password
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.confirm}
        />

        <Button title="Update Password" onPress={handleUpdate} loading={loading} />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  group: { gap: spacing.sm },
});
