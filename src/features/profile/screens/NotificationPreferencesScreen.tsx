import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '../../../theme';
import { Button } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { SettingsShell } from '../components/SettingsShell';
import { NOTIFICATION_CATEGORIES, NotificationPrefs, getNotificationPrefs, saveNotificationPrefs } from '../services/accountService';

export default function NotificationPreferencesScreen({ navigation }: any) {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getNotificationPrefs()
      .then(setPrefs)
      .catch((e) => setError(extractApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string, channel: 'push' | 'email', value: boolean) => {
    setPrefs((p) => (p ? { ...p, [key]: { ...p[key], [channel]: value } } : p));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setError('');
    try {
      await saveNotificationPrefs(prefs);
      setDirty(false);
      setSaved(true);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsShell title="Notifications" onBack={() => navigation.goBack()}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : prefs ? (
        <>
          <Text style={[text.body, { color: colors.textSecondary }]}>Choose how you want to be notified for each type of activity.</Text>
          {NOTIFICATION_CATEGORIES.map((c) => (
            <View key={c.key} style={s.card}>
              <Text style={text.title}>{c.label}</Text>
              <Text style={text.caption}>{c.description}</Text>
              {(['push', 'email'] as const).map((ch) => (
                <View key={ch} style={s.row}>
                  <Text style={text.body}>{ch === 'push' ? 'Push notification' : 'Email'}</Text>
                  <Switch
                    value={c.locked ? true : prefs[c.key]?.[ch] ?? false}
                    disabled={c.locked}
                    onValueChange={(v) => toggle(c.key, ch, v)}
                    trackColor={{ true: colors.primary, false: colors.borderStrong }}
                    accessibilityLabel={`${c.label} ${ch}`}
                  />
                </View>
              ))}
              {c.locked ? <Text style={text.caption}>Always on for your security.</Text> : null}
            </View>
          ))}
          {error ? <Text style={s.error}>{error}</Text> : null}
          {saved ? <Text style={s.success}>Preferences saved.</Text> : null}
          <Button title="Save preferences" onPress={save} loading={saving} disabled={!dirty} />
        </>
      ) : (
        <Text style={s.error}>{error || 'Could not load your preferences.'}</Text>
      )}
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  error: { color: colors.error, fontSize: 12 },
  success: { color: colors.success, fontSize: 13, fontWeight: '600' },
});
