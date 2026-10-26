import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SlotPlaceholder } from '../../../shared/components';
import { colors, radius, spacing } from '../../../theme';
import { IncomingRequestsSection } from './IncomingRequestsSection';

// OWNER: Member A. CP-203 Build Lender Dashboard shell (HTML 22, 23).
// ProfileScreen renders this when the Lender view is selected. Sections, top to bottom:
//   1. Stats: average rating, listings, lent            (TODO Member A)
//   2. My Listings: the card below links to MyListingsScreen (move it into the real section)
//   3. Incoming Requests: <IncomingRequestsSection />   (CP-502, Member B owns the component)
//   4. Ongoing Lends                                    (TODO Member A)
//   5. Past Orders                                      (TODO Member A)
// Empty state: HTML 23. Use OverdueIndicator (CP-506) wherever an order is overdue or unreturned.
export function LenderDashboard({ navigation }: { navigation: any }) {
  return (
    <View style={s.wrap}>
      <SlotPlaceholder ticket="CP-203" owner="Member A" label="Lender stats + Ongoing Lends + Past Orders" />

      {/* MY LISTINGS (moved here from ProfileScreen, unchanged) */}
      <View style={s.lenderCard}>
        <View style={s.lenderIcon}>
          <Ionicons name="albums-outline" size={23} color={colors.primary} />
        </View>
        <View style={s.lenderInfo}>
          <Text style={s.lenderTitle}>My Listings</Text>
          <Text style={s.lenderDescription}>Edit, deactivate or delete the items you lend</Text>
        </View>
        <Pressable style={s.applyButton} onPress={() => navigation.navigate('MyListings')}>
          <Text style={s.applyText}>Manage</Text>
        </Pressable>
      </View>

      <IncomingRequestsSection navigation={navigation} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  lenderCard: {
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lenderIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  lenderInfo: { flex: 1, paddingRight: spacing.sm },
  lenderTitle: { color: colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  lenderDescription: { color: colors.textSecondary, fontSize: 8, lineHeight: 12 },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
