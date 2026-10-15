import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  Input,
  PasswordRequirements,
  ScreenContainer,
  isPasswordValid,
} from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import { USE_MOCK } from '../../../services/http';
import { extractApiError } from '../services/authService';
import {
  ResetLinkExpiredError,
  confirmPasswordReset,
} from '../services/passwordResetService';

// One screen, three states (CLAUDE.md rule 5):
//   form    -> "Set New Password"            (design 08)
//   expired -> "Link Expired"                (design 09)
//   success -> password updated, back to login
// Opened from the emailed link: brb://auth/reset-password?uid=...&token=...
type Mode = 'form' | 'expired' | 'success';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const uid: string | undefined = route?.params?.uid;
  const token: string | undefined = route?.params?.token;

  // A real link always carries uid + token. Without them (and without mock
  // mode) there is nothing to reset, so treat it like an expired link.
  const linkMissing = !USE_MOCK && (!uid || !token);

  const [mode, setMode] = useState<Mode>(linkMissing ? 'expired' : 'form');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newError, setNewError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (loading) return;
    setNewError('');
    setConfirmError('');
    setFormError('');

    let invalid = false;
    if (!newPassword) {
      setNewError('Please enter a new password.');
      invalid = true;
    } else if (!isPasswordValid(newPassword)) {
      setNewError('Your password does not meet all the requirements.');
      invalid = true;
    }
    if (!confirmPassword) {
      setConfirmError('Please confirm your new password.');
      invalid = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      invalid = true;
    }
    if (invalid) return;

    setLoading(true);
    try {
      await confirmPasswordReset({
        uid: uid ?? 'mock',
        token: token ?? 'mock',
        newPassword,
        confirmPassword,
      });
      setMode('success');
    } catch (err) {
      if (err instanceof ResetLinkExpiredError) {
        setMode('expired');
      } else {
        setFormError(extractApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'expired') {
    return (
      <ScreenContainer auth>
        <View style={s.center}>
          <Ionicons name="time-outline" size={64} color={colors.primary} />
          <Text style={[text.h1, s.centerText]}>Link Expired</Text>
          <Text style={[text.body, s.centerText, s.muted]}>
            This reset link has expired or was already used. Links work for 1 hour and only once.
          </Text>
          <View style={s.fullWidth}>
            <Button title="Request a New Link" onPress={() => navigation.navigate('ForgotPassword')} />
            <Button
              title="Back to Login"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (mode === 'success') {
    return (
      <ScreenContainer auth>
        <View style={s.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={[text.h1, s.centerText]}>Password Updated</Text>
          <Text style={[text.body, s.centerText, s.muted]}>
            You can now log in with your new password.
          </Text>
          <View style={s.fullWidth}>
            <Button
              title="Back to Login"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer auth scroll keyboardAware>
      <View style={s.header}>
        <Image
          source={require('../../../../assets/Logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={text.h1}>Set New Password</Text>
        <Text style={[text.body, s.muted]}>Choose a new password for your account.</Text>
      </View>

      <View style={s.fields}>
        <Input
          label="New Password"
          required
          password
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            setNewError('');
            setFormError('');
          }}
          placeholder="Enter your new password"
          autoCapitalize="none"
          autoCorrect={false}
          error={newError}
        />
        <PasswordRequirements password={newPassword} />

        <Input
          label="Confirm Password"
          required
          password
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setConfirmError('');
            setFormError('');
          }}
          placeholder="Confirm your new password"
          autoCapitalize="none"
          autoCorrect={false}
          error={confirmError}
        />

        {formError ? (
          <Text style={[text.caption, { color: colors.error }]}>{formError}</Text>
        ) : null}

        <Button title="Reset Password" onPress={handleReset} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  logo: { width: 80, height: 87 },
  muted: { color: colors.textSecondary },
  fields: { gap: spacing.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  centerText: { textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
});
