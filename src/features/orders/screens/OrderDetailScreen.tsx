
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  Card,
  EmptyState,
  ScreenContainer,
  StatusBadge,
  TopBar,
} from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import type { Order, OrderRole } from '../../../shared/types';
import { getOrder } from '../services/ordersService';
import { CancelOrderAction } from '../components/CancelOrderAction';
import { HandoverCodeAction } from '../components/HandoverCodeAction';
import { RespondToRequestActions } from '../components/RespondToRequestActions';
import { ReturnCodeAction } from '../components/ReturnCodeAction';

export default function OrderDetailScreen({ navigation, route }: any) {
  const { orderId, role: roleParam } = route.params as {
    orderId: string;
    role?: OrderRole;
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');

    getOrder(orderId)
      .then((loaded) => {
        console.log('[OrderDetail] Requested ID:', orderId);
        console.log('[OrderDetail] Loaded order:', loaded);

        if (active) {
          setOrder(loaded);
          setError('');
        }
      })
      .catch((e) => {
        console.error('[OrderDetail] Failed to load order:', e);
        if (active) {
          setOrder(null);
          setError('We couldn’t load this order. Please try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  useFocusEffect(load);

  const role: OrderRole = roleParam ?? order?.role ?? 'Borrower';
  const status = order?.status;
  const slotProps = order ? { order, role, navigation, onChanged: load } : null;

  const showRespond = status === 'Requested' && role === 'Lender';
  const showHandover = status === 'Confirmed';
  const showReturn = status === 'Active' || status === 'Overdue';
  const showCancel = status === 'Requested' || status === 'Confirmed';

  return (
    <View style={s.root}>
      <TopBar title="Order Details" onBack={() => navigation.goBack()} />

      <ScreenContainer scroll>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={s.loader} />
        ) : error || !order || !slotProps ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Order unavailable"
            message={error || 'This order could not be found.'}
          />
        ) : (
          <>
            <Card style={s.summary}>
              <View style={s.row}>
                {order.orderNumber ? (
                  <Text style={text.caption}>Order #{order.orderNumber}</Text>
                ) : (
                  <View />
                )}
                <StatusBadge status={order.status} />
              </View>

              <Text style={text.h2}>{order.listingTitle}</Text>

              <Text style={text.body}>
                {role === 'Lender' ? 'Borrowed by' : 'From'}{' '}
                {order.counterpart}
              </Text>

              <Text style={text.caption}>
                {order.startDate} to {order.endDate}
              </Text>

              {order.pickupLocation ? (
                <Text style={text.caption}>
                  Pickup: {order.pickupLocation}
                </Text>
              ) : null}

              <Text style={text.caption}>
                {order.pricePerDay ? `₱${order.pricePerDay} / day` : 'FREE'}
                {order.pricePerDay
                  ? ' · Payment is arranged outside the app.'
                  : ''}
              </Text>
            </Card>

            {showRespond && <RespondToRequestActions {...slotProps} />}
            {showHandover && <HandoverCodeAction {...slotProps} />}
            {showReturn && <ReturnCodeAction {...slotProps} />}
            {showCancel && <CancelOrderAction {...slotProps} />}
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxxl },
  summary: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
