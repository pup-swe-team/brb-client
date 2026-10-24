import React, { useCallback, useState } from 'react';
import {
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
import { ScreenContainer, AffiliationBadge } from '../../../shared/components';
import { useVerificationGate } from '../../../shared/hooks/useVerificationGate';
import {
  applyForLenderRole,
  extractApiError,
  getCurrentUser,
} from '../../auth/services/authService';
import type { AuthUser } from '../../auth/services/authService';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

type ItemStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Active'
  | 'Overdue'
  | 'Completed'
  | 'Declined';

type BorrowedItem = {
  title: string;
  lender: string;
  date: string;
  status: ItemStatus;
  statusColor: string;
};

const items: BorrowedItem[] = [
  {
    title: 'Basic Calculator',
    lender: 'Danielo Kim R. Ang',
    date: 'Feb. 2 – Feb. 5, 2026',
    status: 'Requested',
    statusColor: colors.gold,
  },
  {
    title: 'Lab Coat (MEDIUM)',
    lender: 'Neo Ervine Y. Geroda',
    date: 'Jan. 28 – Jan. 31, 2026',
    status: 'Confirmed',
    statusColor: colors.success,
  },
  {
    title: 'T-Square',
    lender: 'Aaron Bien De Guzman',
    date: 'Return: Jan. 30, 2026 · 3 days left',
    status: 'Active',
    statusColor: '#4C78E8',
  },
  {
    title: 'Concepts of Programming Languages',
    lender: 'John Ezekiel Lacap',
    date: 'Due Jan. 24, 2026 · 3 days overdue',
    status: 'Overdue',
    statusColor: colors.error,
  },
  {
    title: 'Basic Calculator',
    lender: 'Princess Izzy Dancal',
    date: 'Jan. 6 – Jan. 10, 2026',
    status: 'Completed',
    statusColor: colors.success,
  },
  {
    title: 'T-Square',
    lender: 'Felicity Faith Villeta',
    date: 'Requested Jan. 18, 2026',
    status: 'Declined',
    statusColor: colors.error,
  },
];

function StatusBadge({
  status,
  color,
}: {
  status: ItemStatus;
  color: string;
}) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: color }]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

