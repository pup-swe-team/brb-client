// OWNER: Lance | CP-802
// Configure notification preferences, grouped by: Order Updates, Messages, Reviews, Account & Verification.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '../../../theme';
import { Button } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { SettingsShell } from '../components/SettingsShell';
import {
  NOTIFICATION_GROUPS,
  NotificationGroup,
  NotificationPrefs,
  getNotificationPrefs,
  saveNotificationPrefs,
} from '../services/accountService';

type Channel = keyof NotificationPrefs[string];
type Category = NotificationGroup['categories'][number];
type ToggleHandler = (categoryKey: string, channel: Channel, value: boolean) => void;

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'push', label: 'Push notification' },
  { key: 'email', label: 'Email' },
];

function CategoryCard({ category, prefs, onToggle }: { category: Category; prefs: NotificationPrefs; onToggle: ToggleHandler }) {
  return (
    <View style={s.card}>
      <Text style={text.title}>{category.label}</Text>
      <Text style={text.caption}>{category.description}</Text>
      {CHANNELS.map(({ key, label }) => (
        <View key={key} style={s.row}>
          <Text style={text.body}>{label}</Text>
          <Switch
            value={category.locked ? true : prefs[category.key]?.[key] ?? false}
            disabled={category.locked}
            onValueChange={(value) => onToggle(category.key, key, value)}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
            accessibilityLabel={`${category.label} ${label}`}
          />
        </View>
      ))}
      {category.locked ? <Text style={text.caption}>Always on for your security.</Text> : null}
    </View>
  );
}

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

  const toggle: ToggleHandler = (categoryKey, channel, value) => {
    setPrefs((current) =>
      current ? { ...current, [categoryKey]: { ...current[categoryKey], [channel]: value } } : current,
    );
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

  let content: React.ReactNode;

  if (loading) {
    content = <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />;
  } else if (!prefs) {
    content = <Text style={s.error}>{error || 'Could not load your preferences.'}</Text>;
  } else {
    content = (
      <>
        <Text style={[text.body, { color: colors.textSecondary }]}>
          Choose how you want to be notified for each type of activity.
        </Text>
        {NOTIFICATION_GROUPS.map((group) => (
          <View key={group.title} style={s.group}>
            <Text style={text.h2}>{group.title}</Text>
            {group.categories.map((category) => (
              <CategoryCard key={category.key} category={category} prefs={prefs} onToggle={toggle} />
            ))}
          </View>
        ))}
        {error ? <Text style={s.error}>{error}</Text> : null}
        {saved ? <Text style={s.success}>Preferences saved.</Text> : null}
        <Button title="Save preferences" onPress={save} loading={saving} disabled={!dirty} />
      </>
    );
  }

  return (
    <SettingsShell title="Notifications" onBack={() => navigation.goBack()}>
      {content}
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  group: { gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  error: { color: colors.error, fontSize: 12 },
  success: { color: colors.success, fontSize: 13, fontWeight: '600' },
});