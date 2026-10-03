import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { OrderStatus } from '../types';

const MAP: Record<OrderStatus, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Requested: { color: colors.info, icon: 'time-outline' }, Confirmed: { color: colors.success, icon: 'checkmark-circle-outline' },
  Active: { color: colors.info, icon: 'play-circle-outline' }, Overdue: { color: colors.warning, icon: 'alert-circle-outline' },
  Unreturned: { color: colors.error, icon: 'close-circle-outline' }, Returned: { color: colors.success, icon: 'return-down-back-outline' },
  Completed: { color: colors.success, icon: 'checkmark-done-outline' }, Disputed: { color: colors.error, icon: 'flag-outline' },
  Declined: { color: colors.error, icon: 'remove-circle-outline' }, Expired: { color: colors.textMuted, icon: 'hourglass-outline' },
  Cancelled: { color: colors.textMuted, icon: 'ban-outline' },
};
// Color + icon + label: status never relies on color alone (SRS 4.3).
export function StatusBadge({ status }: { status: OrderStatus }) {
  const { color, icon } = MAP[status];
  return (
    <View style={[s.pill, { borderColor: color }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[s.label, { color }]}>{status}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.white },
  label: { fontSize: 12, fontWeight: '600' },
});
