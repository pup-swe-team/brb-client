import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, ScreenContainer } from '../../../shared/components';
import { colors, spacing } from '../../../theme';
import { confirmPasswordReset, extractApiError } from '../services/authService';
import { http } from '../../../services/http';

type Errors = { password?: string; confirm?: string; submit?: string };

function passwordProblem(p: string): string | undefined {
  if (p.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Z]/.test(p)) return 'Add an uppercase letter.';
  if (!/[a-z]/.test(p)) return 'Add a lowercase letter.';
  if (!/[^A-Za-z0-9]/.test(p)) return 'Add a special character.';
  return undefined;
}

// Opened from the emailed link: brb://auth/reset-password?uid=...&token=...
export default function NewPasswordScreen({ navigation, route }: any) {
  const uid: string | undefined = route?.params?.uid;
  const token: string | undefined = route?.params?.token;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validating, setValidating] = useState(true);
  const [linkValid, setLinkValid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!uid || !token) {
        if (!cancelled) {
          setValidating(false);
          setLinkValid(false);
        }
        return;
      }
      try {
        await http.post('/auth/password-reset/validate/', { uid, token });
        if (!cancelled) {
          setLinkValid(true);
        }
      } catch {
        if (!cancelled) {
          setLinkValid(false);
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    };
    validate();
    return () => {
      cancelled = true;
    };
  }, [uid, token]);

  const submit = async () => {
    if (!uid || !token || loading) return;
    const e: Errors = {};
    const problem = passwordProblem(password);
    if (problem) e.password = problem;
    if (confirm !== password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    if (e.password || e.confirm) return;
    setLoading(true);
    try {
      await confirmPasswordReset(uid, token, password, confirm);
      setDone(true);
    } catch (err) {
      setErrors({ submit: extractApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const invalid = validating ? false : !linkValid;

  return (
    <ScreenContainer auth scroll keyboardAware>
      <View style={s.container}>
        <Pressable onPress={() => navigation.navigate('Login')} style={s.back} accessibilityRole="button" accessibilityLabel="Back to login">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </Pressable>

        {done ? (
          <View style={s.center}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={s.title}>Password updated</Text>
            <Text style={s.desc}>You can now log in with your new password.</Text>
            <Button title="Back to Login" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} />
          </View>
        ) : validating ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.desc}>Checking reset link...</Text>
          </View>
        ) : invalid ? (
          <View style={s.center}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={s.title}>Reset link is invalid</Text>
            <Text style={s.desc}>This link is invalid, has expired, or has already been used. Request a new one.</Text>
            <Button title="Request a new link" onPress={() => navigation.navigate('ForgotPassword')} />
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <Text style={s.title}>Create a new password</Text>
            <Text style={s.desc}>Use at least 8 characters with uppercase, lowercase and a special character.</Text>
            <Input label="New password" required password value={password} onChangeText={setPassword} error={errors.password} />
            <Input label="Confirm new password" required password value={confirm} onChangeText={setConfirm} error={errors.confirm} />
            {errors.submit ? <Text style={s.error}>{errors.submit}</Text> : null}
            <Button title="Reset password" onPress={submit} loading={loading} />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 40, gap: spacing.xl },
  back: { width: 38, height: 38, borderWidth: 1, borderColor: colors.textSecondary, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl },
  title: { color: colors.textSecondary, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  error: { color: colors.error, fontSize: 12 },
});
