import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input } from '../../../shared/components';
import { colors, radius, spacing, text } from '../../../theme';
import { extractApiError } from '../../../services/http';
import type { Order, OrderRole } from '../../../shared/types';
import { cancelOrder } from '../services/ordersService';

// CP-503 Cancel order reason sheet (HTML 41).
const LENDER_REASONS = [
  'Item no longer available',
  'Borrower not responding',
  'Schedule conflict',
  'Other',
];

// TODO: confirm with the Business Analyst. The borrower reasons are not designed yet.
const BORROWER_REASONS = [
  'No longer need it',
  'Schedule conflict',
  'Found another item',
  'Other',
];

type Props = {
  visible: boolean;
  order: Order;
  role: OrderRole;
  onClose: () => void;
  // Called after the order was cancelled so the detail screen reloads.
  onChanged: () => void;
};

// The Modal wrapper mounts the form only while open, so every open starts with fresh state.
export function CancelOrderSheet(props: Props) {
  const { visible, onClose } = props;
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? <SheetBody {...props} /> : null}
    </Modal>
  );
}

function SheetBody({ order, role, onClose, onChanged }: Props) {
  const insets = useSafeAreaInsets();
  const reasons = role === 'Lender' ? LENDER_REASONS : BORROWER_REASONS;

  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [reasonMissing, setReasonMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const choose = (value: string) => {
    setReason(value);
    setReasonMissing(false);
  };

  const confirm = async () => {
    if (!reason) {
      setReasonMissing(true);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const trimmed = details.trim();
      await cancelOrder(order.id, reason, trimmed ? trimmed : undefined);
      onChanged();
      onClose();
    } catch (e) {
      setError(extractApiError(e));
      setSubmitting(false);
    }
  };

  const close = () => {
    if (!submitting) onClose();
  };

  return (
    <>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={s.dismiss} onPress={close} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={s.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            <Text style={text.h2}>Cancel this order?</Text>
            <Text style={[text.body, { color: colors.textSecondary }]}>
              {order.counterpart} will be notified. Orders can only be cancelled before pickup.
            </Text>

            <View style={s.field}>
              <Text style={text.body}>
                Reason<Text style={s.required}> *</Text>
              </Text>
              <View style={s.chips} accessibilityRole="radiogroup">
                {reasons.map((option) => {
                  const selected = reason === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => choose(option)}
                      disabled={submitting}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[s.chip, selected && s.chipOn]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={14} color={colors.primary} />
                      ) : null}
                      <Text style={[s.chipText, selected && s.chipTextOn]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {reasonMissing ? (
                <Text style={[text.caption, { color: colors.error }]}>Please choose a reason.</Text>
              ) : null}
            </View>

            <Input
              label="Details (optional)"
              value={details}
              onChangeText={setDetails}
              editable={!submitting}
              multiline
              maxLength={500}
              placeholder="Add a short note for the other person"
              style={s.details}
            />

            {error ? (
              <View style={s.errorRow} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={[text.caption, s.errorText]}>{error}</Text>
              </View>
            ) : null}

            <View style={s.buttons}>
              <View style={s.buttonCell}>
                <Button title="Keep Order" variant="secondary" onPress={close} disabled={submitting} />
              </View>
              <View style={s.buttonCell}>
                <Button
                  title="Confirm Cancel"
                  variant="destructive"
                  onPress={confirm}
                  loading={submitting}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  content: { gap: spacing.md },
  field: { gap: spacing.sm },
  required: { color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoftPressed },
  chipText: { ...text.body, color: colors.textSecondary },
  chipTextOn: { color: colors.primary, fontWeight: '600' },
  details: {
    ...text.body,
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: spacing.sm,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { flex: 1, color: colors.error },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  buttonCell: { flex: 1 },
});
