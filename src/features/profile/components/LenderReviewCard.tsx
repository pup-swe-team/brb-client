import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { VerifiedLabel } from '../../../shared/components/VerifiedLabel';
import { LenderReview } from '../services/lenderTypes';
import { StarRating } from './StarRating';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmt(d: string) {
  const [y, m, day] = d.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(day)}, ${y}`;
}

export function LenderReviewCard({ review }: { review: LenderReview }) {
  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <VerifiedLabel name={review.reviewerName} verified={review.reviewerVerified} />
        </View>
        <Text style={s.date}>{fmt(review.date)}</Text>
      </View>

      <StarRating value={review.rating} size={11} />
      <Text style={s.item} numberOfLines={1}>Borrowed: {review.itemTitle}</Text>
      <Text style={s.comment}>{review.comment}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { color: colors.textMuted, fontSize: 8 },
  item: { color: colors.primaryDark, fontSize: 8 },
  comment: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 2 },
});