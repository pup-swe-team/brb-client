import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';

// OWNER: Member A. CP-506 Build overdue/unreturned status indicators on dashboards.
// ONE reusable indicator for both dashboards. Danielo's Borrower dashboard
// (CP-201) and Member A's Lender dashboard (CP-203) both import it, so keep
// the props stable: { status, detail }. Colors from theme only; status is
// always color + icon + label (CLAUDE.md rule 6).
// Design: HTML 20 shows Overdue ("3 days overdue"). Unreturned has no mockup yet:
// reuse the same look with the error color and ask the Business Analyst.
// TODO (Member A): replace this simple version with the final design.
export function OverdueIndicator({ status, detail }: { status: 'Overdue' | 'Unreturned'; detail?: string }) {
  const color = status === 'Overdue' ? colors.warning : colors.error;
  return (
    <View style={s.row} accessibilityLabel={detail ? `${status}. ${detail}` : status}>
      <Ionicons name={status === 'Overdue' ? 'alert-circle-outline' : 'close-circle-outline'} size={14} color={color} />
      <Text style={[text.caption, { color }]}>{detail ? `${status} · ${detail}` : status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', borderRadius: radius.pill },
});
