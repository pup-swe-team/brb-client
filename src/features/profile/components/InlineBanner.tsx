import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';

export type BannerVariant = 'success' | 'error' | 'info';

const MAP: Record<BannerVariant, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { color: colors.success, icon: 'checkmark-circle' },
  error: { color: colors.error, icon: 'alert-circle' },
  info: { color: colors.info, icon: 'information-circle' },
};

// Message bar for settings forms. Icon + text + color, never color alone.
export function InlineBanner({
  variant,
  message,
}: {
  variant: BannerVariant;
  message: string;
}) {
  const { color, icon } = MAP[variant];
  return (
    <View
      style={[s.box, { borderColor: color }]}
      accessibilityRole={variant === 'error' ? 'alert' : undefined}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[text.body, s.message]}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.card,
    backgroundColor: colors.white,
  },
  message: { flex: 1 },
});
