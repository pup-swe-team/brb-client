
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import type { Order } from '../../../shared/types';
import {
  confirmHandover,
  generateHandoverCode,
  getOrder,
  OrderCodeError,
} from '../services/ordersService';

type Mode = 'show' | 'enter';

export default function HandoverCodeScreen({ navigation, route }: any) {
  const { orderId, mode } = route.params as {
    orderId: string;
    mode: Mode;
  };

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

  const loadScreen = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const currentOrder = await getOrder(orderId);
      setOrder(currentOrder);

      if (mode === 'show') {
        const result = await generateHandoverCode(orderId);
        setCode(result.code);
        setExpiresAt(result.expiresAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the handover code.');
    } finally {
      setLoading(false);
    }
  }, [orderId, mode]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        await loadScreen();
      };

      if (active) void load();

      return () => {
        active = false;
      };
    }, [loadScreen]),
  );

  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const seconds = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
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

  const requestNewCode = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await generateHandoverCode(orderId);
      setCode(result.code);
      setExpiresAt(result.expiresAt);
      setEnteredCode('');
      setRemaining(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate a new code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    if (locked) {
      setError('Code entry is locked. Please request assistance.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await confirmHandover(orderId, enteredCode);
      Alert.alert('Pickup confirmed', 'The order is now active.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (err instanceof OrderCodeError && err.kind === 'expired') {
        setError('This code has expired. Ask the lender for a new code.');
      } else if (err instanceof OrderCodeError && err.kind === 'locked') {
        setLocked(true);
        setError('Code entry is locked. Please request assistance.');
      } else {
        setError('Incorrect code. Please check the code and try again.');
        if (nextAttempts >= 5) {
          setLocked(true);
          setError('Too many incorrect attempts. Code entry is locked.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date?: string) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString() : '—';

  return (
    <View style={styles.root}>
      <TopBar title="Handover Code" onBack={() => navigation.goBack()} />

      <ScreenContainer scroll>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error && !order ? (
          <Text style={[text.body, { color: colors.error }]}>{error}</Text>
        ) : order ? (
          <View style={styles.content}>
            <Text style={[text.h2, styles.heading]}>
              {mode === 'show'
                ? 'Show this code to the borrower'
                : 'Enter the handover code'}
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
                  <Text style={styles.timer}>
                    {remaining > 0 ? formatTime(remaining) : '00:00:00'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <CodeInput
                  value={enteredCode}
                  onChange={(value) => {
                    setEnteredCode(value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  error={error}
                  disabled={submitting || locked}
                />
                <Button
                  title="Confirm Pickup"
                  onPress={handleConfirm}
                  loading={submitting}
                  disabled={locked || remaining === 0 && !!expiresAt}
                />
              </>
            )}

            <Card style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={text.caption}>Item</Text>
                <Text style={styles.detailValue}>{order.listingTitle}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={text.caption}>
                  {mode === 'show' ? 'Borrower' : 'Lender'}
                </Text>
                <Text style={styles.detailValue}>{order.counterpart}</Text>
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
            ) : error ? (
              <Text style={[text.body, { color: colors.error }]}>{error}</Text>
            ) : null}
          </View>
        ) : null}
      </ScreenContainer>

      <View style={styles.footer}>
        {mode === 'show' ? (
          <Button
            title="Request New Code"
            variant="secondary"
            onPress={requestNewCode}
            disabled={loading}
          />
        ) : null}
        <Button
          title="Done"
          variant={mode === 'show' ? 'secondary' : 'primary'}
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxxl },
  content: { gap: spacing.md },
  heading: { textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  codeCell: {
    flex: 1,
    maxWidth: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    backgroundColor: colors.primarySoftPressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigit: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  expiry: { alignItems: 'center', gap: 2 },
  timer: { color: colors.error, fontSize: 18, fontWeight: '700' },
  details: { gap: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailValue: {
    ...text.body,
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  notice: {
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: 10,
    padding: spacing.md,
  },
  noticeText: { ...text.caption, color: colors.info },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
});
