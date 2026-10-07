import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

// CP-107: what OTHER users see. Only a name and a verified flag go in; the ID document never reaches these components.

// Green pill, same look as the one on ProfileScreen.
export function VerifiedBadge() {
  return (
    <View style={s.badge} accessibilityLabel="Verified">
      <Ionicons name="checkmark-circle" size={11} color={colors.white} />
      <Text style={s.badgeText}>Verified</Text>
    </View>
  );
}

type Props = { name: string; verified: boolean; compact?: boolean };

// Name + badge (only when verified). Use on listings, reviews, chats.
export function VerifiedLabel({ name, verified, compact }: Props) {
  return (
    <View style={s.row}>
      <Text style={[s.name, compact && s.nameCompact]} numberOfLines={1}>{name}</Text>
      {verified ? <VerifiedBadge /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { color: colors.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  nameCompact: { fontSize: 8, fontWeight: '600', color: colors.textSecondary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success,
    borderRadius: radius.button,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: colors.white, fontSize: 8, fontWeight: '700' },
});