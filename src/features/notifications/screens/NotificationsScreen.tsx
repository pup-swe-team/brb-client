import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, ScreenContainer, TopBar } from '../../../shared/components';
import { colors, radius, spacing } from '../../../theme';
import {
  AppNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../services/notificationsService';

// CP-801 Notify users of key platform events.
// Tapping an item with an orderId marks it read and navigates to OrderDetail.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(t);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes('confirmed') || type.includes('completed')) return 'checkmark-circle-outline';
  if (type.includes('due') || type.includes('overdue')) return 'time-outline';
  if (type.includes('review')) return 'star-outline';
  if (type.includes('requested')) return 'mail-unread-outline';
  return 'notifications-outline';
}

export default function NotificationsScreen({ navigation }: any) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      setItems(await getNotifications());
      setError(null);
    } catch (e: any) {
      // On a silent refresh keep showing the list we already have.
      if (mode !== 'silent') setError(e?.message ?? 'Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh whenever the screen gains focus so unread state is right when returning.
  useFocusEffect(
    useCallback(() => {
      load(items.length === 0 ? 'initial' : 'silent');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  const unreadCount = items.filter((n) => !n.read).length;

  const onPressItem = async (n: AppNotification) => {
    setActionError(null);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markAsRead(n.id).catch((e: any) => {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
        setActionError(e?.message ?? 'Could not mark as read.');
      });
    }
    if (n.orderId) navigation.navigate('OrderDetail', { orderId: n.orderId, role: n.role });
  };

  const onMarkAll = async () => {
    if (unreadCount === 0) return;
    setActionError(null);
    const before = items;
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await markAllAsRead();
    } catch (e: any) {
      setItems(before);
      setActionError(e?.message ?? 'Could not mark all as read.');
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => onPressItem(item)}
      style={[s.item, item.read ? s.itemRead : s.itemUnread]}
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
    >
      <Ionicons
        name={iconFor(item.type)}
        size={18}
        color={item.read ? colors.textMuted : colors.primary}
        style={s.icon}
      />
      <View style={s.itemBody}>
        <Text style={[s.itemTitle, item.read && s.mutedText]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[s.itemText, item.read && s.mutedText]} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read ? <View style={s.dot} accessibilityLabel="Unread" /> : null}
    </Pressable>
  );

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  } else if (error && items.length === 0) {
    content = (
      <View style={s.center}>
        <Text style={s.errorText}>{error}</Text>
        <Button title="Try again" variant="secondary" onPress={() => load('initial')} />
      </View>
    );
  } else {
    content = (
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={items.length === 0 ? s.emptyList : s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={s.headerRow}>
              <Text style={s.summary}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
              <Pressable
                onPress={onMarkAll}
                disabled={unreadCount === 0}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Text style={[s.markAll, unreadCount === 0 && s.markAllDisabled]}>Mark all as read</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        ListFooterComponent={actionError ? <Text style={s.errorText}>{actionError}</Text> : undefined}
        ListEmptyComponent={
          <View style={s.center}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptyText}>Updates about your orders and reviews will show up here.</Text>
          </View>
        }
      />
    );
  }

  return (
    <View style={s.root}>
      <TopBar title="Notifications" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <View style={s.body}>{content}</View>
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  emptyList: { flexGrow: 1 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  summary: { color: colors.textSecondary, fontSize: 10 },
  markAll: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  markAllDisabled: { color: colors.textMuted, fontWeight: '400' },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  itemUnread: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  itemRead: { backgroundColor: colors.white, borderColor: colors.border },
  icon: { marginTop: 1 },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  itemText: { color: colors.text, fontSize: 10 },
  itemTime: { color: colors.textSecondary, fontSize: 8, marginTop: 2 },
  mutedText: { color: colors.textSecondary, fontWeight: '400' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },

  emptyTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  errorText: { color: colors.error, fontSize: 10, textAlign: 'center', marginTop: spacing.sm },
});