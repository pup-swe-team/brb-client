import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { colors, radius, spacing } from '../../../theme';
import { Button } from '../../../shared/components';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import type { Order } from '../../../shared/types';
import { getMyOrders } from '../../orders/services/ordersService';
import { OverdueIndicator } from './OverdueIndicator';
import { IncomingRequestsSection } from './IncomingRequestsSection';

// OWNER: Member A. CP-203 Lender dashboard shell.
// Rendered by ProfileScreen as <LenderDashboard navigation={navigation} /> inside its ScrollView,
// so this component must NOT contain its own ScrollView or FlatList.
// All data comes from ordersService (no hardcoded data, no axios here).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtRange(start: string, end: string) {
  const [, sm, sd] = start.split('-');
  const [ey, em, ed] = end.split('-');
  return `${MONTHS[Number(sm) - 1]} ${Number(sd)} – ${MONTHS[Number(em) - 1]} ${Number(ed)}, ${ey}`;
}

function peso(n?: number) {
  return n ? `₱${n}/day` : 'Free';
}

const isLate = (status: string) => status === 'Overdue' || status === 'Unreturned';

function daysLate(endDate: string) {
  const [y, m, d] = endDate.split('-').map(Number);
  const end = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - end) / 86400000));
}

function lateDetail(order: Order) {
  const n = daysLate(order.endDate);
  if (n === 0) return undefined;
  return `${n} ${n === 1 ? 'day' : 'days'} ${order.status === 'Overdue' ? 'overdue' : 'unreturned'}`;
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.countBadge}>
        <Text style={s.countText}>{count}</Text>
      </View>
    </View>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const late = isLate(order.status);
  return (
    <Pressable style={s.card} onPress={onPress} accessibilityRole="button">
      <View style={s.icon}>
        <Ionicons name="document-text-outline" size={22} color={colors.primary} />
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{order.listingTitle}</Text>
        <Text style={s.muted} numberOfLines={1}>to {order.counterpart}</Text>
        <Text style={s.dates} numberOfLines={2}>
          {fmtRange(order.startDate, order.endDate)} · {peso(order.pricePerDay)}
        </Text>
        {late ? <OverdueIndicator status={order.status} detail={lateDetail(order)} /> : null}
      </View>

      <View style={s.right}>
        <StatusBadge status={order.status} />
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export function LenderDashboard({ navigation }: { navigation: any }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    let active = true;
    getMyOrders('Lender')
      .then((data) => {
        if (!active) return;
        setOrders(data);
        setError(null);
      })
      .catch(() => {
        if (active) setError('Could not load your lender orders.');
      });
    return () => {
      active = false;
    };
  }, []);

  // Refetch on focus so changes made on OrderDetail show up when returning here.
  useFocusEffect(fetchOrders);

  const retry = () => {
    setOrders(null);
    setError(null);
    getMyOrders('Lender')
      .then((data) => {
        setOrders(data);
        setError(null);
      })
      .catch(() => {
        setError('Could not load your lender orders.');
      });
  };

  const openOrder = (order: Order) => navigation.navigate('OrderDetail', { orderId: order.id, role: 'Lender' });

  if (error) {
    return (
      <View style={s.stateWrap}>
        <Text style={s.errorText}>{error}</Text>
        <Button title="Try again" variant="secondary" onPress={retry} />
      </View>
    );
  }

  if (orders === null) {
    return (
      <View style={s.stateWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const lateOrders = orders.filter((o) => isLate(o.status));
  const confirmedOrders = orders.filter((o) => o.status === 'Confirmed');
  const activeOrders = orders.filter((o) => o.status === 'Active');
  const pastOrders = orders.filter((o) => o.status === 'Completed' || o.status === 'Cancelled' || o.status === 'Declined');
  const requestedCount = orders.filter((o) => o.status === 'Requested').length;
  const nothingToShow = lateOrders.length + confirmedOrders.length + activeOrders.length + pastOrders.length === 0;

  return (
    <View>
      {/* SUMMARY */}
      <View style={s.statsCard}>
        <View style={s.stat}>
          <Text style={s.statValue}>{requestedCount}</Text>
          <Text style={s.statLabel}>Requests</Text>
        </View>
        <View style={[s.stat, s.statMid]}>
          <Text style={s.statValue}>{confirmedOrders.length + activeOrders.length}</Text>
          <Text style={s.statLabel}>Ongoing</Text>
        </View>
        <View style={[s.stat, s.statMid]}>
          <Text style={s.statValue}>{pastOrders.length}</Text>
          <Text style={s.statLabel}>Past</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>5.0 ★</Text>
          <Text style={s.statLabel}>Rating</Text>
        </View>
      </View>

      {/* MY LISTINGS */}
      <View style={s.section}>
        <View style={s.lenderCard}>
          <View style={s.lenderIcon}>
            <Ionicons name="albums-outline" size={23} color={colors.primary} />
          </View>
          <View style={s.lenderInfo}>
            <Text style={s.lenderTitle}>My Listings</Text>
            <Text style={s.lenderDescription}>Edit, deactivate or delete the items you lend</Text>
          </View>
          <Pressable style={s.applyButton} onPress={() => navigation.navigate('MyListings')} accessibilityRole="button">
            <Text style={s.applyText}>Manage</Text>
          </Pressable>
        </View>
      </View>

      {/* INCOMING REQUESTS (CP-502) */}
      <View style={s.section}>
        <IncomingRequestsSection navigation={navigation} />
      </View>

      {/* OVERDUE / UNRETURNED */}
      {lateOrders.length > 0 && (
        <View style={s.section}>
          <SectionTitle title="Overdue and unreturned" count={lateOrders.length} />
          {lateOrders.map((o) => (
            <OrderCard key={o.id} order={o} onPress={() => openOrder(o)} />
          ))}
        </View>
      )}

      {/* CONFIRMED */}
      {confirmedOrders.length > 0 && (
        <View style={s.section}>
          <SectionTitle title="Confirmed" count={confirmedOrders.length} />
          {confirmedOrders.map((o) => (
            <OrderCard key={o.id} order={o} onPress={() => openOrder(o)} />
          ))}
        </View>
      )}

      {/* ACTIVE */}
      {activeOrders.length > 0 && (
        <View style={s.section}>
          <SectionTitle title="Active" count={activeOrders.length} />
          {activeOrders.map((o) => (
            <OrderCard key={o.id} order={o} onPress={() => openOrder(o)} />
          ))}
        </View>
      )}

      {/* PAST ORDERS */}
      {pastOrders.length > 0 && (
        <View style={s.section}>
          <SectionTitle title="Past orders" count={pastOrders.length} />
          {pastOrders.map((o) => (
            <OrderCard key={o.id} order={o} onPress={() => openOrder(o)} />
          ))}
        </View>
      )}

      {nothingToShow ? (
        <View style={s.section}>
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No orders to manage yet</Text>
            <Text style={s.emptyText}>Confirmed and active orders for your listings will show up here.</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  stateWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingVertical: spacing.lg, gap: spacing.md },
  errorText: { color: colors.error, fontSize: 10, textAlign: 'center' },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statValue: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 8 },

  section: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  countBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: radius.button,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { color: colors.primary, fontSize: 9, fontWeight: '700' },

  lenderCard: {
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lenderIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  lenderInfo: { flex: 1, paddingRight: spacing.sm },
  lenderTitle: { color: colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  lenderDescription: { color: colors.textSecondary, fontSize: 8, lineHeight: 12 },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: { color: colors.white, fontSize: 9, fontWeight: '700' },

  card: {
    minHeight: 65,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: radius.input,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  info: { flex: 1, paddingRight: spacing.xs, gap: 2 },
  title: { color: colors.text, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  muted: { color: colors.textSecondary, fontSize: 8 },
  dates: { color: colors.primaryDark, fontSize: 8, lineHeight: 11 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 1, marginLeft: spacing.xs },

  empty: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: { color: colors.text, fontSize: 11, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, fontSize: 9, textAlign: 'center' },
});