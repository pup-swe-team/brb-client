import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../shared/components';
import { colors, radius, spacing, text } from '../../../theme';

type Props = {
  confirmVisible: boolean;
  blockedVisible: boolean;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
  onCloseBlocked: () => void;
  onViewLends: () => void;
};

const CONSEQUENCES = [
  'Pending requests will be declined',
  'Your listings will be deactivated',
  'You keep Borrower access and can reapply anytime',
];

// CP-205. The two overlays of the revoke flow:
//   HTML 18 "Revoke Lender status?" (confirm) and HTML 19 "Can't revoke yet" (blocked).
// ConfirmModal in shared cannot show a bullet list or two actions in the blocked state, so this
// feature keeps its own small modals instead of changing the shared component.
export function RevokeLenderModals({
  confirmVisible,
  blockedVisible,
  loading,
  error,
  onConfirm,
  onCancel,
  onCloseBlocked,
  onViewLends,
}: Props) {
  return (
    <>
      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={onCancel}>
        <View style={s.backdrop}>
          <View style={s.card}>
            <Text style={text.h2}>Revoke Lender status?</Text>
            <Text style={[text.body, s.muted]}>Here’s what will happen:</Text>
            <View style={s.list}>
              {CONSEQUENCES.map((line) => (
                <View key={line} style={s.item}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[text.body, s.itemText]}>{line}</Text>
                </View>
              ))}
            </View>
            {error ? (
              <Text style={[text.caption, s.error]} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <View style={s.actions}>
              <Button title="Revoke" variant="destructive" onPress={onConfirm} loading={loading} />
              <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={loading} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={blockedVisible} animationType="fade" onRequestClose={onCloseBlocked}>
        <View style={s.backdrop}>
          <View style={s.card}>
            <Text style={text.h2}>Can’t revoke yet</Text>
            <Text style={[text.body, s.muted]}>
              You have a Confirmed or Active order. Finish it first, then you can revoke your Lender status.
            </Text>
            <View style={s.actions}>
              <Button title="View My Lends" onPress={onViewLends} />
              <Button title="Got it" variant="secondary" onPress={onCloseBlocked} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  muted: { color: colors.textSecondary },
  list: { gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemText: { flex: 1 },
  error: { color: colors.error },
  actions: { gap: spacing.sm },
});
