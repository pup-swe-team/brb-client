import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import { VerifiedLabel } from '../../../shared/components';
import { useVerificationStatus } from '../../profile/hooks/useVerificationStatus';
import { PublicLenderProfile, getLenderProfile } from '../../profile/services/lenderProfile';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { BorrowRequestError, createBorrowRequest } from '../../orders/services/ordersService';
import { ReportButton } from '../../reports/components/ReportButton';
import { http, USE_MOCK } from '../../../services/http';
import { getCurrentUser } from '../../auth/services/authService';
import { addDaysISO, formatDurationDays, parseDurationDays } from '../constants';

// Only one overlay is ever shown at a time. iOS cannot present a second <Modal> while another is
// still on screen, so request / confirm / error / success all live inside ONE <Modal> and we just
// switch which card it shows.
type Overlay = 'none' | 'verify' | 'request' | 'confirm' | 'error' | 'success';
type ReservedDateRange = {
  startDate: string;
  endDate: string;
};
type CalendarPickerProps = {
  visible: boolean;
  selectedDate: string;
  minDate?: string;
  maxDate?: string;
  hint?: string;
  availableFrom?: string;
  availableTo?: string;
  reservedRanges?: ReservedDateRange[];
  onClose: () => void;
  onSelect: (date: string) => void;
};
function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
// Number of days from start to end, counting both days (Nov 1 to Nov 3 = 3 days).
function inclusiveDays(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number);
  const [ye, me, de] = end.split('-').map(Number);
  return Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86400000) + 1;
}
export default function ItemDetailScreen({ navigation, route }: any) {
  const item = route?.params?.item ?? {};
  const insets = useSafeAreaInsets();
  const itemId = item?.id || route?.params?.id;
  const [detailData, setDetailData] = useState<any>(null);
  // Bumped after a date_conflict so the calendar reloads the latest blocked_dates.
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (!itemId) return;
    let active = true;
    http.get(`/listings/${itemId}/`)
      .then((res) => {
        if (active && res.data) {
          setDetailData(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [itemId, reloadKey]);
  const title = detailData?.title || item.title || 'Untitled listing';
  const author = detailData?.lender?.full_name || item.author || '';
  const price = detailData?.rate_per_day
    ? (Number(detailData.rate_per_day) > 0 ? `₱${detailData.rate_per_day} / day` : 'FREE')
    : (item.price || 'FREE');
  const isFree = String(price).trim().toUpperCase() === 'FREE';
  const mediaBase = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '');
  const detailPhotos: string[] = (detailData?.photos || []).map((p: any) => {
    const raw = p.file_reference || p.photo || p.url;
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `${mediaBase}${raw.startsWith('/') ? '' : '/'}${raw}`;
  }).filter(Boolean);
  const photos: string[] = detailPhotos.length
    ? detailPhotos
    : (item.photos?.length
      ? item.photos
      : [
          item.image ||
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=900',
        ]);
  const { width: screenWidth } = useWindowDimensions();
  const [photoIndex, setPhotoIndex] = useState(0);
  // Availability window of this listing (YYYY-MM-DD). Missing = no restriction.
  const availableFrom: string | undefined = detailData?.availability_windows?.[0]?.start_date || item.availableFrom;
  const availableTo: string | undefined = detailData?.availability_windows?.[0]?.end_date || item.availableTo;
  // GET /listings/{id}/ returns blocked_dates: [{ start_date, end_date, reason }] (inclusive).
  // The backend merges lender blocks, confirmed, active and overdue orders into it, so any date
  // inside a range is disabled. reserved_date_ranges is kept as a fallback for older payloads.
  const reservedRanges: ReservedDateRange[] = (
    detailData?.blocked_dates ?? detailData?.reserved_date_ranges ?? item.reservedRanges ?? []
  )
    .map((range: any) => ({
      startDate: String(range?.start_date ?? range?.startDate ?? ''),
      endDate: String(range?.end_date ?? range?.endDate ?? ''),
    }))
    .filter((range: ReservedDateRange) => range.startDate && range.endDate);
  // Lender's max rental length (days), set on the Create Listing form. Missing = no limit.
  const maxDurationDays = parseDurationDays(
    detailData?.max_duration_days ?? detailData?.max_duration ?? item.maxDurationDays ?? item.duration,
  );
  // Latest return date allowed for a given check-out date: capped by the lender's max duration and
  // by the next reservation, so a rental can never run across someone else's dates.
  const latestReturnFor = (start: string): string | undefined => {
    let limit: string | undefined;
    if (maxDurationDays) limit = addDaysISO(start, maxDurationDays - 1);
    const nextReserved = reservedRanges
      .map((range) => range.startDate)
      .filter((date) => date > start)
      .sort()[0];
    if (nextReserved) {
      const dayBefore = addDaysISO(nextReserved, -1);
      if (!limit || dayBefore < limit) limit = dayBefore;
    }
    return limit;
  };
  const lenderId: string | undefined = (detailData?.lender?.id != null ? String(detailData.lender.id) : undefined) || item.lenderId;
  const displayDescription = detailData?.description || item.description;
  // Identity status decides whether the person may send a request.
  const { status: verificationStatus, loading: statusLoading } = useVerificationStatus();
  // Lender summary + reviews come from the lender's public profile.
  const [lender, setLender] = useState<PublicLenderProfile | null>(null);
  useEffect(() => {
    if (!lenderId) return;
    let active = true;
    getLenderProfile(lenderId)
      .then((p) => active && setLender(p))
      .catch(() => {
        // Keep the summary from the listing params.
      });
    return () => {
      active = false;
    };
  }, [lenderId]);
  
const reviews = (lender?.reviews ?? []).filter(
  (review) =>
    review.itemTitle.trim().toLowerCase() ===
    title.trim().toLowerCase()
);

const reviewTotal = reviews.length;

const countFor = (stars: number) =>
  reviews.filter((review) => review.rating === stars).length;

const barWidth = (stars: number): `${number}%` =>
  `${reviewTotal
    ? Math.round((countFor(stars) / reviewTotal) * 100)
    : 0}%`;

  const [checkout, setCheckout] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [calendarTarget, setCalendarTarget] = useState<'checkout' | 'return'>(
    'checkout',
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Request failed');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  // Which overlay the error's OK button goes back to ('none' = just close).
  const [errorReturnTo, setErrorReturnTo] = useState<Overlay>('none');

  const showRequestError = (title: string, message: string, returnTo: Overlay = 'none') => {
    setErrorReturnTo(returnTo);
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    // Replaces whatever overlay is open (request / confirm) instead of stacking a second Modal.
    setOverlay('error');
  };
  // Used to stop a lender from requesting their own listing before any overlay opens.
  useEffect(() => {
    if (USE_MOCK) return;
    let active = true;
    getCurrentUser()
      .then((user) => active && setCurrentUserId(String(user.id)))
      .catch(() => {
        // Not fatal: the server still rejects own-listing requests (code: own_listing).
      });
    return () => {
      active = false;
    };
  }, []);
  const [bookmarked, setBookmarked] = useState(false);
  const openCalendar = (target: 'checkout' | 'return') => {
    if (target === 'return' && !checkout) {
      showRequestError(
        'Choose a check-out date first',
        'Pick your check-out date before choosing a return date, so we can show how long you can keep the item.',
      );
      return;
    }
    setCalendarTarget(target);
    setCalendarVisible(true);
  };
  const selectDate = (date: string) => {
    if (calendarTarget === 'checkout') {
      setCheckout(date);
      // Drop the return date if it no longer fits (before the new start, past the max duration,
      // or across another reservation).
      const latest = latestReturnFor(date);
      if (returnDate && (returnDate < date || (latest && returnDate > latest))) {
        setReturnDate('');
      }
    } else {
      setReturnDate(date);
    }
    setCalendarVisible(false);
  };
  const isListingUnavailable = detailData?.is_available === false;
  const openRequest = () => {
    if (statusLoading) return;
    if (isListingUnavailable) {
      showRequestError('Listing unavailable', 'This listing is not available right now.');
      return;
    }
    if (currentUserId && lenderId && currentUserId === lenderId) {
      showRequestError(
        'Cannot borrow your own listing',
        'You cannot send a borrow request for an item that you listed yourself.',
      );
      return;
    }
    // Only verified users can send a request.
    if (verificationStatus !== 'Verified') {
      setOverlay('verify');
      return;
    }
    if (!checkout || !returnDate) {
      showRequestError('Choose your dates', 'Pick a check-out and return date before sending a request.');
      return;
    }
    setOverlay('request');
  };
  const verifyCopy =
    verificationStatus === 'Pending'
      ? { title: 'Verification in review', message: 'Your ID is still being reviewed. You can request items once you are verified.', action: '' }
      : verificationStatus === 'Rejected'
        ? { title: 'Verification not approved', message: 'Your ID was not approved. Upload a new ID to request items.', action: 'Upload New ID' }
        : { title: 'Verify your identity first', message: 'You need a verified account to request items. It only takes a few minutes.', action: 'Verify Now' };
  const confirmRequest = async () => {
    if (!checkout || !returnDate) {
      showRequestError('Choose your dates', 'Please select a start date and return date.');
      return;
    }
    if (returnDate < checkout) {
      showRequestError('Invalid dates', 'The return date must be on or after the start date.');
      return;
    }
    const hasDateConflict = reservedRanges.some(
      (range) => checkout <= range.endDate && returnDate >= range.startDate
    );
    if (hasDateConflict) {
      showRequestError(
        'Dates unavailable',
        'Your selected dates overlap with an existing reservation. Please choose another date range.'
      );
      return;
    }
    if (maxDurationDays && inclusiveDays(checkout, returnDate) > maxDurationDays) {
      showRequestError(
        'Maximum rental period exceeded',
        `The lender allows up to ${formatDurationDays(maxDurationDays)} per rental. Please choose a shorter date range.`,
      );
      return;
    }
    if (!isFree && !paymentMethod.trim()) {
      showRequestError('Required field', 'Please enter a payment method.', 'request');
      return;
    }
    const listingId = item.id ?? item.listingId;
    if (listingId === undefined || listingId === null || String(listingId).trim() === '') {
      showRequestError(
        'Unable to submit',
        'This listing is missing its ID. Please check the listing data before submitting the request.',
      );
      return;
    }
    try {
      setSubmitting(true);
      const requestMessage = [
        message.trim(),
        !isFree ? `Payment method: ${paymentMethod.trim()}` : '',
      ].filter(Boolean).join('\n');
      await createBorrowRequest({
        listingId: String(listingId),
        startDate: checkout,
        endDate: returnDate,
        message: requestMessage || undefined,
      });
      setMessage('');
      setPaymentMethod('');
      // Success card inside the same Modal (an Alert fired while a Modal is closing is dropped on iOS).
      setOverlay('success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Please try again.';

      // Branch on the backend's machine-readable `code` (POST /orders/ -> 400).
      switch (error instanceof BorrowRequestError ? error.code : 'unknown') {
        case 'borrowing_limit_reached':
          showRequestError(
            'Borrowing limit reached',
            'You can only have 3 active or pending borrow requests at the same time. Please complete, return or cancel one before requesting another item.',
          );
          break;
        case 'date_conflict': {
          const range = error instanceof BorrowRequestError ? error.conflictingRange : undefined;
          showRequestError(
            'Dates unavailable',
            range
              ? `This item is already reserved from ${formatDisplayDate(range.startDate)} to ${formatDisplayDate(range.endDate)}. Please choose another date range.`
              : 'Your selected dates overlap with an existing reservation. Please choose another date range.',
          );
          setCheckout('');
          setReturnDate('');
          setReloadKey((k) => k + 1); // refresh blocked_dates on the calendar
          break;
        }
        case 'own_listing':
          showRequestError(
            'Cannot borrow your own listing',
            'You cannot send a borrow request for an item that you listed yourself.',
          );
          break;
        case 'listing_unavailable':
          showRequestError(
            'Listing unavailable',
            'This listing is paused, suspended or archived and can’t be requested right now.',
          );
          break;
        default:
          showRequestError('Request failed', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Android back button / OK button for whichever overlay is showing.
  const closeOverlayWithBack = () => {
    if (overlay === 'confirm') {
      if (!submitting) setOverlay('request');
    } else if (overlay === 'error') {
      setOverlay(errorReturnTo);
    } else if (overlay === 'success') {
      setOverlay('none');
      navigation.goBack();
    } else {
      setOverlay('none');
    }
  };
  return (
    <View style={styles.screen}>
          <StatusBar barStyle="light-content" />
      
      <View style={styles.header} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(
                Math.round(e.nativeEvent.contentOffset.x / screenWidth),
              )
            }
          >
            {photos.map((uri, index) => (
              <Image
                key={`${index}-${uri}`}
                source={{ uri }}
                style={[styles.mainImage, { width: screenWidth }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={colors.primaryDark}
            />
          </Pressable>
          <View style={styles.imageCount}>
            <Text style={styles.imageCountText}>
              {photoIndex + 1}/{photos.length}
            </Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{price}</Text>
          </View>
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>{isListingUnavailable ? 'Unavailable' : 'Available'}</Text>
          </View>
        </View>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {title}
            </Text>
            <Pressable
              style={styles.bookmarkButton}
              onPress={() => setBookmarked((previous) => !previous)}
              accessibilityLabel={
                bookmarked ? 'Remove bookmark' : 'Bookmark listing'
              }
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={26}
                color={colors.primary}
              />
            </Pressable>
          </View>
          {author ? <Text style={styles.authorText}>{author}</Text> : null}
        </View>
        <View style={styles.contentSection}>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>
              {item.category || 'General'}
            </Text>
          </View>
          <View style={styles.dateCard}>
            <Text style={styles.dateTitle}>{isFree ? "When do you need to borrow it?" : "When do you need it?"}</Text>
            <View style={styles.dateRow}>
              <Pressable
                style={styles.dateBox}
                onPress={() => openCalendar('checkout')}
              >
                <Text style={styles.dateLabel}>{isFree ? "Borrow" : "Check-out"}</Text>
                <Text style={styles.addDate}>{checkout ? formatDisplayDate(checkout) : 'Add date'}</Text>
              </Pressable>
              <Pressable
                style={styles.dateBox}
                onPress={() => openCalendar('return')}
              >
                <Text style={styles.dateLabel}>Return</Text>
                <Text style={styles.addDate}>{returnDate ? formatDisplayDate(returnDate) : 'Add date'}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <AvailabilityCalendar
              availableFrom={availableFrom}
              availableTo={availableTo}
              reservedRanges={reservedRanges}
              start={checkout}
              end={returnDate}
            />
          </View>
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About this Product</Text>
            {(item.details ||
              (displayDescription ? [displayDescription] : ['No description provided.'])
            ).map((detail: string, index: number) => (
              <Text key={`${index}-${detail}`} style={styles.detailText}>
                {detail}
              </Text>
            ))}
          </View>
          <Pressable
            style={styles.lenderCard}
            disabled={!lenderId}
            onPress={() => navigation.navigate('LenderProfile', { lenderId })}
            accessibilityRole={lenderId ? 'button' : undefined}
            accessibilityLabel="View lender profile"
          >
            <View style={styles.lenderAvatar}>
              {(lender?.photoUrl || item.lenderPhoto || item.photoUrl) ? (
                <Image
                  source={{ uri: lender?.photoUrl || item.lenderPhoto || item.photoUrl }}
                  style={styles.lenderAvatarImage}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={26}
                  color={colors.textMuted}
                />
              )}
            </View>
            <View style={styles.lenderInfo}>
              <VerifiedLabel
                name={lender?.fullName || item.lenderName || 'Lender'}
                affiliation={lender?.affiliation || item.affiliation}
                verified={lender?.verified ?? item.lenderVerified ?? item.verified ?? false}
              />
              {lender?.program || item.lenderYear ? (
                <Text style={styles.lenderYear}>
                  {lender?.program || item.lenderYear}
                </Text>
              ) : null}
              <View style={styles.ratingSmall}>
                <Text style={styles.starText}>★</Text>
                <Text style={styles.ratingText}>
                  {lender
                    ? lender.reviewCount > 0
                      ? `${lender.rating.toFixed(1)} (${lender.reviewCount} reviews)`
                      : 'No ratings yet'
                    : item.lenderRating || item.rating || 'No ratings yet'}
                </Text>
              </View>
            </View>
            {lenderId ? (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            ) : null}
          </Pressable>
          <ReportButton targetType="listing" targetId={itemId ? String(itemId) : undefined} />
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>
            Product Reviews <Text style={styles.reviewCount}>({reviewTotal})</Text>
          </Text>
          {reviewTotal === 0 ? (
            <Text style={styles.detailText}>No reviews for this item yet.</Text>
          ) : (
            <>
              <RatingRow label="Five" count={countFor(5)} width={barWidth(5)} />
              <RatingRow label="Four" count={countFor(4)} width={barWidth(4)} />
              <RatingRow label="Three" count={countFor(3)} width={barWidth(3)} />
              <RatingRow label="Two" count={countFor(2)} width={barWidth(2)} />
              <RatingRow label="One" count={countFor(1)} width={barWidth(1)} />
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Recent Feedbacks</Text>
              {reviews.map((r) => (
                <FeedbackCard
                  key={r.id}
                  name={r.reviewerName}
                  rating={r.rating}
                  message={r.comment}
                />
              ))}
            </>
          )}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 6 }]}>
        <Pressable
          style={styles.chatButton}
          onPress={() =>
            Alert.alert('Chat', 'Connect this button to the lender chat screen.')
          }
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.chatText}>Chat</Text>
        </Pressable>
        <Pressable
          style={styles.requestRentButton}
          onPress={openRequest}
        >
          <Text style={styles.requestRentText}>
            {isFree ? 'Request to Borrow' : 'Request to Rent'}
          </Text>
        </Pressable>
      </View>
      {calendarVisible ? (
        <CalendarPicker
          visible
          selectedDate={calendarTarget === 'checkout' ? checkout : returnDate}
          minDate={calendarTarget === 'return' ? checkout || undefined : undefined}
          maxDate={calendarTarget === 'return' && checkout ? latestReturnFor(checkout) : undefined}
          hint={
            calendarTarget === 'return' && maxDurationDays
              ? `This lender allows up to ${formatDurationDays(maxDurationDays)} per rental.`
              : undefined
          }
          availableFrom={availableFrom}
          availableTo={availableTo}
          reservedRanges={reservedRanges}
          onClose={() => setCalendarVisible(false)}
          onSelect={selectDate}
        />
      ) : null}
      <Modal
        visible={overlay !== 'none'}
        transparent
        animationType="fade"
        onRequestClose={closeOverlayWithBack}
      >
        {overlay === 'request' ? (
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <BlurView
              intensity={38}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.requestModal}>
              <LinearGradient
                colors={[
                  'rgba(224, 185, 79, 0.78)',
                  'rgba(151, 112, 82, 0.82)',
                  'rgba(116, 70, 75, 0.86)',
                ]}
                locations={[0, 0.52, 1]}
                style={StyleSheet.absoluteFill}
              />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeading}>
                  <Text style={styles.modalTitle}>
                    {isFree ? 'Request to Borrow' : 'Request to Rent'}
                  </Text>
                </View>
                <View style={styles.requestItem}>
                  <View style={styles.requestItemIcon}>
                    <Ionicons
                      name="book-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.requestItemInfo}>
                    <Text style={styles.requestItemTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    <Text style={styles.requestItemSubtitle}>
                      Lender: {lender?.fullName || item.lenderName || 'Lender'}
                    </Text>
                    <Text style={styles.requestItemSubtitle}>
                      {formatDisplayDate(checkout)} to {formatDisplayDate(returnDate)}
                    </Text>
                  </View>
                </View>
                {!isFree && (
                  <>
                    <Text style={styles.inputLabel}>Payment Method</Text>
                    <TextInput
                      style={styles.paymentInput}
                      value={paymentMethod}
                      onChangeText={setPaymentMethod}
                      placeholder="Enter preferred payment method"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Payment method"
                    />
                  </>
                )}
                <Text style={styles.inputLabel}>Add a message (Optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Introduce yourself or explain why you need it..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                  accessibilityLabel="Optional message to lender"
                />
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setOverlay('none')}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.sendButton}
                    onPress={() => setOverlay('confirm')}
                  >
                    <Text style={styles.sendButtonText}>Send Request</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View
            style={[
              styles.confirmBackdrop,
              overlay !== 'verify' && styles.confirmBackdropSolid,
            ]}
          >
            <BlurView
              intensity={32}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            {overlay === 'verify' ? (
              <View style={styles.confirmModal}>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={38}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.confirmTitle}>{verifyCopy.title}</Text>
                <Text style={styles.confirmMessage}>{verifyCopy.message}</Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={styles.confirmCancel}
                    onPress={() => setOverlay('none')}
                  >
                    <Text style={styles.confirmCancelText}>
                      {verifyCopy.action ? 'Not Now' : 'OK'}
                    </Text>
                  </Pressable>
                  {verifyCopy.action ? (
                    <Pressable
                      style={styles.confirmButton}
                      onPress={() => {
                        setOverlay('none');
                        navigation.navigate('VerifyIdentity');
                      }}
                    >
                      <Text style={styles.confirmButtonText}>
                        {verifyCopy.action}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : overlay === 'confirm' ? (
              <View style={[styles.confirmModal, styles.confirmModalSolid]}>
                <Text style={styles.confirmTitle}>Send Request</Text>
                <Text style={styles.confirmMessage}>
                  Are you sure you want to make this request?
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={styles.confirmCancel}
                    onPress={() => setOverlay('request')}
                    disabled={submitting}
                  >
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
                    onPress={confirmRequest}
                    disabled={submitting}
                  >
                    <Text style={styles.confirmButtonText}>
                      {submitting ? 'Sending...' : 'Confirm'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : overlay === 'success' ? (
              <View style={[styles.confirmModal, styles.confirmModalSolid]}>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={38}
                    color={colors.success}
                  />
                </View>
                <Text style={styles.confirmTitle}>Request sent</Text>
                <Text style={styles.confirmMessage}>
                  {`Your ${isFree ? 'borrow' : 'rental'} request has been submitted.`}
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={styles.confirmButton}
                    onPress={closeOverlayWithBack}
                  >
                    <Text style={styles.confirmButtonText}>OK</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={[styles.confirmModal, styles.confirmModalSolid]}>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={38}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.confirmTitle}>{errorModalTitle}</Text>
                <Text style={styles.confirmMessage}>{errorModalMessage}</Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={styles.confirmButton}
                    onPress={closeOverlayWithBack}
                  >
                    <Text style={styles.confirmButtonText}>OK</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}
function CalendarPicker({
  visible,
  selectedDate,
  minDate,
  maxDate,
  hint,
  availableFrom,
  availableTo,
  reservedRanges = [],
  onClose,
  onSelect,
}: CalendarPickerProps) {
  const [month, setMonth] = useState(() => {
    // Open on the chosen date, or (for the return date) on the check-out month.
    const anchor = selectedDate || minDate;
    if (anchor) {
      const [year, monthNumber] = anchor.split('-').map(Number);
      return new Date(year, monthNumber - 1, 1);
    }
    const now = new Date();
    // Open on the first month the item is available.
    if (availableFrom && new Date(`${availableFrom}T00:00:00`) > now) {
      const [year, monthNumber] = availableFrom.split('-').map(Number);
      return new Date(year, monthNumber - 1, 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [draftDate, setDraftDate] = useState(selectedDate);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formatDate = (day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const isDisabled = (date: string) => {
    const parsed = new Date(`${date}T00:00:00`);
    return (
      parsed < today ||
      (!!minDate && date < minDate) ||
      (!!maxDate && date > maxDate) ||
      (!!availableFrom && date < availableFrom) ||
      (!!availableTo && date > availableTo) ||
      reservedRanges.some(
        (range) => date >= range.startDate && date <= range.endDate,
      )
    );
  };
  const days = Array.from(
    { length: firstDay + daysInMonth },
    (_, index) => (index < firstDay ? null : index - firstDay + 1),
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.calendarBackdrop}>
        <BlurView
          intensity={38}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.calendarModal}>
          <LinearGradient
            colors={[
              'rgba(224, 185, 79, 0.78)',
              'rgba(151, 112, 82, 0.82)',
              'rgba(116, 70, 75, 0.86)',
            ]}
            locations={[0, 0.52, 1]}
            style={StyleSheet.absoluteFill}
          />
         <View style={styles.calendarHeader}>
  <Text style={styles.modalTitle}>Select Dates</Text>
  <Pressable
    style={styles.calendarCloseButton}
    onPress={onClose}
    accessibilityLabel="Close calendar"
  >
    <Ionicons
      name="close-circle"
      size={25}
      color={colors.textMuted}
    />
  </Pressable>
</View>
          <Text style={styles.calendarPreview}>
            {draftDate ? formatDisplayDate(draftDate) : 'Choose a date'}
          </Text>
          {hint ? <Text style={styles.calendarHint}>{hint}</Text> : null}
          <View style={styles.monthHeader}>
            <Pressable
              onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}
              accessibilityLabel="Previous month"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.primaryDark}
              />
            </Pressable>
            <Text style={styles.monthTitle}>
              {month.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Pressable
              onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}
              accessibilityLabel="Next month"
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.primaryDark}
              />
            </Pressable>
          </View>
          <View style={styles.calendarGrid}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
            {days.map((day, index) => {
              if (day === null) {
                return (
                  <View
                    key={`empty-${index}`}
                    style={styles.calendarDay}
                  />
                );
              }
              const date = formatDate(day);
              const disabled = isDisabled(date);
              const selected = draftDate === date;
              return (
                <Pressable
                  key={date}
                  disabled={disabled}
                  onPress={() => setDraftDate(date)}
                  style={[
                    styles.calendarDay,
                    selected && styles.calendarDaySelected,
                    disabled && styles.calendarDayDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      selected && styles.calendarDayTextSelected,
                      disabled && styles.calendarDayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[
              styles.calendarContinue,
              (!draftDate || isDisabled(draftDate)) &&
                styles.calendarContinueDisabled,
            ]}
            disabled={!draftDate || isDisabled(draftDate)}
            onPress={() => onSelect(draftDate)}
          >
            <Text style={styles.calendarContinueText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
function RatingRow({
  label,
  count,
  width,
}: {
  label: string;
  count: number;
  width: `${number}%`;
}) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <Text style={styles.ratingStar}>★</Text>
      <View style={styles.ratingBarBackground}>
        <View style={[styles.ratingBar, { width }]} />
      </View>
      <Text style={styles.ratingCount}>{count}</Text>
    </View>
  );
}
function FeedbackCard({
  name,
  rating,
  message,
  affiliation = 'Student',
}: {
  name: string;
  rating: number;
  message: string;
  affiliation?: string;
}) {
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackAvatar}>
        <Ionicons name="person" size={24} color={colors.textMuted} />
      </View>
      <View style={styles.feedbackContent}>
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackNameContainer}>
            <VerifiedLabel name={name} affiliation={affiliation} compact />
          </View>
          <View style={styles.feedbackStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                style={[
                  styles.feedbackStar,
                  star <= rating ? styles.starActive : styles.starInactive,
                ]}
              >
                ★
              </Text>
            ))}
          </View>
        </View>
        <Text style={styles.feedbackText}>{message}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.white,
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 0,
  },
  header: {
    width: '100%',
    height: 58,
    backgroundColor: colors.primary,
  },
  imageSection: {
    width: '100%',
    height: 300,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 14,
    top: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCount: {
    position: 'absolute',
    right: 14,
    top: 24,
    minWidth: 44,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCountText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    height: 36,
    minWidth: 105,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  availableBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  availableText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  titleSection: {
    width: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  authorText: {
    color: colors.text,
    fontSize: 12,
    marginTop: 4,
  },
  contentSection: {
    width: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  programBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    justifyContent: 'center',
    marginBottom: 12,
  },
  programText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
  },
  dateCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 9,
    backgroundColor: colors.white,
    marginBottom: 18,
  },
  dateTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  dateBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    backgroundColor: '#E8ECF2',
    borderWidth: 1,
    borderColor: '#C8D0DF',
    borderRadius: 7,
    paddingHorizontal: 9,
    justifyContent: 'center',
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  addDate: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  aboutSection: {
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
  lenderCard: {
    width: '100%',
    minHeight: 72,
    borderWidth: 1,
    borderColor: '#9BA9C5',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 14,
  },
  lenderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5E8ED',
    borderWidth: 1,
    borderColor: '#9BA9C5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    overflow: 'hidden',
  },
  lenderAvatarImage: {
    width: '100%',
    height: '100%',
  },
  lenderInfo: {
    flex: 1,
  },
  lenderYear: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  ratingSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starText: {
    color: '#EBA62F',
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  reviewCount: {
    color: colors.textSecondary,
  },
  ratingRow: {
    width: '100%',
    height: 27,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    width: 40,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  ratingStar: {
    width: 24,
    color: '#EBA62F',
    fontSize: 16,
  },
  ratingBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#F2D7A8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#EBA62F',
    borderRadius: 3,
  },
  ratingCount: {
    width: 24,
    textAlign: 'right',
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackCard: {
    width: '100%',
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#9BA9C5',
    borderRadius: 8,
    backgroundColor: '#F7F8FB',
    flexDirection: 'row',
    padding: 8,
    marginBottom: 8,
  },
  feedbackAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E3E6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  feedbackContent: {
    flex: 1,
    minWidth: 0,
  },
  feedbackHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackNameContainer: {
    flex: 1,
    minWidth: 0,
  },
  feedbackStars: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  feedbackStar: {
    fontSize: 12,
    marginLeft: 1,
  },
  starActive: {
    color: '#EBA62F',
  },
  starInactive: {
    color: '#C8CDD5',
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  bottomSpace: {
    height: 18,
  },
  bottomBar: {
    width: '100%',
    minHeight: 64,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chatButton: {
    width: 54,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: {
    color: colors.primary,
    fontSize: 9,
    marginTop: 2,
  },
  requestRentButton: {
    flex: 1,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  requestRentText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  /* Calendar modal */
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 24, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  calendarModal: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    flexShrink: 1,
    backgroundColor: 'rgba(244, 224, 174, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.62)',
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 18,
    shadowColor: '#FCE7A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
 calendarHeader: {
  position: 'relative',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 18,
  minHeight: 36,
},
calendarCloseButton: {
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: [{ translateY: -12 }],
},
  calendarPreview: {
    minHeight: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 10,
    color: colors.text,
    marginBottom: 18,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(246, 242, 236, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(238, 174, 32, 0.9)',
  },
  weekday: {
    width: '14.2857%',
    height: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  calendarDay: {
    width: '14.2857%',
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#EBA62F',
  },
  calendarHint: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 12,
    color: colors.text,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarDayTextDisabled: {
    color: colors.textMuted,
  },
  calendarContinue: {
    height: 44,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarContinueDisabled: {
    backgroundColor: '#B8B8B8',
  },
  calendarContinueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  /* Request modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 24, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  requestModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: 'rgba(225, 190, 125, 0.58)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
    position: 'relative',
    elevation: 18,
    shadowColor: '#FCE7A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
  },
  modalHeading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 28,
  },
  requestItemIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#F4C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requestItemInfo: {
    flex: 1,
  },
  requestItemTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  requestItemSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  paymentInput: {
    height: 42,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    paddingHorizontal: 12,
    color: colors.text,
    marginBottom: 18,
  },
  messageInput: {
    minHeight: 130,
    maxHeight: 170,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.68)',
    padding: 12,
    color: colors.text,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  sendButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  /* Confirmation modal */
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 24, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // Overlays that replace the request form (confirm / error / success) sit on a darker backdrop
  // and a solid card so the text stays readable.
  confirmBackdropSolid: {
    backgroundColor: 'rgba(20, 16, 24, 0.78)',
  },
  confirmModalSolid: {
    backgroundColor: '#FBF4EC',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  confirmModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(238, 224, 210, 0.76)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    elevation: 20,
    shadowColor: '#FCE7A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.primaryDark,
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancel: {
    flex: 1,
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});