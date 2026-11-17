
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card } from '../../../shared/components';
import { colors, radius, spacing, text } from '../../../theme';
import type { OrderActionProps } from '../../orders/components/orderActionProps';
import { getOrderReview, SubmittedReview } from '../services/reviewsService';

// OWNER: Izzy. CP-601.
// Shows Rate & Review when not reviewed; displays the completed review when submitted.

export function ReviewAction({ order, navigation }: OrderActionProps) {
  const [review, setReview] = useState<SubmittedReview | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(false);
  const [retry, setRetry] = useState(0);

  const orderId = String(order.id);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void retry;

      async function checkReview() {
        setChecking(true);
        setCheckError(false);

        try {
          const existingReview = await getOrderReview(orderId);

          if (active) {
            setReview(existingReview);
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

  if (review) {
    return (
      <Card style={s.card}>
        <View style={s.header}>
          <Text style={text.title}>Your Review</Text>
          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= review.rating ? 'star' : 'star-outline'}
                size={16}
                color={colors.gold}
              />
            ))}
            <Text style={s.ratingText}>({review.rating.toFixed(1)})</Text>
          </View>
        </View>
        {review.comment ? (
          <Text style={[text.body, s.comment]}>{review.comment}</Text>
        ) : null}
        {review.createdAt ? (
          <Text style={text.caption}>Submitted on {review.createdAt.slice(0, 10)}</Text>
        ) : null}
      </Card>
    );
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

const s = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  comment: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
