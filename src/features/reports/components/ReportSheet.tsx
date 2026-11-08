import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, SlotPlaceholder } from '../../../shared/components';
import { colors, radius, spacing } from '../../../theme';
import type { ReportTargetType } from '../services/reportsService';

export interface ReportSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

// OWNER: Lance. CP-901 Report form: category selector + description, submit via reportsService.
// ReportButton (same folder) already opens this sheet from the listing detail, lender profile and
// review card, so you only edit files in features/reports/.
// Build: category selector (REPORT_CATEGORIES), required description, loading + error + success state.
// Replace the SlotPlaceholder. Keep the props above unchanged.
export function ReportSheet({ visible, onClose }: ReportSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <SlotPlaceholder ticket="CP-901" owner="Lance" label="Report form" />
          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
