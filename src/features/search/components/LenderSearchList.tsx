import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../../theme';
import { searchLenders } from '../services/searchLenders';
import { LenderSummary } from '../types';
import { LenderResultCard } from './LenderResultCard';
import { NoResults } from './NoResults';

const PAGE_SIZE = 6;
type Props = { query: string; onOpen: (lender: LenderSummary) => void; onClear: () => void };

export function LenderSearchList({ query, onOpen, onClear }: Props) {
  const [items, setItems] = useState<LenderSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (next: number, replace: boolean) => {
      const id = ++requestId.current;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await searchLenders(query, next, PAGE_SIZE);
        if (id !== requestId.current) return;
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      } catch {
        if (id !== requestId.current) return;
        setError('Could not load lenders. Pull down to try again.');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [query],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchPage(1, true), 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const loadMore = () => {
    if (loading || loadingMore || error || page >= totalPages) return;
    fetchPage(page + 1, false);
  };

  return (
    <View style={{ flex: 1 }}>
      {!loading && !error ? <Text style={s.count}>{total} {total === 1 ? 'lender' : 'lenders'}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
      {loading && items.length === 0 ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <LenderResultCard lender={item} onPress={onOpen} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={loading && items.length > 0} onRefresh={() => fetchPage(1, true)} />}
          ListEmptyComponent={!loading && !error ? <NoResults keyword={query} hasFilters={false} onClear={onClear} /> : null}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary} />
            ) : items.length > 0 && page >= totalPages ? (
              <Text style={s.end}>You have reached the end</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  count: { color: colors.textSecondary, fontSize: 9, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  error: { color: colors.error, fontSize: 10, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  list: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  end: { color: colors.textMuted, fontSize: 9, textAlign: 'center', marginVertical: spacing.md },
});
