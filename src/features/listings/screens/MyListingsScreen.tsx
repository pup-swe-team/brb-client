
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../../theme';
import {
  Button,
  ConfirmModal,
  EmptyState,
  ScreenContainer,
} from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { getMyOrders } from '../../orders/services/ordersService';
import type { Order } from '../../../shared/types';
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
      .then((listings) => {
        if (active) setItems(listings);
      })
      .catch((e) => {
        if (active) setError(extractApiError(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  const askDelete = (listing: ManagedListing) => {
    setDialog(
      listing.activeOrders > 0
        ? { kind: 'blocked' }
        : { kind: 'delete', listing },
    );
  };

  const confirmDelete = async (listing: ManagedListing) => {
    setDialog(null);
    setBusy(true);

    try {
      await deleteListing(listing.id);
      setItems((prev) => prev.filter((item) => item.id !== listing.id));
    } catch (e) {
      if (e instanceof ListingDeleteBlockedError) {
        setDialog({ kind: 'blocked' });
      } else {
        setError(extractApiError(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (
    listing: ManagedListing,
    active: boolean,
  ) => {
    setDialog(null);
    setBusy(true);

    try {
      await setListingActive(listing.id, active);
      setItems((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? { ...item, status: active ? 'active' : 'inactive' }
            : item,
        ),
      );
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setBusy(false);
    }
  };

  // Show orders belonging to this listing from the lender's perspective.
  // Current mock data links orders by title, not listing ID.
  const viewOrders = async (listing: ManagedListing) => {
    setBusy(true);

    try {
      const orders = await getMyOrders('Lender');

      const matchingOrders = orders.filter(
        (order: Order) => order.listingTitle === listing.title,
      );

      if (matchingOrders.length === 0) {
        Alert.alert(
          'No orders found',
          `There are currently no lender orders matching "${listing.title}".`,
        );
        return;
      }

      // Prefer orders that still need action.
      const priority: Record<string, number> = {
        Requested: 0,
        Confirmed: 1,
        Active: 2,
        Overdue: 3,
        Disputed: 4,
        Completed: 5,
        Declined: 6,
        Cancelled: 7,
      };

      const sortedOrders = [...matchingOrders].sort(
        (a, b) =>
          (priority[a.status] ?? 99) - (priority[b.status] ?? 99),
      );

      if (sortedOrders.length > 1) {
        Alert.alert(
          'Multiple orders found',
          `Found ${sortedOrders.length} orders for "${listing.title}". Opening the order that needs attention first.`,
        );
      }

      const selectedOrder = sortedOrders[0];

      navigation.navigate('OrderDetail', {
        orderId: selectedOrder.id,
        role: 'Lender',
      });
    } catch (e) {
      Alert.alert(
        'Unable to load orders',
        extractApiError(e),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer edges={['bottom']} padded={false}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </Pressable>

        <Text style={s.headerTitle}>My Listings</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={s.error}>{error}</Text> : null}

          {items.length === 0 && !error ? (
            <EmptyState
              icon="cube-outline"
              title="No listings yet"
              message="Items you list will show up here."
              actionLabel="Create a listing"
              onAction={() =>
                navigation.navigate('Tabs', { screen: 'AddItem' })
              }
            />
          ) : null}

          {items.map((listing) => {
            const inactive = listing.status === 'inactive';

            return (
              <View key={listing.id} style={s.card}>
                <View style={s.top}>
                  <View style={s.icon}>
                    <Ionicons
                      name={
                        CATEGORY_ICON[
                          listing.category as ListingCategory
                        ] ?? 'cube-outline'
                      }
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.title} numberOfLines={2}>
                      {listing.title}
                    </Text>

                    <Text style={s.meta}>
                      {listing.category} · {listing.pickup}
                    </Text>

                    <Text style={s.meta}>
                      {listing.fromDate}
                      {listing.untilDate
                        ? ` to ${listing.untilDate}`
                        : ' onwards'}
                    </Text>

                    {listing.activeOrders > 0 ? (
                      <Text style={s.orders}>
                        {listing.activeOrders}{' '}
                        {listing.activeOrders === 1
                          ? 'open order'
                          : 'open orders'}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      s.badge,
                      inactive ? s.badgeOff : s.badgeOn,
                    ]}
                  >
                    <Text style={s.badgeText}>
                      {inactive ? 'Inactive' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={s.actions}>
                  <Pressable
                    style={s.action}
                    onPress={() =>
                      navigation.navigate('EditListing', { listing })
                    }
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={s.actionText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={s.action}
                    onPress={() =>
                      inactive
                        ? toggleActive(listing, true)
                        : setDialog({ kind: 'deactivate', listing })
                    }
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={inactive ? 'eye-outline' : 'eye-off-outline'}
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={s.actionText}>
                      {inactive ? 'Reactivate' : 'Deactivate'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={s.action}
                    onPress={() => askDelete(listing)}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.error}
                    />
                    <Text style={[s.actionText, { color: colors.error }]}>
                      Delete
                    </Text>
                  </Pressable>
                </View>

                <View style={s.viewOrders}>
                  <Button
                    title="View Orders"
                    variant="secondary"
                    compact
                    disabled={busy}
                    onPress={() => viewOrders(listing)}
                  />
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
        onConfirm={() =>
          dialog?.kind === 'delete' && confirmDelete(dialog.listing)
        }
        onCancel={() => setDialog(null)}
      />

      <ConfirmModal
        visible={dialog?.kind === 'deactivate'}
        title="Deactivate this listing?"
        message="It will be hidden from search and nobody can request it. Existing orders are not affected. You can reactivate it anytime."
        confirmLabel="Deactivate"
        onConfirm={() =>
          dialog?.kind === 'deactivate' &&
          toggleActive(dialog.listing, false)
        }
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
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: radius.input,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  orders: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '600',
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeOn: {
    backgroundColor: colors.success,
  },
  badgeOff: {
    backgroundColor: colors.textMuted,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  viewOrders: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
