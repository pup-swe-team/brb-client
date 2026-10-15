import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '../../theme';
import { Button } from './Button';

// "Can't do that yet" dialog: explains WHY an action is blocked and (optionally)
// offers the next step. Close on the left, the next-step action on the right.
// ConfirmModal variant="blocked" only has one "Got it" button, so use this
// when the design shows Close + a follow-up action (e.g. "View Orders").
type Props = {
  visible: boolean;
  title: string;
  message: string;
  closeLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
};

export function BlockedModal({
  visible,
  title,
  message,
  closeLabel = 'Close',
  actionLabel,
  onAction,
  onClose,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={text.h2}>{title}</Text>
          <Text style={[text.body, { color: colors.textSecondary }]}>{message}</Text>
          <View style={s.buttons}>
            <View style={s.flex}>
              <Button title={closeLabel} variant="secondary" onPress={onClose} />
            </View>
            {actionLabel ? (
              <View style={s.flex}>
                <Button title={actionLabel} onPress={onAction} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.md,
  },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
