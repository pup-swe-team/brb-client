import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { colors, radius, spacing, text } from '../../../theme';
import { BlockedModal, ConfirmModal, EmptyState } from '../../../shared/components';
import { extractApiError } from '../../auth/services/authService';
import { InlineBanner } from '../../profile/components/InlineBanner';
import {
  ListingDeletionBlockedError,
  deleteListing,
  formatPricePerDay,
  getMyListings,
  setListingActive,
} from '../services/listingManagementService';
import type { ManagedListing } from '../services/listingManagementService';
import { ListingOptionsSheet } from './ListingOptionsSheet';

type Props = { navigation: any };

type ListingStatusPillProps = { status: ManagedListing['status'] };

// Icon + label + color (never color alone).
function ListingStatusPill({ status }: ListingStatusPillProps) {
  const active = status === 'Active';
  const color = active ? colors.success : colors.textMuted;
  return (
    <View style={[s.pill, { borderColor: color }]}>
      <Ionicons
        name={active ? 'checkmark-circle-outline' : 'pause-circle-outline'}
        size={14}
        color={color}
      />
      <Text style={[s.pillLabel, { color }]}>{status}</Text>
    </View>
  );
}

// Lender's "My Listings" list with the edit / deactivate / delete controls.
// Flows: options sheet -> Edit, Deactivate (confirm), Delete (confirm, or the
// blocked message when the listing has a Confirmed or Active order).
export function MyListingsSection({ navigation }: Props) {
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<ManagedListing | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ManagedListing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedListing | null>(null);
  const [blockedTarget, setBlockedTarget] = useState<ManagedListing | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyListings()
        .then((rows) => {
          if (active) {
            setListings(rows);
            setError('');
          }
        })
        .catch((err) => {
          if (active) setError(extractApiError(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  function handleEdit() {
    const listing = selected;
    setSelected(null);
    if (!listing) return;
    // The create-listing form doubles as the edit form: it reads params.listingId.
    navigation.navigate('Tabs', { screen: 'AddItem', params: { listingId: listing.id } });
  }

  function handleToggleActive() {
    const listing = selected;
    setSelected(null);
    if (!listing) return;
    if (listing.status === 'Active') {
      setDeactivateTarget(listing); // Deactivating asks first.
    } else {
      applyActive(listing, true); // Reactivating is harmless: no confirm.
    }
  }

  async function applyActive(listing: ManagedListing, active: boolean) {
    setDeactivateTarget(null);
    try {
      setListings(await setListingActive(listing.id, active));
      setError('');
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  function handleDelete() {
    const listing = selected;
    setSelected(null);
    if (listing) setDeleteTarget(listing);
  }

  async function confirmDelete() {
    const listing = deleteTarget;
    setDeleteTarget(null);
    if (!listing) return;
    try {
      setListings(await deleteListing(listing.id));
      setError('');
    } catch (err) {
      if (err instanceof ListingDeletionBlockedError) {
        setBlockedTarget(listing);
      } else {
        setError(extractApiError(err));
      }
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={text.title}>My Listings</Text>

      {error ? <InlineBanner variant="error" message={error} /> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No listings yet"
          message="Items you add will show up here."
        />
      ) : (
        listings.map((listing) => (
          <View key={listing.id} style={s.card}>
            <View style={s.icon}>
              <Ionicons name="book-outline" size={22} color={colors.primary} />
            </View>
            <View style={s.info}>
              <Text style={text.title} numberOfLines={2}>
                {listing.title}
              </Text>
              <Text style={text.caption}>{formatPricePerDay(listing.pricePerDay)}</Text>
              <ListingStatusPill status={listing.status} />
            </View>
            <Pressable
              onPress={() => setSelected(listing)}
              accessibilityRole="button"
              accessibilityLabel={`Options for ${listing.title}`}
              hitSlop={spacing.sm}
              style={s.more}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        ))
      )}

      <ListingOptionsSheet
        listing={selected}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onClose={() => setSelected(null)}
      />

      {/* Screen 52: deactivate confirm */}
      <ConfirmModal
        visible={!!deactivateTarget}
        title="Deactivate this listing?"
        message="It will be hidden from search and can’t be requested. Existing orders aren’t affected. You can reactivate it anytime."
        confirmLabel="Deactivate"
        onConfirm={() => deactivateTarget && applyActive(deactivateTarget, false)}
        onCancel={() => setDeactivateTarget(null)}
      />

      {/* Delete confirm */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete this listing?"
        message="This permanently removes the listing. This can’t be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Screen 53: blocked deletion */}
      <BlockedModal
        visible={!!blockedTarget}
        title="Can’t delete this listing"
        message="It has a Confirmed or Active order. Finish or cancel the order first, then try again."
        actionLabel="View Orders"
        onAction={() => {
          setBlockedTarget(null);
          navigation.navigate('Tabs', { screen: 'Profile' });
        }}
        onClose={() => setBlockedTarget(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.card,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: spacing.xs },
  more: { padding: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.white,
  },
  pillLabel: { fontSize: 12, fontWeight: '600' },
});
