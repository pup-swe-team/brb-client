import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, text } from '../../theme';

type Props = TextInputProps & { label?: string; error?: string; password?: boolean };
export function Input({ label, error, password, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!password);
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={text.body}>{label}</Text> : null}
      <View style={[s.box, error ? { borderColor: colors.error } : null]}>
        <TextInput style={s.input} placeholderTextColor={colors.textMuted} secureTextEntry={hidden} {...rest} />
        {password ? <Pressable onPress={() => setHidden(!hidden)}><Text style={s.toggle}>{hidden ? 'Show' : 'Hide'}</Text></Pressable> : null}
      </View>
      {error ? <Text style={[text.caption, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}
const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.input, backgroundColor: colors.white, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 14, color: colors.text },
  toggle: { color: colors.link, fontWeight: '600' },
});
