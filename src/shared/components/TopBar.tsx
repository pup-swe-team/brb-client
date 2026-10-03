import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
      <View style={s.bar}>
        {onBack ? <Pressable onPress={onBack} accessibilityLabel="Go back"><Ionicons name="chevron-back" size={24} color="#fff" /></Pressable> : null}
        <Text style={s.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({ bar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }, title: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 } });
