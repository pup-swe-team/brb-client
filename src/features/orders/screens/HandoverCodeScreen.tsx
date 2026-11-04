import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  Button,
  Card,
  CodeInput,
  ScreenContainer,
  TopBar,
} from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import type { Order, OrderRole } from '../../../shared/types';
import {
  confirmHandover,
  generateHandoverCode,
  getOrGenerateHandoverCode,
  getOrder,
  OrderCodeError,
} from '../services/ordersService';

type Mode = 'show' | 'enter';

// Keeps lockout attempts while navigating away from and back to this screen.
// Backend persistence is still required to survive a full app restart.
const HANDOVER_LOCKOUTS = new Map<
  string,
  { attempts: number; lockedUntil: number | null }
>();

// Fallback duration only if the backend reports a lockout without an expiry.
// Keep this aligned with the backend's configured lockout duration.
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export default function HandoverCodeScreen({ navigation, route }: any) {
  const { orderId, mode } = route.params as { orderId: string; mode: Mode };
  // Lender displays the code; borrower enters it.
  const orderRole: OrderRole = mode === 'show' ? 'Lender' : 'Borrower';

  const [order, setOrder] = useState<Order | null>(null);
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leaveScreen = useCallback(() => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
    setSuccessVisible(false);
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const loadScreen = useCallback(async () => {
    setLoading(true);
    setError('');

    // Restore the current order's lockout state when the screen regains focus.
    if (mode === 'enter') {
      const saved = HANDOVER_LOCKOUTS.get(orderId);

      if (saved) {
        const stillLocked =
          saved.lockedUntil !== null && saved.lockedUntil > Date.now();

        setAttempts(saved.attempts);
        setLocked(stillLocked);
        setLockedUntil(stillLocked ? saved.lockedUntil : null);
        setEnteredCode('');

        if (saved.lockedUntil !== null && !stillLocked) {
          HANDOVER_LOCKOUTS.delete(orderId);
          setAttempts(0);
        }
      } else {
        setAttempts(0);
        setLocked(false);
        setLockedUntil(null);
      }
    }

    try {
      const currentOrder = await getOrder(orderId, orderRole);
      setOrder(currentOrder);

      if (mode === 'show') {
        // Reuse the issued code and original backend expiry on focus/refresh.
        // A new code is generated only if no valid code is cached.
        const result = await getOrGenerateHandoverCode(orderId);
        setCode(result.code);
        setExpiresAt(result.expiresAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the handover code.');
    } finally {
      setLoading(false);
    }
  }, [orderId, orderRole, mode]);

  useFocusEffect(
    useCallback(() => {
      void loadScreen();
      return () => {
        if (redirectTimer.current) clearTimeout(redirectTimer.current);
      };
    }, [loadScreen]),
  );

  useEffect(() => {
    if (!expiresAt) return;
    const updateCountdown = () => {
      const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(seconds);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (mode !== 'enter' || lockedUntil === null) {
      setLockRemaining(0);
      return;
    }

    const updateLockCountdown = () => {
      const seconds = Math.max(
        0,
        Math.ceil((lockedUntil - Date.now()) / 1000)
      );
      setLockRemaining(seconds);

      if (seconds === 0) {
        setLocked(false);
        setLockedUntil(null);
        setAttempts(0);
        setEnteredCode('');
        HANDOVER_LOCKOUTS.delete(orderId);
      }
    };

    updateLockCountdown();
    const timer = setInterval(updateLockCountdown, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil, mode, orderId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatLockoutTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activateLockout = (backendLockedUntil?: string) => {
    const parsedExpiry = backendLockedUntil
      ? new Date(backendLockedUntil).getTime()
      : NaN;

    const expiry =
      Number.isFinite(parsedExpiry) && parsedExpiry > Date.now()
        ? parsedExpiry
        : Date.now() + LOCKOUT_DURATION_MS;

    HANDOVER_LOCKOUTS.set(orderId, {
      attempts: 5,
      lockedUntil: expiry,
    });

    setAttempts(5);
    setLocked(true);
    setLockedUntil(expiry);
    setEnteredCode('');
    setError('');
  };

  const requestNewCode = async () => {
    if (loading || submitting || completed) return;
    setLoading(true);
    setError('');
    try {
      const result = await generateHandoverCode(orderId);
      setCode(result.code);
      setExpiresAt(result.expiresAt);
      setEnteredCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate a new code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (submitting || completed || locked) return;
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await confirmHandover(orderId, enteredCode);
      setCompleted(true);
      setSuccessVisible(true);
      // Show confirmation briefly, then return automatically. Done can return immediately.
      redirectTimer.current = setTimeout(leaveScreen, 1600);
    } catch (err) {
      if (err instanceof OrderCodeError && err.kind === 'expired') {
        setError('This code has expired. Ask the lender for a new code.');
      } else if (err instanceof OrderCodeError && err.kind === 'locked') {
        activateLockout(err.lockedUntil);
      } else if (err instanceof OrderCodeError && err.kind === 'used') {
        setError('This code has already been used. Request a new code.');
      } else if (err instanceof OrderCodeError && err.kind === 'incorrect') {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          activateLockout();
        } else {
          HANDOVER_LOCKOUTS.set(orderId, {
            attempts: nextAttempts,
            lockedUntil: null,
          });
          setError(
            `Incorrect code. ${5 - nextAttempts} attempt(s) remaining.`
          );
        }
      } else {
        setError(err instanceof Error ? err.message : 'Unable to confirm the handover. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date?: string) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString() : '—';

  return (
    <View style={styles.root}>
      <TopBar title="Handover Code" onBack={leaveScreen} />

      <View style={styles.body}>
        <ScreenContainer scroll>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : !order ? (
            <Text style={styles.errorText}>{error || 'Unable to load this order.'}</Text>
          ) : (
            <View style={styles.content}>
              <Text style={[text.h2, styles.heading]}>
                {mode === 'show' ? 'Show this code to the borrower' : 'Enter the handover code'}
              </Text>
              <Text
                style={[text.body, styles.subtitle]}
                numberOfLines={mode === 'show' ? 1 : undefined}
                adjustsFontSizeToFit={mode === 'show'}
                minimumFontScale={0.75}
              >
                {mode === 'show'
                  ? `The borrower enters it to confirm they received ${order.listingTitle}.`
                  : 'Ask the lender to show you the 6-digit handover code.'}
              </Text>

              {mode === 'show' ? (
                <>
                  <View style={styles.codeRow}>
                    {code.split('').map((digit, index) => (
                      <View key={index} style={styles.codeCell}>
                        <Text style={styles.codeDigit}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.expiry}>
                    <Text style={text.caption}>Expires in</Text>
                    <Text style={styles.timer}>{remaining > 0 ? formatTime(remaining) : '00:00:00'}</Text>
                  </View>
                </>
              ) : locked ? (
                <View style={styles.lockedCard}>
                  <Text style={styles.lockedTitle}>Code Entry Locked</Text>
                  <Text style={styles.lockedMessage}>
                    Too many incorrect attempts. Code entry is temporarily unavailable.
                  </Text>
                  <Text style={styles.lockedTimer}>
                    {formatLockoutTime(lockRemaining)}
                  </Text>
                  <Text style={styles.lockedHint}>
                    You can try again when the countdown reaches zero.
                  </Text>
                </View>
              ) : (
                <>
                  <CodeInput
                    value={enteredCode}
                    onChange={(value) => {
                      setEnteredCode(value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    error={error}
                    disabled={submitting || completed}
                  />
                  <Button
                    title="Confirm Pickup"
                    onPress={handleConfirm}
                    loading={submitting}
                    disabled={submitting || completed || enteredCode.length !== 6}
                  />
                </>
              )}

              <Card style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={text.caption}>Item</Text>
                  <Text style={styles.detailValue}>{order.listingTitle}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={text.caption}>{mode === 'show' ? 'Borrower' : 'Lender'}</Text>
                  <Text style={styles.detailValue}>{order.counterpart || (mode === 'show' ? 'Borrower' : 'Lender')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={text.caption}>Pickup</Text>
                  <Text style={styles.detailValue}>
                    {order.pickupLocation || '—'} · {formatDate(order.startDate)}
                  </Text>
                </View>
              </Card>

              {mode === 'show' ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    The code works once. Only share it when the borrower is with you.
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </ScreenContainer>
      </View>

      <View style={styles.footer}>
        {mode === 'show' ? (
          <>
            <Button
              title="Request New Code"
              variant="secondary"
              onPress={requestNewCode}
              disabled={loading || submitting || completed}
              loading={loading}
            />
            <Button title="Done" onPress={leaveScreen} variant="secondary" disabled={loading} />
          </>
        ) : null}
      </View>

      <Modal transparent visible={successVisible} animationType="fade" onRequestClose={leaveScreen}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Pickup confirmed</Text>
            <Text style={styles.successMessage}>The order is now active.</Text>
            <Button title="Done" onPress={leaveScreen} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  loader: { marginTop: spacing.xxxl },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heading: { textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  codeCell: {
    flex: 1, maxWidth: 48, height: 48, borderWidth: 1,
    borderColor: colors.borderStrong, borderRadius: 6,
    backgroundColor: colors.primarySoftPressed, alignItems: 'center', justifyContent: 'center',
  },
  codeDigit: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  expiry: { alignItems: 'center', gap: 2 },
  timer: { color: colors.error, fontSize: 18, fontWeight: '700' },
  details: { gap: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  detailValue: { ...text.body, flexShrink: 1, textAlign: 'right', fontWeight: '600' },
  notice: { borderWidth: 1, borderColor: colors.info, borderRadius: 10, padding: spacing.md },
  noticeText: { ...text.caption, color: colors.info },
  errorText: { ...text.body, color: colors.error },
  lockedCard: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockedTitle: {
    ...text.h2,
    color: colors.error,
    textAlign: 'center',
  },
  lockedMessage: {
    ...text.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  lockedTimer: {
    color: colors.error,
    fontSize: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lockedHint: {
    ...text.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.sm, backgroundColor: colors.white },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  successCard: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: 14, padding: spacing.lg, gap: spacing.md },
  successTitle: { ...text.h2, textAlign: 'center' },
  successMessage: { ...text.body, color: colors.textSecondary, textAlign: 'center' },
});
