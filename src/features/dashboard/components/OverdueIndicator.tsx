import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';

// CP-506. Used on the Borrower and Lender dashboards (Danielo uses it too), so keep these props stable.
//   status: 'Overdue' | 'Unreturned' (any other status renders nothing)
//   detail: optional short text next to the label, e.g. '3 days overdue'
type Props = { status: string; detail?: string };

export function OverdueIndicator({ status, detail }: Props) {
  if (status !== 'Overdue' && status !== 'Unreturned') return null;

  // Unreturned is the more serious state, so it gets the solid red pill.
  const severe = status === 'Unreturned';
  const fg = severe ? colors.white : colors.error;

  return (
    <View style={s.row} accessibilityRole="alert" accessibilityLabel={detail ? `${status}. ${detail}` : status}>
      <View style={[s.pill, severe ? s.pillSevere : s.pillWarn]}>
        <Ionicons name={severe ? 'alert-circle' : 'time-outline'} size={11} color={fg} />
        <Text style={[s.label, { color: fg }]}>{status}</Text>
      </View>
      {detail ? <Text style={s.detail} numberOfLines={1}>{detail}</Text> : null}
    </View>
  );
}

export default OverdueIndicator;

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.button,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillWarn: { backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: colors.error },
  pillSevere: { backgroundColor: colors.error, borderWidth: 1, borderColor: colors.error },
  label: { fontSize: 8, fontWeight: '700' },
  detail: { color: colors.error, fontSize: 8, fontWeight: '600', flexShrink: 1 },
});