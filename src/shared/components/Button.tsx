import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../theme';

type Props = { title: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'destructive'; disabled?: boolean; loading?: boolean; compact?: boolean };

const PRESSED_BG = {
  primary: colors.primaryDark,
  destructive: colors.primaryDark,
  secondary: colors.primarySoftPressed,
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, compact }: Props) {
  const off = disabled || loading;
  // Destructive uses the same deep red family as primary. The lighter colors.error looked washed out
  // (like a disabled button) next to the other buttons.
  const bg = variant === 'primary' || variant === 'destructive' ? colors.primary : colors.white;
  const fg = variant === 'secondary' ? colors.primary : colors.white;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button"
      style={({ pressed }) => [
        s.base,
        compact && s.compact,
        { backgroundColor: pressed && !off ? PRESSED_BG[variant] : bg, opacity: off ? 0.5 : 1 },
        variant === 'secondary' && s.outline,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.label, compact && s.labelCompact, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}
const s = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  compact: { minHeight: 40, paddingHorizontal: 12 },
  outline: { borderWidth: 1, borderColor: colors.primary },
  label: { fontSize: 16, fontWeight: '600' },
  labelCompact: { fontSize: 13 },
});