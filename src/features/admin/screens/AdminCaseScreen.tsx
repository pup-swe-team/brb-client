import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../../theme';
import { Button, ScreenContainer } from '../../../shared/components';
import { extractApiError, getApiErrorCode } from '../../../services/http';
import {
  AdminCaseDossier, RESOLUTION_LABELS, Resolution, escalateCase, getAdminCase, resolveCase,
} from '../services/adminCaseService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(day)}, ${y}`;
}

// TODO: verify error codes from the backend guide and add friendly messages here.
const ERROR_MESSAGES: Record<string, string> = {
  // case_already_resolved: 'This case was already resolved.',
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

type Mode = 'resolve' | 'escalate' | null;

// Route param: { caseId: string }. Falls back to 'c1' for testing.
export function AdminCaseScreen({ navigation, route }: any) {
  const caseId: string = route?.params?.caseId ?? 'c1';
  const goBack = () => navigation?.goBack?.();

  const [data, setData] = useState<AdminCaseDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminCase(caseId));
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const openMode = (m: Mode) => {
    setMode(m);
    setNotes('');
    setResolution(null);
    setActionError(null);
  };

  const canSubmit = mode === 'resolve' ? !!resolution && notes.trim().length > 0 : notes.trim().length > 0;

  const submit = async () => {
    if (!data || !mode || !canSubmit) return;
    setBusy(true);
    setActionError(null);
    try {
      const next =
        mode === 'resolve'
          ? await resolveCase(data.case.id, { resolution: resolution!, notes: notes.trim() })
          : await escalateCase(data.case.id, { notes: notes.trim() });
      setData(next);
      setMode(null);
    } catch (e) {
      const code = getApiErrorCode(e);
      setActionError((code && ERROR_MESSAGES[code]) || extractApiError(e));
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
          <Button title="Try again" variant="secondary" onPress={load} />
        </View>
      </Shell>
    );
  }

  const { case: c, order, listing, borrower, lender } = data;
  const closed = c.status === 'resolved';

  return (
    <Shell onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* SUMMARY */}
        <View style={s.card}>
          <Text style={s.itemTitle}>{listing.title}</Text>
          <Text style={s.orderId}>Order {String(order.id).toUpperCase()}</Text>
          <View style={s.divider} />
          <Row label="Case status" value={c.status.charAt(0).toUpperCase() + c.status.slice(1)} />
          <Row label="Borrower" value={borrower.full_name} />
          <Row label="Lender" value={lender.full_name} />
          <Row label="Rental dates" value={`${fmtDate(order.start_date)} – ${fmtDate(order.end_date)}`} />
          <Row label="Reported" value={fmtDate(c.created_at)} />
        </View>

        {/* DAMAGE REPORT */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Damage report</Text>
          <View style={s.card}>
            <Text style={s.body}>{c.description}</Text>
          </View>
        </View>

        {/* EVIDENCE */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Evidence ({c.evidence.length})</Text>
          {c.evidence.length === 0 ? (
            <Text style={s.muted}>No evidence attached.</Text>
          ) : (
            <View style={s.evidenceGrid}>
              {c.evidence.map((ev) =>
                ev.type === 'photo' ? (
                  <Pressable key={ev.id} onPress={() => Linking.openURL(ev.url)} accessibilityLabel="Open photo">
                    <Image source={{ uri: ev.url }} style={s.thumb} />
                  </Pressable>
                ) : (
                  <Pressable key={ev.id} onPress={() => Linking.openURL(ev.url)} style={[s.thumb, s.videoThumb]} accessibilityLabel="Play video">
                    <Ionicons name="play-circle" size={32} color={colors.white} />
                    <Text style={s.videoText}>Video</Text>
                  </Pressable>
                ),
              )}
            </View>
          )}
        </View>

        {/* ACTIONS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Actions</Text>
          {closed ? (
            <View style={s.resolvedBox}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={s.resolvedText}>
                  Resolved{c.resolution ? `: ${RESOLUTION_LABELS[c.resolution]}` : ''}
                </Text>
                {c.notes ? <Text style={s.resolvedText}>{c.notes}</Text> : null}
              </View>
            </View>
          ) : mode === null ? (
            <View style={{ gap: spacing.sm }}>
              <Button title="Resolve" onPress={() => openMode('resolve')} />
              {c.status !== 'escalated' ? (
                <Button title="Escalate" variant="destructive" onPress={() => openMode('escalate')} />
              ) : null}
            </View>
          ) : (
            <View style={s.card}>
              <Text style={s.itemTitle}>{mode === 'resolve' ? 'Resolve case' : 'Escalate case'}</Text>
              {mode === 'resolve' ? (
                <View style={{ gap: spacing.xs }}>
                  {(Object.keys(RESOLUTION_LABELS) as Resolution[]).map((r) => (
                    <Pressable key={r} onPress={() => setResolution(r)} style={s.option} accessibilityRole="radio">
                      <Ionicons
                        name={resolution === r ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={s.body}>{RESOLUTION_LABELS[r]}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes"
                multiline
                style={s.input}
                placeholderTextColor={colors.textSecondary}
              />
              {actionError ? <Text style={s.errorText}>{actionError}</Text> : null}
              <Button
                title={busy ? 'Saving…' : mode === 'resolve' ? 'Confirm resolution' : 'Confirm escalation'}
                variant={mode === 'escalate' ? 'destructive' : 'primary'}
                onPress={submit}
                disabled={busy || !canSubmit}
              />
              <Button title="Cancel" variant="secondary" onPress={() => setMode(null)} disabled={busy} />
            </View>
          )}
        </View>
      </ScrollView>
    </Shell>
  );
}

export default AdminCaseScreen;

const s = StyleSheet.create({
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
  body: { color: colors.text, fontSize: 10 },
  muted: { color: colors.textSecondary, fontSize: 10 },

  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },

  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { width: 100, height: 100, borderRadius: radius.card, backgroundColor: colors.border },
  videoThumb: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 2 },
  videoText: { color: colors.white, fontSize: 9 },

  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
    fontSize: 11,
    color: colors.text,
    textAlignVertical: 'top',
  },

  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  resolvedText: { color: colors.textSecondary, fontSize: 10 },
});