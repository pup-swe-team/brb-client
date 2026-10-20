import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../../theme';
import { Button, ScreenContainer } from '../../../shared/components';
import { VerifiedBadge } from '../../../shared/components/VerifiedLabel';
import { LenderListingCard } from '../components/LenderListingCard';
import { LenderReviewCard } from '../components/LenderReviewCard';
import { StarRating } from '../components/StarRating';
import { PublicLenderProfile, getLenderProfile } from '../services/lenderProfile';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function memberSince(d: string) {
  const [y, m] = d.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function Shell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <ScreenContainer>
      <View style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={onBack} hitSlop={12} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <Text style={s.headerTitle}>Lender Profile</Text>
        </View>
        {children}
      </View>
    </ScreenContainer>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.countBadge}>
        <Text style={s.countText}>{count}</Text>
      </View>
    </View>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

// Route param: { lenderId: string }. Falls back to 'u1' so the screen also opens without params while testing.
export default function LenderProfileScreen({ navigation, route }: any) {
  const lenderId: string = route?.params?.lenderId ?? 'u1';
  const goBack = () => navigation?.goBack?.();

  const [lender, setLender] = useState<PublicLenderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLenderProfile(lenderId)
      .then((data) => {
        if (active) setLender(data);
      })
      .catch(() => {
        if (active) setError('Could not load this lender profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lenderId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    getLenderProfile(lenderId)
      .then((data) => setLender(data))
      .catch(() => setError('Could not load this lender profile.'))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <Shell onBack={goBack}>
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Shell>
    );
  }

  if (error || !lender) {
    return (
      <Shell onBack={goBack}>
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{error ?? 'Lender not found.'}</Text>
          <Button title="Try again" variant="secondary" onPress={handleRetry} />
        </View>
      </Shell>
    );
  }

  const hasRatings = lender.reviewCount > 0;

  return (
    <Shell onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* PROFILE INFORMATION */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(lender.fullName)}</Text>
          </View>

          <View style={s.profileInfo}>
            <Text style={s.name}>{lender.fullName}</Text>

            {lender.verified ? (
              <View style={s.badgeRow}>
                <VerifiedBadge />
              </View>
            ) : null}

            <Text style={s.affiliation}>
              {lender.affiliation}
              {lender.program ? ` · ${lender.program}` : ''}
            </Text>

            <View style={s.ratingRow}>
              {hasRatings ? (
                <>
                  <StarRating value={lender.rating} />
                  <Text style={s.rating}>
                    {lender.rating.toFixed(1)} ({lender.reviewCount} {lender.reviewCount === 1 ? 'review' : 'reviews'})
                  </Text>
                </>
              ) : (
                <Text style={s.rating}>No ratings yet</Text>
              )}
            </View>

            <Text style={s.since}>Member since {memberSince(lender.memberSince)}</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsCard}>
          <View style={s.stat}>
            <Text style={s.statValue}>{hasRatings ? lender.rating.toFixed(1) : '–'}</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
          <View style={[s.stat, s.statMid]}>
            <Text style={s.statValue}>{lender.reviewCount}</Text>
            <Text style={s.statLabel}>Reviews</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{lender.listings.length}</Text>
            <Text style={s.statLabel}>Active listings</Text>
          </View>
        </View>

        {/* ACTIVE LISTINGS */}
        <View style={s.section}>
          <SectionTitle title="Active listings" count={lender.listings.length} />
          {lender.listings.length === 0 ? (
            <EmptyBlock text="No active listings right now." />
          ) : (
            lender.listings.map((l) => (
              <LenderListingCard
                key={l.id}
                listing={l}
                onPress={() =>
                  navigation?.navigate?.('ItemDetail', {
                    item: {
                      id: l.id,
                      title: l.title,
                      category: l.category,
                      location: l.location,
                      lenderName: lender.fullName,
                      author: lender.fullName,
                      rating: String(lender.rating),
                      price: 'FREE',
                    },
                  })
                }
              />
            ))
          )}
        </View>

        {/* REVIEWS */}
        <View style={s.section}>
          <SectionTitle title="Reviews" count={lender.reviewCount} />
          {lender.reviews.length === 0 ? (
            <EmptyBlock text="No reviews yet." />
          ) : (
            lender.reviews.map((r) => <LenderReviewCard key={r.id} review={r} />)
          )}
        </View>
      </ScrollView>
    </Shell>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },

  content: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md },
  errorText: { color: colors.error, fontSize: 11, textAlign: 'center' },

  /* PROFILE */
  profileCard: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: 13, fontWeight: '700' },
  badgeRow: { flexDirection: 'row' },
  affiliation: { color: colors.textSecondary, fontSize: 9 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rating: { color: colors.text, fontSize: 9, fontWeight: '600' },
  since: { color: colors.textMuted, fontSize: 8 },

  /* STATS */
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statValue: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 8 },

  /* SECTIONS */
  section: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  countBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: radius.button,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { color: colors.primary, fontSize: 9, fontWeight: '700' },

  empty: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { color: colors.textSecondary, fontSize: 10 },
});