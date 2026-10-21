import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';
import { Button, Checkbox, ConfirmModal, Input } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { SettingsShell } from '../components/SettingsShell';
import { DeactivationBlockedError, deactivateAccount, getDeactivationBlockers } from '../services/accountService';

export default function DeactivateAccountScreen({ navigation }: any) {
  const [blockers, setBlockers] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; check?: string; submit?: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDeactivationBlockers()
      .then(setBlockers)
      .catch((e) => {
        setBlockers([]);
        setErrors({ submit: extractApiError(e) });
      })
      .finally(() => setChecking(false));
  }, []);

  const blocked = (blockers?.length ?? 0) > 0;

  const askConfirm = () => {
    if (blocked) return setBlockedOpen(true);
    const e: typeof errors = {};
    if (!password) e.password = 'Enter your password to continue.';
    if (!understood) e.check = 'Please confirm that you understand.';
    setErrors(e);
    if (!e.password && !e.check) setConfirmOpen(true);
  };

  const run = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await deactivateAccount(password);
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } catch (err) {
      if (err instanceof DeactivationBlockedError) {
        setBlockers(err.blockers);
        setBlockedOpen(true);
      } else {
        setErrors({ submit: extractApiError(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsShell title="Deactivate Account" onBack={() => navigation.goBack()}>
      {checking ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <>
          <View style={s.warn}>
            <Ionicons name="warning-outline" size={22} color={colors.error} />
            <Text style={[text.body, { flex: 1 }]}>
              Deactivating hides your profile and listings and logs you out everywhere. You can only deactivate once you have no open orders.
            </Text>
          </View>

          {blocked ? (
            <View style={s.blockBox} accessibilityRole="alert">
              <Text style={s.blockTitle}>You can&apos;t deactivate your account yet</Text>
              {blockers!.map((b) => (
                <Text key={b} style={s.blockItem}>{'\u2022'} {b}</Text>
              ))}
              <Text style={text.caption}>Resolve these first, then come back.</Text>
            </View>
          ) : null}

          <Input label="Password" password value={password} onChangeText={setPassword} error={errors.password} editable={!blocked} />
          <Checkbox checked={understood} onChange={setUnderstood} label="I understand my account will be deactivated." error={errors.check} />
          {errors.submit ? <Text style={s.error}>{errors.submit}</Text> : null}
          <Button title="Deactivate account" variant="destructive" onPress={askConfirm} loading={loading} disabled={blocked} />
          <Button title="Keep my account" variant="secondary" onPress={() => navigation.goBack()} />
        </>
      )}

      <ConfirmModal
        visible={confirmOpen}
        title="Deactivate your account?"
        message="You will be logged out and your listings will be hidden."
        confirmLabel="Deactivate"
        destructive
        onConfirm={run}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmModal
        visible={blockedOpen}
        variant="blocked"
        title="Can't deactivate yet"
        message={(blockers ?? []).join('\n') || 'You have open orders that must be resolved first.'}
        onCancel={() => setBlockedOpen(false)}
      />
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  warn: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', backgroundColor: '#FFF5F6', borderWidth: 1, borderColor: colors.error, borderRadius: radius.card, padding: spacing.lg },
  blockBox: { gap: spacing.xs, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.error, borderRadius: radius.card, padding: spacing.lg },
  blockTitle: { color: colors.error, fontSize: 14, fontWeight: '700' },
  blockItem: { color: colors.text, fontSize: 13, lineHeight: 18 },
  error: { color: colors.error, fontSize: 12 },
});
