
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getCurrentUser } from '../../auth/services/authService';
import { getLenderProfile } from '../../profile/services/lenderProfile';
import { MOCK_LENDERS } from '../../profile/services/mockLenders';
import { LenderReview } from '../../profile/services/lenderTypes';
import { LenderReviewCard } from '../../profile/components/LenderReviewCard';
import { getReceivedReviews } from '../services/reviewsService';
import { USE_MOCK } from '../../../services/http';
import { colors, spacing } from '../../../theme';

type Props = {
  role?: 'Borrower' | 'Lender';
};

export function ReviewsSection({ role = 'Borrower' }: Props) {
  const [reviews, setReviews] = useState<LenderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadReviews() {
        try {
          setLoading(true);
          setError('');

          const user = await getCurrentUser();
          const userIdStr = String(user.id);

          if (role === 'Borrower') {
            const borrowerReviews = await getReceivedReviews('Borrower', userIdStr);
            const strictlyBorrower = borrowerReviews.filter((r) => {
              if (r.target_role && r.target_role.toLowerCase() !== 'borrower') return false;
              if (r.role && r.role.toLowerCase() !== 'borrower') return false;
              const c = (r.comment || '').toLowerCase();
              if (
                c.includes('reliable lender') ||
                c.includes('great lender') ||
                c.includes('smooth handoff and the calculator was in perfect condition')
              ) {
                return false;
              }
              return true;
            });
            if (active) {
              setReviews(strictlyBorrower);
            }
            return;
          }

          let profileReviews: LenderReview[] = [];

          if (USE_MOCK) {
            const normalizedName = user.full_name.toLowerCase();

            const profile = Object.values(MOCK_LENDERS).find((lender) =>
              lender.fullName.toLowerCase().includes(normalizedName.split(' ')[0])
            );

            profileReviews = profile?.reviews ?? [];
          } else {
            profileReviews = await getReceivedReviews('Lender', userIdStr);
            if (profileReviews.length === 0) {
              try {
                const profile = await getLenderProfile(userIdStr);
                profileReviews = profile.reviews ?? [];
              } catch {
                profileReviews = [];
              }
            }
          }

          // Strictly filter out any borrower reviews from lender dashboard
          const strictlyLender = profileReviews.filter((r) => {
            if (r.id && String(r.id).startsWith('br-')) return false;
            if (r.target_role && r.target_role.toLowerCase() !== 'lender') return false;
            if (r.role && r.role.toLowerCase() !== 'lender') return false;
            const c = (r.comment || '').toLowerCase();
            if (
              c.includes('great borrower') ||
              c.includes('careful borrower') ||
              c.includes('punctual borrower') ||
              c.includes('easy to communicate with during pickup and return')
            ) {
              return false;
            }
            return true;
          });

          if (active) {
            setReviews(strictlyLender);
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
    }, [role])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        Reviews Received
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : reviews.length === 0 ? (
        <Text style={styles.message}>
          You haven&apos;t received any reviews yet.
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
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  title: {
    fontSize: 16,
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
