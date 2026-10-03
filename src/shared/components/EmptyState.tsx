import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, text } from '../../theme';
import { Button } from './Button';

type Props = { icon?: keyof typeof Ionicons.glyphMap; title: string; message?: string; actionLabel?: string; onAction?: () => void };
export function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction }: Props) {
  return (
    <View style={s.wrap}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={[text.title, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[text.body, { textAlign: 'center', color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
const s = StyleSheet.create({ wrap: { alignItems: 'center', gap: 12, padding: 32 } });
