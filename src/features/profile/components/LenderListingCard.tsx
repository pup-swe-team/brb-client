import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { LenderListing } from '../services/lenderTypes';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Books: 'book-outline',
  Equipment: 'construct-outline',
  Clothing: 'shirt-outline',
  Electronics: 'hardware-chip-outline',
  'Lab Gear': 'flask-outline',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmt(d: string) {
  const [, m, day] = d.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(day)}`;
}

type Props = { listing: LenderListing; onPress?: (listing: LenderListing) => void };

export function LenderListingCard({ listing, onPress }: Props) {
  return (
    <Pressable style={s.card} onPress={() => onPress?.(listing)} accessibilityRole="button">
      <View style={s.icon}>
        <Ionicons name={CATEGORY_ICON[listing.category] ?? 'cube-outline'} size={22} color={colors.primary} />
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{listing.title}</Text>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={10} color={colors.textSecondary} />
          <Text style={s.muted} numberOfLines={1}>{listing.location}</Text>
          <Text style={s.muted}>·</Text>
          <Text style={s.muted}>{listing.category}</Text>
        </View>
        <Text style={s.dates}>Available {fmt(listing.availableFrom)} – {fmt(listing.availableTo)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
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
  title: { color: colors.text, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  muted: { color: colors.textSecondary, fontSize: 8 },
  dates: { color: colors.primaryDark, fontSize: 8 },
});