function SectionTitle({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

function BorrowedItemCard({
  item,
}: {
  item: BorrowedItem;
}) {
  return (
    <Pressable style={styles.itemCard}>
      <View style={styles.itemIcon}>
        <Ionicons
          name="document-text-outline"
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.itemInfo}>
        <Text
          style={styles.itemTitle}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text
          style={styles.itemLender}
          numberOfLines={1}
        >
          from {item.lender}
        </Text>

        <Text
          style={styles.itemDate}
          numberOfLines={2}
        >
          {item.date}
        </Text>
      </View>

      <View style={styles.itemRight}>
        <StatusBadge
          status={item.status}
          color={item.statusColor}
        />

        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
        />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // Real account details from GET /auth/me/ (BE-BUG-0002). The profile card
  // used to hardcode a placeholder synonym (always "Student"); now it renders
  // the caller's own name and affiliation from the backend.
  const [user, setUser] = useState<AuthUser | null>(null);

  // Which half of the profile is on screen. The role is a server-side fact
  // (`lender_status`), so it is read from the account rather than toggled
  // locally -- a Borrower must not be able to flip into the Lender view just
  // by tapping a segment. `isLender` is the authority; the segment only
  // chooses which view to show.
  const [lenderView, setLenderView] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  const isLender = user?.lender_status === 'active';

  // Refetched on focus so edits made in Edit Profile show up when returning.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getCurrentUser()
        .then((account) => {
          if (active) setUser(account);
        })
        .catch(() => {
          if (active) setUser(null);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const applyLender = useCallback(async () => {
    if (applying) return;
    setApplying(true);
    setApplyError('');
    try {
      const updated = await applyForLenderRole();
      setUser(updated);
      setLenderView(true);
    } catch (err) {
      setApplyError(extractApiError(err));
    } finally {
      setApplying(false);
    }
  }, [applying]);

  const displayName = user?.full_name ?? '';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'BRB';

  // Real submission status from GET /identity/documents/list/, refetched on focus
  // so a submission made on VerifyIdentityScreen shows up right after returning.
  const { status: verificationStatus } = useVerificationStatus();

  const { guard, gateModal } = useVerificationGate(verificationStatus);
  const isVerified = verificationStatus === 'Verified';
  const needsVerification =
    verificationStatus === 'Unverified' ||
    verificationStatus === 'Rejected';

  const requestedItems = items.filter(
    (item) => item.status === 'Requested',
  );

  const confirmedItems = items.filter(
    (item) => item.status === 'Confirmed',
  );

  const activeItems = items.filter(
    (item) => item.status === 'Active',
  );

  const overdueItems = items.filter(
    (item) => item.status === 'Overdue',
  );

  const pastItems = items.filter(
    (item) =>
      item.status === 'Completed' ||
      item.status === 'Declined',
  );

  return (
    // Full-bleed screen: the header handles the top inset and the tab bar
    // handles the bottom one, so ScreenContainer adds neither (nor padding).
    <ScreenContainer edges={[]} padded={false}>
      <View style={styles.screen}>
        {/* HEADER */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + spacing.md },
          ]}
        >
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>
            My Profile
          </Text>
          <Pressable
            style={styles.headerAction}
            onPress={() => navigation.navigate('AccountSettings')}
            accessibilityRole="button"
            accessibilityLabel="Profile settings"
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.white}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PROFILE INFORMATION */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {displayName}
              </Text>

              <View style={styles.verifiedRow}>
                {user?.affiliation ? (
                  <AffiliationBadge affiliation={user.affiliation} />
                ) : null}
                {isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={11}
                      color={colors.white}
                    />

                    <Text style={styles.verifiedText}>
                      Verified
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.verifiedBadge,
                      { backgroundColor: colors.textMuted },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={11}
                      color={colors.white}
                    />

                    <Text style={styles.verifiedText}>
                      {verificationStatus === 'Pending'
                        ? 'Under review'
                        : 'Not verified'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.affiliation}>
                {user?.affiliation ?? ''}
              </Text>

              <View style={styles.ratingRow}>
                <Ionicons
                  name="star"
                  size={12}
                  color={colors.gold}
                />

                <Text style={styles.rating}>
                  4.80
                </Text>
              </View>
            </View>
          </View>

          {/* ROLE SWITCH */}
          <View style={styles.roleContainer}>
            <Pressable
              style={[
                styles.roleButton,
                !lenderView &&
                  styles.roleButtonActive,
              ]}
              onPress={() => setLenderView(false)}
            >
              <Text
                style={[
                  styles.roleText,
                  !lenderView &&
                    styles.roleTextActive,
                ]}
              >
                Borrower
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleButton,
                lenderView &&
                  styles.roleButtonActive,
              ]}
              onPress={() => setLenderView(true)}
            >
              <Text
                style={[
                  styles.roleText,
                  lenderView &&
                    styles.roleTextActive,
                ]}
              >
                Lender
              </Text>
            </Pressable>
          </View>

          {/* VERIFY IDENTITY */}
          {needsVerification && (
            <View style={styles.lenderCard}>
              <View style={styles.lenderIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View style={styles.lenderInfo}>
                <Text style={styles.lenderTitle}>
                  {verificationStatus === 'Rejected'
                    ? 'Verification not approved'
                    : 'Verify your identity'}
                </Text>

                <Text style={styles.lenderDescription}>
                  {verificationStatus === 'Rejected'
                    ? 'Upload a new ID to try again'
                    : 'Upload your ID to unlock borrowing and lending'}
                </Text>
              </View>

              <Pressable
                style={styles.applyButton}
                onPress={() => navigation.navigate('VerifyIdentity')}
              >
                <Text style={styles.applyText}>
                  Verify Now
                </Text>
              </Pressable>
            </View>
          )}

          {/* BECOME A LENDER */}
          {!isLender && (
            <View style={styles.lenderCard}>
              <View style={styles.lenderIcon}>
                <Ionicons
                  name="storefront-outline"
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View style={styles.lenderInfo}>
                <Text style={styles.lenderTitle}>
                  Want to become a Lender?
                </Text>

                <Text style={styles.lenderDescription}>
                  Apply for a lender role to start
                  lending items to other students
                </Text>
              </View>

              {applyError ? (
                <Text style={styles.applyError}>{applyError}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.applyButton,
                  styles.applyButtonDisabled,
                ]}
                disabled={true}
              >
                <Text style={styles.applyText}>
                  Apply Now
                </Text>
              </Pressable>
            </View>
          )}

          {/* MY LISTINGS */}
          {isLender && (
            <View style={styles.lenderCard}>
              <View style={styles.lenderIcon}>
                <Ionicons
                  name="albums-outline"
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View style={styles.lenderInfo}>
                <Text style={styles.lenderTitle}>My Listings</Text>

                <Text style={styles.lenderDescription}>
                  Edit, deactivate or delete the items you lend
                </Text>
              </View>

              <Pressable
                style={styles.applyButton}
                onPress={() => navigation.navigate('MyListings')}
              >
                <Text style={styles.applyText}>Manage</Text>
              </Pressable>
            </View>
          )}

          {/* BORROWING PROGRESS */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Borrowing 2 of 3 items
              </Text>

              <Text style={styles.progressLabel}>
                Active and overdue
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          {/* NOTIFICATION */}
          <View style={styles.section}>
            <Text style={styles.notificationTitle}>
              Notification
            </Text>

            <Pressable style={styles.notificationCard}>
              <View style={styles.notificationIcon}>
                <Ionicons
                  name="notifications"
                  size={16}
                  color={colors.error}
                />
              </View>

              <Text
                style={styles.notificationText}
                numberOfLines={1}
              >
                Your Lab Apron has been return by
                Danielo Kim Ang
              </Text>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          {/* REQUESTED */}
          <View style={styles.section}>
            <SectionTitle
              title="Requested"
              count={requestedItems.length}
            />

            {requestedItems.map((item, index) => (
              <BorrowedItemCard
                key={`requested-${index}`}
                item={item}
              />
            ))}
          </View>

          {/* CONFIRMED */}
          <View style={styles.section}>
            <SectionTitle
              title="Confirmed"
              count={confirmedItems.length}
            />

            {confirmedItems.map((item, index) => (
              <BorrowedItemCard
                key={`confirmed-${index}`}
                item={item}
              />
            ))}
          </View>

          {/* ACTIVE */}
          <View style={styles.section}>
            <SectionTitle
              title="Active"
              count={activeItems.length}
            />

            {activeItems.map((item, index) => (
              <BorrowedItemCard
                key={`active-${index}`}
                item={item}
              />
            ))}
          </View>

          {/* OVERDUE */}
          <View style={styles.section}>
            <SectionTitle
              title="Overdue"
              count={overdueItems.length}
            />

            {overdueItems.map((item, index) => (
              <BorrowedItemCard
                key={`overdue-${index}`}
                item={item}
              />
            ))}
          </View>

          {/* PAST */}
          <View style={styles.section}>
            <SectionTitle
              title="Past"
              count={pastItems.length}
            />

            {pastItems.map((item, index) => (
              <BorrowedItemCard
                key={`past-${index}`}
                item={item}
              />
            ))}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {gateModal}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* HEADER */
  header: {
    width: '100%',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  headerSpacer: {
    width: 32,
  },

  headerAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },

  scrollContent: {
    width: '100%',
    paddingBottom: spacing.lg,
  },

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

  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm - 2,
    marginBottom: 3,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success,
    borderRadius: radius.button,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  verifiedText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
  },

  affiliation: {
    color: colors.textSecondary,
    fontSize: 9,
    marginBottom: 3,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  rating: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
  },

  /* ROLE */
  roleContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#E8EBF0',
    borderRadius: radius.button,
    padding: 2,
  },

  roleButton: {
    flex: 1,
    height: 31,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleButtonActive: {
    backgroundColor: colors.primary,
  },

  roleText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '600',
  },

  roleTextActive: {
    color: colors.white,
  },

  /* LENDER / VERIFY CARD */
  lenderCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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

  lenderInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  lenderTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },

  lenderDescription: {
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 12,
  },

  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  applyText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },

  applyButtonDisabled: {
    opacity: 0.6,
  },

  applyError: {
    color: colors.error,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: spacing.xs,
  },

  /* PROGRESS */
  progressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  progressTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  progressLabel: {
    color: colors.textSecondary,
    fontSize: 8,
  },

  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E6E8EC',
    borderRadius: radius.button,
    overflow: 'hidden',
  },

  progressFill: {
    width: '67%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.button,
  },

  /* SECTIONS */
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  notificationTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  countBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: radius.button,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  countText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },

  /* NOTIFICATION */
  notificationCard: {
    minHeight: 38,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },

  notificationIcon: {
    width: 25,
    height: 25,
    borderRadius: radius.button,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  notificationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 8,
  },

  /* ITEM CARD */
  itemCard: {
    minHeight: 65,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  itemIcon: {
    width: 45,
    height: 45,
    borderRadius: radius.input,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  itemInfo: {
    flex: 1,
    paddingRight: spacing.xs,
  },

  itemTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    marginBottom: 2,
  },

  itemLender: {
    color: colors.textSecondary,
    fontSize: 8,
    marginBottom: 2,
  },

  itemDate: {
    color: colors.primaryDark,
    fontSize: 8,
    lineHeight: 11,
  },

  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 1,
    marginLeft: spacing.xs,
  },

  statusBadge: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 55,
    alignItems: 'center',
  },

  statusText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
  },

  bottomSpace: {
    height: spacing.xxl,
  },
});
