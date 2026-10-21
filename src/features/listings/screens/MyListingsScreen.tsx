import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../../theme';
import { ConfirmModal, EmptyState, ScreenContainer } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { CATEGORY_ICON, ListingCategory } from '../constants';
import {
  DELETE_BLOCKED_MESSAGE,
  ListingDeleteBlockedError,
  ManagedListing,
  deleteListing,
  getMyListings,
  setListingActive,
} from '../services/listingsService';

type Dialog =
  | { kind: 'delete'; listing: ManagedListing }
  | { kind: 'deactivate'; listing: ManagedListing }
  | { kind: 'blocked' }
  | null;

export default function MyListingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ManagedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setError('');
    getMyListings()
      .then((l) => active && setItems(l))
      .catch((e) => active && setError(extractApiError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  const askDelete = (l: ManagedListing) => setDialog(l.activeOrders > 0 ? { kind: 'blocked' } : { kind: 'delete', listing: l });

  const confirmDelete = async (l: ManagedListing) => {
    setDialog(null);
    setBusy(true);
    try {
      await deleteListing(l.id);
      setItems((prev) => prev.filter((x) => x.id !== l.id));
    } catch (e) {
      if (e instanceof ListingDeleteBlockedError) setDialog({ kind: 'blocked' });
      else setError(extractApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (l: ManagedListing, active: boolean) => {
    setDialog(null);
    setBusy(true);
    try {
      await setListingActive(l.id, active);
      setItems((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: active ? 'active' : 'inactive' } : x)));
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer edges={['bottom']} padded={false}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={s.headerTitle}>My Listings</Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {error ? <Text style={s.error}>{error}</Text> : null}
          {items.length === 0 && !error ? (
            <EmptyState
              icon="cube-outline"
              title="No listings yet"
              message="Items you list will show up here."
              actionLabel="Create a listing"
              onAction={() => navigation.navigate('Tabs', { screen: 'AddItem' })}
            />
          ) : null}

          {items.map((l) => {
            const inactive = l.status === 'inactive';
            return (
              <View key={l.id} style={s.card}>
                <View style={s.top}>
                  <View style={s.icon}>
                    <Ionicons name={CATEGORY_ICON[l.category as ListingCategory] ?? 'cube-outline'} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.title} numberOfLines={2}>{l.title}</Text>
                    <Text style={s.meta}>{l.category} · {l.pickup}</Text>
                    <Text style={s.meta}>
                      {l.fromDate}{l.untilDate ? ` to ${l.untilDate}` : ' onwards'}
                    </Text>
                    {l.activeOrders > 0 ? (
                      <Text style={s.orders}>{l.activeOrders} open {l.activeOrders === 1 ? 'order' : 'orders'}</Text>
                    ) : null}
                  </View>
                  <View style={[s.badge, inactive ? s.badgeOff : s.badgeOn]}>
                    <Text style={s.badgeText}>{inactive ? 'Inactive' : 'Active'}</Text>
                  </View>
                </View>

                <View style={s.actions}>
                  <Pressable style={s.action} onPress={() => navigation.navigate('EditListing', { listing: l })} disabled={busy} accessibilityRole="button">
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={s.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={s.action}
                    onPress={() => (inactive ? toggleActive(l, true) : setDialog({ kind: 'deactivate', listing: l }))}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Ionicons name={inactive ? 'eye-outline' : 'eye-off-outline'} size={16} color={colors.primary} />
                    <Text style={s.actionText}>{inactive ? 'Reactivate' : 'Deactivate'}</Text>
                  </Pressable>
                  <Pressable style={s.action} onPress={() => askDelete(l)} disabled={busy} accessibilityRole="button">
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[s.actionText, { color: colors.error }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <ConfirmModal
        visible={dialog?.kind === 'delete'}
        title="Delete this listing?"
        message="This permanently removes the listing. It cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => dialog?.kind === 'delete' && confirmDelete(dialog.listing)}
        onCancel={() => setDialog(null)}
      />
      <ConfirmModal
        visible={dialog?.kind === 'deactivate'}
        title="Deactivate this listing?"
        message="It will be hidden from search and nobody can request it. Existing orders are not affected. You can reactivate it anytime."
        confirmLabel="Deactivate"
        onConfirm={() => dialog?.kind === 'deactivate' && toggleActive(dialog.listing, false)}
        onCancel={() => setDialog(null)}
      />
      <ConfirmModal
        visible={dialog?.kind === 'blocked'}
        variant="blocked"
        title="Can't delete this listing"
        message={DELETE_BLOCKED_MESSAGE}
        onCancel={() => setDialog(null)}
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  error: { color: colors.error, fontSize: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  icon: { width: 45, height: 45, borderRadius: radius.input, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 13, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 10 },
  orders: { color: colors.primaryDark, fontSize: 10, fontWeight: '600' },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeOn: { backgroundColor: colors.success },
  badgeOff: { backgroundColor: colors.textMuted },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 36 },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
