import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

// CP-107: what OTHER users see. Only a name, affiliation, and a verified flag go in; the ID document never reaches these components.

// Green pill, same look as the one on ProfileScreen.
export function VerifiedBadge() {
  return (
    <View style={s.badge} accessibilityLabel="Verified">
      <Ionicons name="checkmark-circle" size={11} color={colors.white} />
      <Text style={s.badgeText}>Verified</Text>
    </View>
  );
}

export type AffiliationType = 'Student' | 'Faculty' | 'Staff';

export function AffiliationBadge({
  affiliation,
  compact,
}: {
  affiliation: AffiliationType | string;
  compact?: boolean;
}) {
  return (
    <View
      style={[s.affiliationBadge, compact && s.affiliationBadgeCompact]}
      accessibilityLabel={`Affiliation: ${affiliation}`}
    >
      <Text style={[s.affiliationText, compact && s.affiliationTextCompact]}>
        {affiliation}
      </Text>
    </View>
  );
}

type Props = {
  name: string;
  verified?: boolean;
  affiliation?: AffiliationType | string;
  compact?: boolean;
};

// Name + affiliation + badge (only when verified). Use on profile, listings, reviews, chats.
export function VerifiedLabel({ name, verified, affiliation, compact }: Props) {
  return (
    <View style={s.row}>
      <Text style={[s.name, compact && s.nameCompact]} numberOfLines={1}>
        {name}
      </Text>
      {affiliation ? (
        <AffiliationBadge affiliation={affiliation} compact={compact} />
      ) : null}
      {verified ? <VerifiedBadge /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: { color: colors.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  nameCompact: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  affiliationBadge: {
    backgroundColor: '#F4EAEB',
    borderColor: '#E8CCD0',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  affiliationBadgeCompact: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  affiliationText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  affiliationTextCompact: {
    fontSize: 8,
    fontWeight: '700',
  },
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