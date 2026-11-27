
 // OWNER: Izzy | CP-702
// Block User confirmation modal.

import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';
import { Button } from '../../../shared/components';

interface BlockUserModalProps {
  visible: boolean;
  userName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BlockUserModal({
  visible,
  userName = 'this user',
  loading = false,
  onConfirm,
  onCancel,
}: BlockUserModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="ban-outline"
              size={spacing.xl}
              color={colors.warning}
            />
          </View>

          <Text style={styles.title}>
            Block {userName}?
          </Text>

          <Text style={styles.message}>
            You won&apos;t get messages from this user, and they
            won&apos;t be able to message you.
          </Text>

          <View style={styles.actions}>
            <View style={styles.buttonContainer}>
              <Button
                 title="Cancel"
                 variant="secondary"
                 onPress={onCancel}
                 disabled={loading}
                 compact
/>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                 title="Block"
                 variant="destructive"
                 onPress={onConfirm}
                 loading={loading}
                 compact
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: spacing.xxxl + spacing.lg,
    height: spacing.xxxl + spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...text.title,
    textAlign: 'center',
  },
  message: {
    ...text.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    flex: 1,
  },
});
