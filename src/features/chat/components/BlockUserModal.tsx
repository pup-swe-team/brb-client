// OWNER: Izzy | CP-702
// Block User confirmation modal in chat.

import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '../../../theme';
import { Button, SlotPlaceholder } from '../../../shared/components';

interface BlockUserModalProps {
  visible: boolean;
  userName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BlockUserModal({
  visible,
  userName = 'this user',
  onConfirm,
  onCancel,
}: BlockUserModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <SlotPlaceholder ticket="CP-702" owner="Izzy" label="Block User Modal" />

          <Text style={s.title}>Block {userName}?</Text>
          <Text style={s.body}>
            They will no longer be able to send you messages or start conversations with you.
          </Text>

          <View style={s.actions}>
            <Button
              title="Block User"
              variant="destructive"
              onPress={onConfirm}
            />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...text.title, fontSize: 17, color: colors.text },
  body: { ...text.body, color: colors.textSecondary, fontSize: 14 },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
