import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ScreenContainer,
  AffiliationBadge,
  ConfirmModal,
  EmptyState,
  StatusBadge,
} from '../../../shared/components';
import type { Order, OrderStatus } from '../../../shared/types';
import { useVerificationGate } from '../../../shared/hooks/useVerificationGate';
import { getCurrentUser } from '../../auth/services/authService';
import type { AuthUser } from '../../auth/services/authService';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { DashboardSwitch } from '../../dashboard/components/DashboardSwitch';
import { LenderDashboard } from '../../dashboard/components/LenderDashboard';
import { OverdueIndicator } from '../../dashboard/components/OverdueIndicator';
import { BORROWING_LIMIT, getMyOrders } from '../../orders/services/ordersService';
import { applyForLenderRole, getLenderRoleStatus } from '../services/lenderRoleService';

// CP-201: Borrower dashboard sections, in display order (HTML 20).
const SECTIONS: { title: string; statuses: OrderStatus[] }[] = [
  { title: 'Requested', statuses: ['Requested'] },
  { title: 'Confirmed', statuses: ['Confirmed'] },
  { title: 'Active', statuses: ['Active'] },
  { title: 'Overdue', statuses: ['Overdue', 'Unreturned'] },
  {
    title: 'Past',
    statuses: ['Completed', 'Declined', 'Expired', 'Cancelled', 'Returned', 'Disputed'],
  },
];

const MONTHS = [
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
  'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
];

function parseDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function formatDay(iso: string, withYear: boolean) {
  const { y, m, d } = parseDay(iso);
  const base = `${MONTHS[m - 1]} ${d}`;
  return withYear ? `${base}, ${y}` : base;
}

function formatRange(start: string, end: string) {
  const sameYear = parseDay(start).y === parseDay(end).y;
  return `${formatDay(start, !sameYear)} – ${formatDay(end, true)}`;
}

