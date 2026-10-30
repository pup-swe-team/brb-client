import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../../theme';
import { Button, ScreenContainer } from '../../../shared/components';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { OverdueIndicator } from '../../dashboard/components/OverdueIndicator';
import { AdminCase, AdminCaseAction, applyAdminCaseAction, getAdminCase } from '../services/adminCaseService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(day)}, ${y}`;
}
function peso(n: number) {
  return `₱${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

const ACTIONS: Record<AdminCaseAction, { label: string; title: string; message: string; confirm: string }> = {
  sendReminder: {
    label: 'Send reminder',
    title: 'Send a reminder?',
    message: 'The borrower will be notified to return the item.',
    confirm: 'Send reminder',
  },
  escalate: {
    label: 'Escalate case',
    title: 'Escalate this case?',
    message: 'The case is flagged for follow-up. Use this when reminders are not working.',
    confirm: 'Escalate',
  },
  markReturned: {
    label: 'Mark as returned',
    title: 'Mark as returned?',
    message: 'This closes the case. Only do this if the item is back with the lender.',
    confirm: 'Mark returned',
  },
};

function Shell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <ScreenContainer>
      <View style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={onBack} hitSlop={12} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <Text style={s.headerTitle}>Case Details</Text>
        </View>
        {children}
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// Route param: { caseId: string }. Falls back to 'c1' so the screen also opens without params while testing.
export function AdminCaseScreen({ navigation, route }: any) {
  const caseId: string = route?.params?.caseId ?? 'c1';
  const goBack = () => navigation?.goBack?.();

  const [data, setData] = useState<AdminCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AdminCaseAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminCase(caseId)
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Could not load this case.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  const reload = () => {
    setLoading(true);
    setError(null);
    getAdminCase(caseId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch(() => {
        setError('Could not load this case.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const confirmAction = async () => {
    if (!pending || !data) return;
    const action = pending;
    setPending(null);
    setBusy(true);
    setActionError(null);
    try {
      setData(await applyAdminCaseAction(data.id, action));
    } catch {
      setActionError('Could not update the case. Try again.');
    } finally {
      setBusy(false);
    }
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

  if (error || !data) {
    return (
      <Shell onBack={goBack}>
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{error ?? 'Case not found.'}</Text>
          <Button title="Try again" variant="secondary" onPress={reload} />
        </View>
      </Shell>
    );
  }

  const resolved = data.resolution === 'Resolved';
  const detail = `${data.daysLate} ${data.daysLate === 1 ? 'day' : 'days'} ${data.status === 'Overdue' ? 'overdue' : 'unreturned'}`;
  const dialog = pending ? ACTIONS[pending] : null;

  return (
    <Shell onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* SUMMARY */}
        <View style={s.card}>
          <Text style={s.itemTitle}>{data.itemTitle}</Text>
          <Text style={s.orderId}>Order {data.orderId.toUpperCase()}</Text>
          {!resolved ? <OverdueIndicator status={data.status} detail={detail} /> : null}
          <View style={s.divider} />
          <Row label="Case status" value={data.resolution} />
          <Row label="Borrower" value={data.borrowerName} />
          <Row label="Lender" value={data.lenderName} />
          <Row label="Due date" value={fmtDate(data.dueDate)} />
          <Row label="Deposit" value={peso(data.depositPhp)} />
        </View>

        {/* TIMELINE */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Timeline</Text>
          <View style={s.card}>
            {data.events.map((e, i) => (
              <View key={e.id} style={s.event}>
                <View style={s.dotCol}>
                  <View style={s.dot} />
                  {i < data.events.length - 1 ? <View style={s.line} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.md }}>
                  <Text style={s.eventLabel}>{e.label}</Text>
                  <Text style={s.eventDate}>{fmtDate(e.date)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ACTIONS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Actions</Text>
          {resolved ? (
            <View style={s.resolvedBox}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={s.resolvedText}>This case is resolved. No further action needed.</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Button title={ACTIONS.sendReminder.label} onPress={() => setPending('sendReminder')} disabled={busy} />
              <Button title={ACTIONS.markReturned.label} variant="secondary" onPress={() => setPending('markReturned')} disabled={busy} />
              <Button title={ACTIONS.escalate.label} variant="destructive" onPress={() => setPending('escalate')} disabled={busy} />
            </View>
          )}
          {actionError ? <Text style={s.errorText}>{actionError}</Text> : null}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={pending !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirm}
        destructive={pending === 'escalate'}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
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

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md },
  errorText: { color: colors.error, fontSize: 10, textAlign: 'center', marginTop: spacing.sm },

  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: 6,
  },
  itemTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  orderId: { color: colors.textSecondary, fontSize: 9 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  infoLabel: { color: colors.textSecondary, fontSize: 10 },
  infoValue: { color: colors.text, fontSize: 10, fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },

  event: { flexDirection: 'row', gap: spacing.sm },
  dotCol: { alignItems: 'center', width: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 3 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  eventLabel: { color: colors.text, fontSize: 10, fontWeight: '600' },
  eventDate: { color: colors.textSecondary, fontSize: 8, marginTop: 2 },

  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  resolvedText: { flex: 1, color: colors.textSecondary, fontSize: 10 },
});