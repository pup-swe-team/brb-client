import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, text } from '../../theme';

type Props = { checked: boolean; onChange: (next: boolean) => void; label: string; error?: string };

export function Checkbox({ checked, onChange, label, error }: Props) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={s.row}
      >
        <View style={[s.box, checked && s.boxOn, error ? { borderColor: colors.error } : null]}>
          {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
        </View>
        <Text style={[text.body, { flex: 1 }]}>{label}</Text>
      </Pressable>
      {error ? <Text style={[text.caption, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  box: {
    width: 22, height: 22, marginTop: 1, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.borderStrong, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});