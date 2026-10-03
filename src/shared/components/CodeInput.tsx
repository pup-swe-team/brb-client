import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, text } from '../../theme';

// One-time handover/return code entry. Parent owns value, error and locked state.
type Props = { value: string; onChange: (v: string) => void; length?: number; error?: string; disabled?: boolean };
export function CodeInput({ value, onChange, length = 6, error, disabled }: Props) {
  const ref = useRef<TextInput>(null);
  return (
    <View style={{ gap: 8, alignItems: 'center' }}>
      <Pressable onPress={() => ref.current?.focus()} style={s.row}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[s.cell, error ? { borderColor: colors.error } : null]}><Text style={text.h2}>{value[i] ?? ''}</Text></View>
        ))}
      </Pressable>
      <TextInput ref={ref} value={value} editable={!disabled} maxLength={length} autoCapitalize="characters"
        onChangeText={(v) => onChange(v.replace(/\s/g, ''))} style={s.hidden} />
      {error ? <Text style={[text.caption, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  cell: { width: 44, height: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.input, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
