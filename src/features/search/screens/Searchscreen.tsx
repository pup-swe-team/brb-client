import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../../theme';
import { ScreenContainer } from '../../../shared/components';
import { FilterModal } from '../components/FilterModal';
import { ListingResultCard } from '../components/ListingResultCard';
import { NoResults } from '../components/NoResults';
import { searchListings } from '../services/searchListings';
import {
  EMPTY_FILTERS,
  Listing,
  PAGE_SIZE,
  SORT_OPTIONS,
  SearchFilters,
  SortOption,
  countActiveFilters,
} from '../types';

export default function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState(''); // debounced keyword
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [filterOpen, setFilterOpen] = useState(false);

  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const activeFilters = countActiveFilters(filters);

  // Debounce the keyword so we don't search on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(keyword), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  const fetchPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++requestId.current;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await searchListings({ keyword: query, filters, sort, page: nextPage, pageSize: PAGE_SIZE });
        if (id !== requestId.current) return; // a newer search replaced this one
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      } catch {
        if (id !== requestId.current) return;
        setError('Could not load listings. Pull down to try again.');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [query, filters, sort],
  );

  // New keyword / filters / sort -> back to page 1.
  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = () => {
    if (loading || loadingMore || error || page >= totalPages) return;
    fetchPage(page + 1, false);
  };

  const clearAll = () => {
    setKeyword('');
    setQuery('');
    setFilters(EMPTY_FILTERS);
    setSort('relevance');
  };

  return (
    <ScreenContainer>
      <View style={s.screen}>
        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Search</Text>
        </View>

        {/* SEARCH BAR + FILTER BUTTON */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search items, books, gear..."
              placeholderTextColor={colors.textMuted}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
              autoCorrect={false}
            />
            {keyword.length > 0 ? (
              <Pressable onPress={() => setKeyword('')} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={s.filterBtn}
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options-outline" size={20} color={colors.white} />
            {activeFilters > 0 ? (
              <View style={s.filterCount}>
                <Text style={s.filterCountText}>{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* SORT */}
        <View style={s.sortBar}>
          {SORT_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              style={[s.sortBtn, sort === o.value && s.sortBtnActive]}
              onPress={() => setSort(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === o.value }}
            >
              <Text style={[s.sortText, sort === o.value && s.sortTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>

        {!loading && !error ? (
          <Text style={s.count}>
            {total} {total === 1 ? 'result' : 'results'}
          </Text>
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* RESULTS */}
        {loading && items.length === 0 ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(l) => l.id}
            renderItem={({ item }) => <ListingResultCard listing={item} /* TODO: open listing details */ />}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={loading && items.length > 0} onRefresh={() => fetchPage(1, true)} />
            }
            ListEmptyComponent={
              !loading && !error ? (
                <NoResults keyword={query} hasFilters={activeFilters > 0} onClear={clearAll} />
              ) : null
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary} />
              ) : items.length > 0 && page >= totalPages ? (
                <Text style={s.end}>You have reached the end</Text>
              ) : null
            }
          />
        )}

        <FilterModal
          visible={filterOpen}
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
        />
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // Same full-bleed trick as ProfileScreen so the header spans the screen.
  screen: {
    flex: 1,
    width: '110%',
    backgroundColor: colors.bg,
    marginLeft: -spacing.lg,
    marginRight: -spacing.lg,
    padding: 0,
  },
  header: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },

  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 12, color: colors.text, paddingVertical: 0 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterCountText: { color: colors.primaryDark, fontSize: 9, fontWeight: '700' },

  sortBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: '#E8EBF0',
    borderRadius: radius.button,
    padding: 2,
  },
  sortBtn: { flex: 1, height: 31, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  sortBtnActive: { backgroundColor: colors.primary },
  sortText: { color: colors.primaryDark, fontSize: 10, fontWeight: '600' },
  sortTextActive: { color: colors.white },

  count: { color: colors.textSecondary, fontSize: 9, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  error: { color: colors.error, fontSize: 10, marginHorizontal: spacing.lg, marginTop: spacing.sm },

  list: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  end: { color: colors.textMuted, fontSize: 9, textAlign: 'center', marginVertical: spacing.md },
});