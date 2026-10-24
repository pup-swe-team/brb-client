import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { VerifiedLabel } from '../../../shared/components/VerifiedLabel';
import { LenderSummary } from '../types';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

type Props = { lender: LenderSummary; onPress?: (lender: LenderSummary) => void };

export function LenderResultCard({ lender, onPress }: Props) {
  return (
    <Pressable style={s.card} onPress={() => onPress?.(lender)} accessibilityRole="button">
      {lender.photoUrl ? (
        <Image source={{ uri: lender.photoUrl }} style={s.avatar} />
      ) : (
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials(lender.fullName)}</Text>
        </View>
      )}

      <View style={s.info}>
        <VerifiedLabel name={lender.fullName} verified={lender.verified} affiliation={lender.affiliation} />
        {lender.program ? <Text style={s.muted} numberOfLines={1}>{lender.program}</Text> : null}
        <View style={s.ratingRow}>
          <Ionicons name="star" size={11} color={colors.gold} />
          <Text style={s.rating}>
            {lender.reviewCount > 0 ? `${lender.rating.toFixed(1)} (${lender.reviewCount})` : 'No ratings yet'}
          </Text>
        </View>
        <Text style={s.listings}>
          {lender.activeListings} active {lender.activeListings === 1 ? 'listing' : 'listings'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  info: { flex: 1, gap: 2, paddingRight: spacing.xs },
  muted: { color: colors.textSecondary, fontSize: 9 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: colors.text, fontSize: 10, fontWeight: '600' },
  listings: { color: colors.primaryDark, fontSize: 9 },
});
