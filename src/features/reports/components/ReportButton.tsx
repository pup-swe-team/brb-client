import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, text } from '../../../theme';
import type { ReportTargetType } from '../services/reportsService';
import { ReportSheet } from './ReportSheet';

// OWNER: Lance. CP-901. Small "Report" entry point that opens ReportSheet.
// Already placed (Sprint 4 scaffold) on: ItemDetailScreen (listing), LenderProfileScreen (user),
// LenderReviewCard (review). Do NOT edit those files; change this component if the look needs to.
export function ReportButton({ targetType, targetId }: { targetType: ReportTargetType; targetId?: string }) {
  const [open, setOpen] = useState(false);
  if (!targetId) return null;

  return (
    <>
      <Pressable
        style={s.button}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Report this ${targetType}`}
      >
        <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
        <Text style={[text.caption, s.label]}>Report</Text>
      </Pressable>
      <ReportSheet
        visible={open}
        targetType={targetType}
        targetId={targetId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingVertical: spacing.xs },
  label: { color: colors.textMuted },
});
