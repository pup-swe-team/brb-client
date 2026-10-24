import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  auth?: boolean;
  // Which sides get safe-area padding. Defaults: auth screens = top + bottom,
  // everything else = bottom. Screens that draw their own header (or sit above
  // the bottom tab bar) pass a narrower list, e.g. [] or ['top'].
  edges?: Edge[];
  // Default screen padding. Turn off for full-bleed layouts (colored headers, edge-to-edge lists).
  padded?: boolean;
  // Lifts the content above the keyboard (forms).
  keyboardAware?: boolean;
};

export function ScreenContainer({
  children,
  scroll,
  footer,
  auth,
  edges,
  padded = true,
  keyboardAware,
}: Props) {
  const safeEdges: Edge[] = edges ?? (auth ? ['top', 'bottom'] : ['bottom']);

  const content = (
    <>
      {scroll ? (
        <ScrollView
          style={s.flex}
          contentContainerStyle={padded ? s.content : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[s.flex, padded && s.content]}>{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </>
  );

  return (
    <SafeAreaView
      style={[s.root, { backgroundColor: auth ? colors.bgAuth : colors.bg }]}
      edges={safeEdges}
    >
      {keyboardAware ? (
        <KeyboardAvoidingView style={s.flex} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});