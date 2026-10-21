import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { VerifiedLabel } from '../../../shared/components/VerifiedLabel';
import { CATEGORY_ICON } from '../../listings/constants';
import { Listing } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmt(d: string) {
  const [, m, day] = d.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(day)}`;
}

type Props = { listing: Listing; onPress?: (listing: Listing) => void };

export function ListingResultCard({ listing, onPress }: Props) {
  return (
    <Pressable style={s.card} onPress={() => onPress?.(listing)} accessibilityRole="button">
      <View style={s.icon}>
        <Ionicons name={CATEGORY_ICON[listing.category]} size={22} color={colors.primary} />
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{listing.title}</Text>

        <View style={s.ownerRow}>
          <Text style={s.muted}>by</Text>
          <VerifiedLabel name={listing.ownerName} verified={listing.ownerVerified} compact />
        </View>

        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={10} color={colors.textSecondary} />
          <Text style={s.muted} numberOfLines={1}>{listing.location}</Text>
          <Text style={s.muted}>·</Text>
          <Text style={s.muted}>{listing.category}</Text>
        </View>

        <Text style={s.dates} numberOfLines={1}>
          Available {fmt(listing.availableFrom)} – {fmt(listing.availableTo)}
        </Text>
      </View>

      <View style={s.right}>
        <View style={s.ratingRow}>
          <Ionicons name="star" size={12} color={colors.gold} />
          <Text style={s.rating}>{listing.rating.toFixed(1)}</Text>
        </View>
        <Text style={s.muted}>({listing.reviewCount})</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    minHeight: 78,
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
  title: { color: colors.text, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  muted: { color: colors.textSecondary, fontSize: 8 },
  dates: { color: colors.primaryDark, fontSize: 8 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', marginLeft: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: colors.text, fontSize: 10, fontWeight: '700' },
});