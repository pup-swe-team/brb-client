import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../shared/components';
import { colors, radius, spacing } from '../../../theme';
import { REPORT_CATEGORIES, ReportTargetType, submitReport } from '../services/reportsService';

export interface ReportSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

// CP-901 Report form: category selector + description, submit via reportsService.
// Categories depend on what is being reported.
const ALLOWED: Record<ReportTargetType, string[]> = {
  user: ['spam', 'harassment', 'fraud', 'inappropriate', 'other'],
  listing: ['spam', 'inappropriate', 'fraud', 'prohibited_item', 'other'],
  review: ['spam', 'inappropriate', 'harassment', 'other'],
  message: ['spam', 'harassment', 'inappropriate', 'other'],
};
const TARGET_LABEL: Record<ReportTargetType, string> = {
  user: 'user',
  listing: 'listing',
  review: 'review',
  message: 'message',
};
const MAX_LEN = 500;

export function ReportSheet({ visible, targetType, targetId, onClose, onSubmitted }: ReportSheetProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const categories = useMemo(
    () => REPORT_CATEGORIES.filter((c) => ALLOWED[targetType].includes(c.value)),
    [targetType],
  );

  // Start fresh every time the sheet opens.
  useEffect(() => {
    if (visible) {
      setCategory(null);
      setDescription('');
      setAttempted(false);
      setBusy(false);
      setError(null);
      setDone(false);
    }
  }, [visible]);

  const categoryError = attempted && !category ? 'Choose a reason.' : null;
  const descError = attempted && description.trim().length === 0 ? 'Please describe the problem.' : null;

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    setAttempted(true);
    if (!category || description.trim().length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await submitReport({ targetType, targetId, category, description });
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not send your report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    onSubmitted?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.backdrop} onPress={close} accessibilityLabel="Close report form" />
        <View style={s.sheet}>
          {done ? (
            <View style={s.doneWrap}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={s.title}>Thanks for your report</Text>
              <Text style={s.helper}>
                Our team will review it. We may follow up if we need more details.
              </Text>
              <Button title="Done" onPress={finish} />
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.form}>
              <View style={s.titleRow}>
                <Text style={s.title}>Report this {TARGET_LABEL[targetType]}</Text>
                <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Text style={s.label}>Reason</Text>
              <View style={s.options}>
                {categories.map((c) => {
                  const selected = category === c.value;
                  return (
                    <Pressable
                      key={c.value}
                      onPress={() => setCategory(c.value)}
                      style={[s.option, selected && s.optionSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                      <Text style={s.optionText}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {categoryError ? <Text style={s.errorText}>{categoryError}</Text> : null}

              <Text style={s.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, MAX_LEN))}
                placeholder="Tell us what happened"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MAX_LEN}
                editable={!busy}
                style={[s.input, descError ? s.inputError : null]}
              />
              <View style={s.metaRow}>
                <Text style={s.errorText}>{descError ?? ''}</Text>
                <Text style={s.counter}>
                  {description.length}/{MAX_LEN}
                </Text>
              </View>

              {error ? <Text style={s.errorText}>{error}</Text> : null}

              <Button title={busy ? 'Sending…' : 'Submit report'} onPress={submit} disabled={busy} />
              <Button title="Cancel" variant="secondary" onPress={close} disabled={busy} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
  },
  form: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  label: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: spacing.xs },
  helper: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },

  options: { gap: spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.goldSoft },
  optionText: { color: colors.text, fontSize: 11 },

  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
    fontSize: 11,
    color: colors.text,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: colors.error },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  counter: { color: colors.textSecondary, fontSize: 9 },
  errorText: { color: colors.error, fontSize: 10, flexShrink: 1 },

  doneWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
});