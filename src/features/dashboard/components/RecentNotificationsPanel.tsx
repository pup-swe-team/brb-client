import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../../../theme';
import {
  AppNotification,
  getNotifications,
  markAsRead,
} from '../../notifications/services/notificationsService';

const PANEL_LIMIT = 3;

// CP-202. Recent-notifications panel on the dashboard. Shows the latest few notifications with an
// unread marker and "See all", which opens the Notifications screen (CP-801, Lance).
// Data comes only from notificationsService (getNotifications, markAsRead).
export function RecentNotificationsPanel({ navigation }: { navigation: any }) {
  // null = still loading. A failed load shows nothing instead of an error banner.
  const [items, setItems] = useState<AppNotification[] | null>(null);

  // Reloaded on focus so items read on the Notifications screen update here.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getNotifications(PANEL_LIMIT)
        .then((list) => {
          if (active) setItems(list);
        })
        .catch(() => {
          if (active) setItems([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const open = (item: AppNotification) => {
    if (!item.read) {
      setItems((current) => current?.map((n) => (n.id === item.id ? { ...n, read: true } : n)) ?? current);
      markAsRead(item.id).catch(() => {
        // Not critical: the item shows as unread again on the next load.
      });
    }
    if (item.orderId) {
      navigation.navigate('OrderDetail', { orderId: item.orderId, role: item.role });
    } else {
      navigation.navigate('Notifications');
    }
  };

  if (items === null) return null;

  return (
    <View style={s.section}>
      <View style={s.headerRow}>
        <Text style={s.title}>Notification</Text>
        {items.length > 0 ? (
          <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8} accessibilityRole="button">
            <Text style={s.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={s.card}>
          <Text style={s.empty}>No notifications yet.</Text>
        </View>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={s.card}
            onPress={() => open(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.body}${item.read ? '' : '. Unread'}`}
          >
            <View style={s.icon}>
              <Ionicons name="notifications" size={16} color={colors.error} />
            </View>
            <Text style={[s.text, !item.read && s.textUnread]} numberOfLines={1}>
              {item.body || item.title}
            </Text>
            {!item.read ? <View style={s.dot} /> : null}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 12, fontWeight: '700' },
  seeAll: { color: colors.link, fontSize: 12, fontWeight: '600' },
  card: {
    minHeight: 38,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  icon: {
    width: 25,
    height: 25,
    borderRadius: radius.button,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  text: { flex: 1, color: colors.textSecondary, fontSize: 11 },
  textUnread: { color: colors.text, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.error, marginHorizontal: spacing.sm },
  empty: { flex: 1, color: colors.textMuted, fontSize: 11, paddingVertical: spacing.sm },
});
