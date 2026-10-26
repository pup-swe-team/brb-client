import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '../../theme';

// Sprint 3 scaffold only. Marks a spot in a shared screen that one teammate
// owns. Shown in development builds so everyone can see where their piece
// plugs in; delete the placeholder when you replace the stub with real UI.
export function SlotPlaceholder({ ticket, owner, label }: { ticket: string; owner: string; label: string }) {
  if (!__DEV__) return null;
  return (
    <View style={s.box}>
      <Text style={[text.caption, s.title]}>{ticket} · {label}</Text>
      <Text style={text.caption}>Owner: {owner}. Replace this stub.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: { fontWeight: '700' },
});
