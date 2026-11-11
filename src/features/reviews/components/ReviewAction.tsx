
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button } from '../../../shared/components';
import { colors, spacing } from '../../../theme';
import type { OrderActionProps } from '../../orders/components/orderActionProps';
import { getOrderReview } from '../services/reviewsService';

// OWNER: Izzy. CP-601.
// Shows Rate & Review only when the completed order has not been reviewed.

export function ReviewAction({ order, navigation }: OrderActionProps) {
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(false);
  const [retry, setRetry] = useState(0);

  const orderId = String(order.id);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function checkReview() {
        setChecking(true);
        setCheckError(false);

        try {
          const existingReview = await getOrderReview(orderId);

          if (active) {
            setAlreadyReviewed(!!existingReview);
          }
        } catch {
          if (active) {
            setCheckError(true);
          }
        } finally {
          if (active) {
            setChecking(false);
          }
        }
      }

      checkReview();

      return () => {
        active = false;
      };
    }, [orderId, retry])
  );

  if (checking) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.md }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (alreadyReviewed) {
    return null;
  }

  if (checkError) {
    return (
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          Unable to check your review status.
        </Text>

        <Button
          title="Try Again"
          variant="secondary"
          onPress={() => setRetry((current) => current + 1)}
        />
      </View>
    );
  }

  return (
    <Button
      title="Rate & Review"
      variant="secondary"
      onPress={() =>
        navigation.navigate('ReviewForm', { orderId })
      }
    />
  );
}
