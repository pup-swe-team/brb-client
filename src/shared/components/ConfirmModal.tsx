import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, text } from '../../theme';
import { Button } from './Button';

// variant "confirm": Confirm + Cancel. variant "blocked": explains why an action is unavailable (single button).
type Props = { visible: boolean; title: string; message: string; variant?: 'confirm' | 'blocked'; confirmLabel?: string; destructive?: boolean; onConfirm?: () => void; onCancel: () => void };
export function ConfirmModal({ visible, title, message, variant = 'confirm', confirmLabel = 'Confirm', destructive, onConfirm, onCancel }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={text.h2}>{title}</Text>
          <Text style={[text.body, { color: colors.textSecondary }]}>{message}</Text>
          {variant === 'blocked' ? <Button title="Got it" onPress={onCancel} /> : (
            <View style={{ gap: 8 }}>
              <Button title={confirmLabel} variant={destructive ? 'destructive' : 'primary'} onPress={onConfirm} />
              <Button title="Cancel" variant="secondary" onPress={onCancel} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: 20, gap: 12 },
});
