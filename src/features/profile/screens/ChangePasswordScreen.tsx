import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, text } from '../../../theme';
import { Button, Input } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { SettingsShell } from '../components/SettingsShell';
import { changePassword } from '../services/accountService';

type Errors = { current?: string; next?: string; confirm?: string; submit?: string };

function passwordProblem(p: string): string | undefined {
  if (p.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Z]/.test(p)) return 'Add an uppercase letter.';
  if (!/[a-z]/.test(p)) return 'Add a lowercase letter.';
  if (!/[^A-Za-z0-9]/.test(p)) return 'Add a special character.';
  return undefined;
}

export default function ChangePasswordScreen({ navigation }: any) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const e: Errors = {};
    if (!current) e.current = 'Enter your current password.';
    const problem = passwordProblem(next);
    if (problem) e.next = problem;
    else if (next === current) e.next = 'Choose a password different from your current one.';
    if (confirm !== next) e.confirm = 'Passwords do not match.';
    setErrors(e);
    if (e.current || e.next || e.confirm) return;
    setLoading(true);
    try {
      await changePassword(current, next, confirm);
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setErrors({ submit: extractApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsShell title="Change Password" onBack={() => navigation.goBack()}>
      <Text style={[text.body, { color: colors.textSecondary }]}>
        Use at least 8 characters with uppercase, lowercase and a special character.
      </Text>
      <Input label="Current password" required password value={current} onChangeText={(v) => { setCurrent(v); setDone(false); }} error={errors.current} />
      <Input label="New password" required password value={next} onChangeText={(v) => { setNext(v); setDone(false); }} error={errors.next} />
      <Input label="Confirm new password" required password value={confirm} onChangeText={(v) => { setConfirm(v); setDone(false); }} error={errors.confirm} />
      {errors.submit ? <Text style={s.error}>{errors.submit}</Text> : null}
      {done ? <Text style={s.success}>Password updated.</Text> : null}
      <Button title="Update password" onPress={submit} loading={loading} />
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  error: { color: colors.error, fontSize: 12 },
  success: { color: colors.success, fontSize: 13, fontWeight: '600' },
});
