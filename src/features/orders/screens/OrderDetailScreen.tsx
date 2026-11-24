
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  Button,
  Card,
  EmptyState,
  ScreenContainer,
  StatusBadge,
  TopBar,
} from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import type { Order, OrderRole } from '../../../shared/types';
import { getCurrentUser, AuthUser } from '../../auth/services/authService';
import { getOrder } from '../services/ordersService';
import { CancelOrderAction } from '../components/CancelOrderAction';
import { HandoverCodeAction } from '../components/HandoverCodeAction';
import { RespondToRequestActions } from '../components/RespondToRequestActions';
import { ReturnCodeAction } from '../components/ReturnCodeAction';
import { ReviewAction } from '../../reviews/components/ReviewAction';
import { OpenChatAction } from '../components/OpenChatAction';

export default function OrderDetailScreen({ navigation, route }: any) {
  const { orderId, role: roleParam } = route.params as {
    orderId: string;
    role?: OrderRole;
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');

    // Pass the viewer's role so the counterpart is mapped correctly: a Lender
    // sees the Borrower, a Borrower sees the Lender.
    getOrder(orderId, roleParam)
      .then((loaded) => {
        if (active) {
          setOrder(loaded);
          setError('');
        }
      })
      .catch((e) => {
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
  }, [orderId, roleParam]);

  useFocusEffect(load);

  // Derive the viewer role reliably: if the signed-in user's name matches the lender, they are Lender.
  const role: OrderRole = useMemo(() => {
    if (currentUser && order) {
      const userNorm = currentUser.full_name.trim().toLowerCase();
      const lenderNorm = (order.lenderName || '').trim().toLowerCase();
      const borrowerNorm = (order.borrowerName || '').trim().toLowerCase();
      if (lenderNorm && userNorm && (lenderNorm.includes(userNorm.split(' ')[0]) || userNorm.includes(lenderNorm.split(' ')[0]))) {
        return 'Lender';
      }
      if (borrowerNorm && userNorm && (borrowerNorm.includes(userNorm.split(' ')[0]) || userNorm.includes(borrowerNorm.split(' ')[0]))) {
        return 'Borrower';
      }
    }
    return roleParam ?? order?.role ?? 'Borrower';
  }, [currentUser, order, roleParam]);

  const counterpartName = useMemo(() => {
    if (!order) return '';
    if (role === 'Lender') {
      return order.borrowerName || order.counterpart || 'Borrower';
    }
    return order.lenderName || order.counterpart || 'Lender';
  }, [order, role]);

  const status = order?.status;
  const slotProps = order ? { order, role, navigation, onChanged: load } : null;

  const showRespond = status === 'Requested' && role === 'Lender';
  const showHandover = status === 'Confirmed';
  const showReturn = status === 'Active' || status === 'Overdue';
  const showCancel = status === 'Requested' || status === 'Confirmed';
  const showReview = status === 'Completed'; // CP-601 (Izzy)
  // CP-202: Chat is offered while the order is in progress (HTML 24, 25, 29, 31, 37, 39, 64).
  const showChat =
    status === 'Requested' ||
    status === 'Confirmed' ||
    status === 'Active' ||
    status === 'Overdue' ||
    status === 'Disputed';

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
                {counterpartName}
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

            {order.status === 'Declined' && (
              <Card style={s.statusReasonCard}>
                <View style={s.statusReasonHeader}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.error} />
                  <Text style={[text.title, { color: colors.error }]}>Request Declined</Text>
                </View>
                <Text style={text.body}>
                  {order.declineReason
                    ? `Reason: ${order.declineReason}`
                    : 'This request was declined by the lender.'}
                </Text>
              </Card>
            )}

            {order.status === 'Cancelled' && (
              <Card style={s.statusReasonCard}>
                <View style={s.statusReasonHeader}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={[text.title, { color: colors.textSecondary }]}>Order Cancelled</Text>
                </View>
                <Text style={text.body}>
                  {order.cancelReason
                    ? `Reason: ${order.cancelReason}`
                    : 'This order was cancelled.'}
                </Text>
              </Card>
            )}

            {order.status === 'Disputed' && (
              <Card style={[s.statusReasonCard, { borderLeftColor: colors.warning }]}>
                <View style={s.statusReasonHeader}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                  <Text style={[text.title, { color: colors.warning }]}>Item Under Dispute</Text>
                </View>
                <Text style={text.body}>
                  {role === 'Borrower'
                    ? 'The lender submitted a damage or missing items report for this order. You can submit your explanation and counter-evidence.'
                    : 'A damage report was submitted and is pending review by administrators.'}
                </Text>
                {role === 'Borrower' && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Button
                      title="Respond to Dispute"
                      variant="secondary"
                      onPress={() => navigation.navigate('DisputeResponse', { orderId: order.id })}
                    />
                  </View>
                )}
              </Card>
            )}

            {showRespond && <RespondToRequestActions {...slotProps} />}
            {showHandover && <HandoverCodeAction {...slotProps} />}
            {showReturn && <ReturnCodeAction {...slotProps} />}
            {showChat && <OpenChatAction {...slotProps} />}
            {showCancel && <CancelOrderAction {...slotProps} />}
            {showReview && <ReviewAction {...slotProps} />}
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
  statusReasonCard: {
    gap: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  statusReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