// Whole days from today to the given yyyy-mm-dd date (negative when in the past).
function daysUntil(iso: string) {
  const { y, m, d } = parseDay(iso);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

function dayCount(n: number) {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

function dateLine(order: Order) {
  switch (order.status) {
    case 'Active': {
      const left = daysUntil(order.endDate);
      const base = `Return: ${formatDay(order.endDate, true)}`;
      return left >= 0 ? `${base} · ${dayCount(left)} left` : base;
    }
    case 'Declined':
    case 'Expired':
      return `Requested ${formatDay(order.startDate, true)}`;
    default:
      return formatRange(order.startDate, order.endDate);
  }
}

function overdueDetail(order: Order) {
  const late = Math.max(1, -daysUntil(order.endDate));
  return `Due ${formatDay(order.endDate, true)} · ${dayCount(late)} overdue`;
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
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.itemCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${order.listingTitle}, ${order.status}`}
    >
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
          {order.listingTitle}
        </Text>

        <Text
          style={styles.itemLender}
          numberOfLines={1}
        >
          from {order.counterpart}
        </Text>

        {order.status === 'Overdue' || order.status === 'Unreturned' ? (
          <OverdueIndicator
            status={order.status}
            detail={overdueDetail(order)}
          />
        ) : (
          <Text
            style={styles.itemDate}
            numberOfLines={2}
          >
            {dateLine(order)}
          </Text>
        )}
      </View>

      <View style={styles.itemRight}>
        <View style={styles.itemBadge}>
          <StatusBadge status={order.status} />
        </View>

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
  const [role, setRole] = useState<'Borrower' | 'Lender'>(
    'Borrower',
  );

  // Real account details from GET /auth/me/ (BE-BUG-0002). The profile card
  // used to hardcode a placeholder synonym (always "Student"); now it renders
  // the caller's own name and affiliation from the backend.
  const [user, setUser] = useState<AuthUser | null>(null);

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

  // CP-201: the signed-in user's Borrower orders. null = not loaded yet.
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState('');

  const fetchOrders = useCallback(() => {
    let active = true;
    getMyOrders('Borrower')
      .then((loaded) => {
        if (active) {
          setOrders(loaded);
          setOrdersError('');
        }
      })
      .catch(() => {
        if (active) setOrdersError('We couldn’t load your orders. Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  // Reloaded on focus so a cancelled order or a new request shows up on return.
  useFocusEffect(fetchOrders);

  const retryOrders = () => {
    setOrdersError('');
    setOrders(null);
    fetchOrders();
  };

  // CP-1003: Lender role application. null = status not known yet (card hidden).
  const [isLender, setIsLender] = useState<boolean | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLenderRoleStatus()
        .then(({ isLender: lender }) => {
          if (active) setIsLender(lender);
        })
        .catch(() => {
          if (active) setIsLender(null);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  // The success message disappears on its own.
  useEffect(() => {
    if (!applyMessage) return;
    const timer = setTimeout(() => setApplyMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [applyMessage]);

  const handleApply = async () => {
    setApplyOpen(false);
    setApplying(true);
    setApplyError('');
    try {
      await applyForLenderRole();
      setIsLender(true);
      setApplyMessage('You’re now a Lender. You can start posting items.');
      setRole('Lender');
    } catch {
      setApplyError('We couldn’t submit your application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

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

  // Borrowing limit counts Active and Overdue orders (HTML 20, 43).
  const borrowingCount = (orders ?? []).filter(
    (order) => order.status === 'Active' || order.status === 'Overdue',
  ).length;
  const atLimit = borrowingCount >= BORROWING_LIMIT;
  const fillPercent = Math.min(100, (borrowingCount / BORROWING_LIMIT) * 100);

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

          {/* ROLE SWITCH (CP-203, Member A edits DashboardSwitch) */}
          <DashboardSwitch role={role} onChange={setRole} hasLenderRole={isLender === true} />

          {/* LENDER APPLICATION RESULT (CP-1003) */}
          {applyMessage ? (
            <View
              style={[styles.banner, { borderColor: colors.success }]}
              accessibilityRole="alert"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={colors.success}
              />
              <Text style={styles.bannerText}>{applyMessage}</Text>
            </View>
          ) : null}

          {applyError ? (
            <View
              style={[styles.banner, { borderColor: colors.error }]}
              accessibilityRole="alert"
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text style={styles.bannerText}>{applyError}</Text>
            </View>
          ) : null}

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
          {role === 'Borrower' && isLender === false && (
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

              <Pressable
                style={[styles.applyButton, applying && styles.applyButtonBusy]}
                onPress={() =>
                  guard(() => {
                    setApplyError('');
                    setApplyOpen(true);
                  })
                }
                disabled={applying}
                accessibilityRole="button"
                accessibilityState={{ busy: applying, disabled: applying }}
              >
                {applying ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.applyText}>
                    Apply Now
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* LENDER DASHBOARD (CP-203, Member A edits LenderDashboard) */}
          {role === 'Lender' && (
            <LenderDashboard navigation={navigation} />
          )}

          {/* BORROWER DASHBOARD (CP-201, Danielo) */}
          {role === 'Borrower' && (
            <>
              {/* BORROWING PROGRESS */}
              {orders !== null && (
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>
                      Borrowing {borrowingCount} of {BORROWING_LIMIT} items
                    </Text>

                    <Text style={styles.progressLabel}>
                      Active and overdue
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${fillPercent}%`,
                          backgroundColor: atLimit
                            ? colors.error
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>

                  {atLimit && (
                    <View style={styles.limitRow}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={12}
                        color={colors.error}
                      />

                      <Text style={styles.limitText}>
                        Limit reached
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

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

          {role === 'Borrower' && (
            <>
              {ordersError ? (
                <EmptyState
                  icon="alert-circle-outline"
                  title="Orders unavailable"
                  message={ordersError}
                  actionLabel="Try Again"
                  onAction={retryOrders}
                />
              ) : orders === null ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={styles.loader}
                />
              ) : orders.length === 0 ? (
                <EmptyState
                  icon="file-tray-outline"
                  title="No orders yet"
                  message="Items you request will show up here."
                  actionLabel="Browse Items"
                  onAction={() => navigation.navigate('Search')}
                />
              ) : (
                SECTIONS.map(({ title, statuses }) => {
                  const group = orders.filter((order) =>
                    statuses.includes(order.status),
                  );
                  if (group.length === 0) return null;

                  return (
                    <View key={title} style={styles.section}>
                      <SectionTitle
                        title={title}
                        count={group.length}
                      />

                      {group.map((order) => (
                        <BorrowedItemCard
                          key={order.id}
                          order={order}
                          onPress={() =>
                            navigation.navigate('OrderDetail', {
                              orderId: order.id,
                              role: 'Borrower',
                            })
                          }
                        />
                      ))}
                    </View>
                  );
                })
              )}
            </>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>

        {gateModal}

        <ConfirmModal
          visible={applyOpen}
          title="Apply for Lender role?"
          message="You’ll be able to post items and lend them to other Iskolars. You can still borrow as usual."
          confirmLabel="Apply"
          onConfirm={handleApply}
          onCancel={() => setApplyOpen(false)}
        />
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

  applyButtonBusy: {
    opacity: 0.7,
  },

  applyText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
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
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.button,
  },

  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },

  limitText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '700',
  },

  /* APPLY RESULT BANNER */
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  bannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 10,
    lineHeight: 14,
  },

  loader: {
    marginTop: spacing.xxl,
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

  itemBadge: {
    alignItems: 'flex-end',
  },

  bottomSpace: {
    height: spacing.xxl,
  },
});