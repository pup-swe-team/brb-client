
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCurrentUser } from '../../auth/services/authService';
import { getLenderProfile } from '../../profile/services/lenderProfile';
import { MOCK_LENDERS } from '../../profile/services/mockLenders';
import { LenderReview } from '../../profile/services/lenderTypes';
import { LenderReviewCard } from '../../profile/components/LenderReviewCard';
import { colors, spacing } from '../../../theme';

export function ReviewsSection() {
  const [reviews, setReviews] = useState<LenderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        setLoading(true);
        setError('');

        const user = await getCurrentUser();

        let profile;

        if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
          const normalizedName = user.full_name.toLowerCase();

          profile = Object.values(MOCK_LENDERS).find((lender) =>
            lender.fullName.toLowerCase().includes(normalizedName.split(' ')[0])
          );

          if (!profile) {
            throw new Error('Your lender profile was not found.');
          }
        } else {
          profile = await getLenderProfile(String(user.id));
        }

        if (active) {
          setReviews(profile.reviews ?? []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load your reviews.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews Received</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : reviews.length === 0 ? (
        <Text style={styles.message}>
          You haven't received any reviews yet.
        </Text>
      ) : (
        reviews.map((review) => (
          <LenderReviewCard key={review.id} review={review} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
