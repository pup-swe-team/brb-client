import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  confirmReturn,
  generateReturnCode,
  getOrder,
  OrderCodeError,
} from '../services/ordersService';

type Mode = 'show' | 'enter';

export default function ReturnCodeScreen({ navigation, route }: any) {
  const { orderId, mode } = route.params as { orderId: string; mode: Mode };
  // Borrower displays the code; lender enters it.
  const orderRole: OrderRole = mode === 'show' ? 'Borrower' : 'Lender';

  const [order, setOrder] = useState<Order | null>(null);
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [damaged, setDamaged] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
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
    try {
      const currentOrder = await getOrder(orderId, orderRole);
      setOrder(currentOrder);
      if (mode === 'show') {
        const result = await generateReturnCode(orderId);
        setCode(result.code);
        setExpiresAt(result.expiresAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the return code.');
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const requestNewCode = async () => {
    if (loading || submitting || completed) return;
    setLoading(true);
    setError('');
    try {
      const result = await generateReturnCode(orderId);
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
      await confirmReturn(orderId, enteredCode, { damaged });
      setCompleted(true);

      if (damaged) {
        // Keep the existing damage-report workflow; prevent this code screen from resubmitting.
        navigation.navigate('ReportDamage', { orderId });
      } else {
        setSuccessVisible(true);
        redirectTimer.current = setTimeout(leaveScreen, 1600);
      }
    } catch (err) {
      if (err instanceof OrderCodeError && err.kind === 'expired') {
        setError('This code has expired. Ask the borrower for a new code.');
      } else if (err instanceof OrderCodeError && err.kind === 'locked') {
        setLocked(true);
        setError('Code entry is locked. Please request assistance.');
      } else if (err instanceof OrderCodeError && err.kind === 'used') {
        setError('This code has already been used. Request a new code.');
      } else if (err instanceof OrderCodeError && err.kind === 'incorrect') {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLocked(true);
          setError('Too many incorrect attempts. Code entry is locked.');
        } else {
          setError('Incorrect code. Please check the code and try again.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Unable to confirm the return. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="Return Code" onBack={leaveScreen} />
      <View style={styles.body}>
        <ScreenContainer scroll>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : !order ? (
            <Text style={styles.errorText}>{error || 'Unable to load this order.'}</Text>
          ) : (
            <View style={styles.content}>
              <Text style={styles.heading}>
                {mode === 'show' ? 'Show the return code' : 'Enter the return code'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'show'
                  ? 'Show this code to the lender to confirm the item was returned.'
                  : 'Ask the borrower for the 6-digit code shown in their app.'}
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
                    <Text style={styles.expiryLabel}>Expires in</Text>
                    <Text style={styles.timer}>{remaining > 0 ? formatTime(remaining) : '00:00:00'}</Text>
                  </View>
                </>
              ) : (
                <CodeInput
                  value={enteredCode}
                  onChange={(value) => {
                    setEnteredCode(value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  error={error}
                  disabled={submitting || locked || completed}
                />
              )}

              <Card style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item</Text>
                  <Text style={styles.detailValue}>{order.listingTitle}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{mode === 'show' ? 'Lender' : 'Borrower'}</Text>
                  <Text style={styles.detailValue}>
                    {order.counterpart || (mode === 'show' ? 'Lender' : 'Borrower')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due</Text>
                  <Text style={styles.detailValue}>{formatDate(order.endDate)}</Text>
                </View>
              </Card>

              {mode === 'enter' ? (
                <>
                  <Card style={styles.damageCard}>
                    <View style={styles.damageCopy}>
                      <Text style={styles.damageTitle}>Flag damage or missing items</Text>
                      <Text style={styles.damageDescription}>
                        Turn on if the item came back damaged or incomplete.
                      </Text>
                    </View>
                    <Switch
                      value={damaged}
                      onValueChange={setDamaged}
                      disabled={submitting || completed}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.white}
                      accessibilityLabel="Flag damage or missing items"
                    />
                  </Card>
                  {damaged ? (
                    <View style={styles.warning}>
                      <Ionicons name="warning-outline" size={14} color={colors.warning} />
                      <Text style={styles.warningText}>
                        The order will be marked Disputed. Next, you&apos;ll add a description, at least 1 photo and 1 video.
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.info} />
                  <Text style={styles.noticeText}>
                    Only share this code with the lender when the returned item is present.
                  </Text>
                </View>
              )}
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
              compact
            />
            <Button title="Done" variant="secondary" onPress={leaveScreen} disabled={loading} compact />
          </>
        ) : order ? (
          <>
            <Button
              title={damaged ? 'Confirm Return & Report' : 'Confirm Return'}
              onPress={handleConfirm}
              loading={submitting}
              disabled={loading || submitting || locked || completed || enteredCode.length !== 6}
              compact
            />
            <Button
              title="Done"
              variant="secondary"
              onPress={leaveScreen}
              disabled={submitting}
              compact
            />
          </>
        ) : null}
      </View>

      <Modal transparent visible={successVisible} animationType="fade" onRequestClose={leaveScreen}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Return confirmed</Text>
            <Text style={styles.successMessage}>The item return has been confirmed successfully.</Text>
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
  content: { gap: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  heading: { ...text.h2, fontSize: 16, textAlign: 'center' },
  subtitle: { ...text.caption, color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  codeCell: { width: 36, height: 40, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 5, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  codeDigit: { color: colors.text, fontSize: 17, fontWeight: '700' },
  expiry: { alignItems: 'center', gap: 1 },
  expiryLabel: { ...text.caption, fontSize: 10 },
  timer: { color: colors.error, fontSize: 14, fontWeight: '700' },
  details: { gap: spacing.sm, padding: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  detailLabel: { ...text.caption, fontSize: 10, color: colors.textSecondary },
  detailValue: { ...text.body, fontSize: 11, flexShrink: 1, textAlign: 'right', fontWeight: '600' },
  damageCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.md },
  damageCopy: { flex: 1, gap: 3 },
  damageTitle: { ...text.body, fontSize: 11, fontWeight: '600' },
  damageDescription: { ...text.caption, color: colors.textSecondary, fontSize: 9, lineHeight: 13 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderColor: colors.warning, backgroundColor: colors.goldSoft, borderRadius: 8, padding: spacing.sm },
  warningText: { ...text.caption, color: colors.warning, fontSize: 9, lineHeight: 14, flex: 1 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderColor: colors.info, borderRadius: 8, padding: spacing.md },
  noticeText: { ...text.caption, color: colors.info, fontSize: 10, lineHeight: 15, flex: 1 },
  errorText: { ...text.caption, color: colors.error },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.sm, backgroundColor: colors.white },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  successCard: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: 14, padding: spacing.lg, gap: spacing.md },
  successTitle: { ...text.h2, textAlign: 'center' },
  successMessage: { ...text.body, color: colors.textSecondary, textAlign: 'center' },
});
