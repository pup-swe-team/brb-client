import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../theme';

type Props = { title: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'destructive'; disabled?: boolean; loading?: boolean };
export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const off = disabled || loading;
  const bg = variant === 'primary' ? colors.primary : variant === 'destructive' ? colors.error : colors.white;
  const fg = variant === 'secondary' ? colors.primary : colors.white;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button"
      style={[s.base, { backgroundColor: bg, opacity: off ? 0.5 : 1 }, variant === 'secondary' && s.outline]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.label, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}
const s = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  outline: { borderWidth: 1, borderColor: colors.primary },
  label: { fontSize: 16, fontWeight: '600' },
});
