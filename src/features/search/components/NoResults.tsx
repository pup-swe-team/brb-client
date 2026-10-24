import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { Button } from '../../../shared/components';

type Props = { keyword: string; hasFilters: boolean; onClear: () => void };

export function NoResults({ keyword, hasFilters, onClear }: Props) {
  const kw = keyword.trim();
  return (
    <View style={s.wrap}>
      <View style={s.icon}>
        <Ionicons name="search-outline" size={28} color={colors.primary} />
      </View>
      <Text style={s.title}>No results found</Text>
      <Text style={s.text}>
        {kw ? `Nothing matches "${kw}"` : 'Nothing matches your filters'}
        {kw && hasFilters ? ' with those filters.' : '.'} Try a different keyword or loosen the filters.
      </Text>
      {kw || hasFilters ? (
        <View style={{ alignSelf: 'stretch' }}>
          <Button title="Clear search and filters" variant="secondary" onPress={onClear} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  icon: {
    width: 60,
    height: 60,
    borderRadius: radius.card,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  text: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});