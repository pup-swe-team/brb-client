import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../../theme';
import { ScreenContainer } from '../../../shared/components';

type Props = { title: string; onBack: () => void; children: React.ReactNode; footer?: React.ReactNode };

// Red header + scrollable, keyboard-aware body shared by the account settings screens.
export function SettingsShell({ title, onBack, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScreenContainer edges={['bottom']} scroll keyboardAware footer={footer}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={onBack} hitSlop={12} style={s.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={s.title}>{title}</Text>
      </View>
      {children}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // Negative margins cancel the ScreenContainer padding so the header is full width.
  header: {
    marginHorizontal: -spacing.xl,
    marginTop: -spacing.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
