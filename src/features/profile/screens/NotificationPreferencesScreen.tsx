import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, ScreenContainer, TopBar } from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import { extractApiError } from '../../auth/services/authService';
import { InlineBanner } from '../components/InlineBanner';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/accountService';
import type { NotificationPreferences } from '../services/accountService';

type Option = {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OPTIONS: Option[] = [
  {
    key: 'orderUpdates',
    title: 'Order Updates',
    description: 'Requests, accepted or declined orders, codes, due dates',
    icon: 'receipt-outline',
  },
  {
    key: 'messages',
    title: 'Messages',
    description: 'New chat messages',
    icon: 'chatbubble-outline',
  },
  {
    key: 'reviews',
    title: 'Reviews',
    description: 'New reviews and review reminders',
    icon: 'star-outline',
  },
  {
    key: 'accountAndVerification',
    title: 'Account & Verification',
    description: 'Verification results and report updates',
    icon: 'shield-checkmark-outline',
  },
];

export default function NotificationPreferencesScreen({ navigation }: any) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getNotificationPreferences()
      .then((loaded) => {
        if (active) setPrefs(loaded);
      })
      .catch((err) => {
        if (active) setError(extractApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Saves on every toggle (the design has no Save button). The switch flips
  // right away and snaps back if the save fails.
  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setError('');
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (err) {
      setPrefs(previous);
      setError(extractApiError(err));
    }
  }

  return (
    <View style={s.root}>
      <TopBar title="Notification Preferences" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll>
        <Text style={[text.body, { color: colors.textSecondary }]}>
          Choose which updates you want to receive.
        </Text>

        {error ? <InlineBanner variant="error" message={error} /> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={s.loader} />
        ) : prefs ? (
          <Card style={s.card}>
            {OPTIONS.map((option, index) => (
              <View
                key={option.key}
                style={[s.row, index < OPTIONS.length - 1 && s.rowDivider]}
              >
                <Ionicons name={option.icon} size={22} color={colors.primary} />
                <View style={s.rowText}>
                  <Text style={text.title}>{option.title}</Text>
                  <Text style={text.caption}>{option.description}</Text>
                </View>
                <Switch
                  value={prefs[option.key]}
                  onValueChange={(value) => handleToggle(option.key, value)}
                  trackColor={{ false: colors.borderStrong, true: colors.primary }}
                  thumbColor={colors.white}
                  accessibilityLabel={`${option.title} notifications`}
                />
              </View>
            ))}
          </Card>
        ) : null}
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxxl },
  card: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1, gap: 2 },
});
