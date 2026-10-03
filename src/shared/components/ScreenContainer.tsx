import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

type Props = { children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode; auth?: boolean };
export function ScreenContainer({ children, scroll, footer, auth }: Props) {
  return (
    <SafeAreaView style={[s.root, { backgroundColor: auth ? colors.bgAuth : colors.bg }]} edges={['bottom']}>
      {scroll
        ? <ScrollView style={s.flex} contentContainerStyle={s.content}>{children}</ScrollView>
        : <View style={[s.flex, s.content]}>{children}</View>}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1 }, content: { padding: 20, gap: 16 },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, padding: 16, gap: 8 },
});
