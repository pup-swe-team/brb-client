import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../../theme';
import { todayISO } from '../constants';

type Props = {
  visible: boolean;
  title: string;
  value: string; // YYYY-MM-DD or ''
  minDate?: string; // earlier days are disabled
  onClose: () => void;
  onSelect: (date: string) => void;
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function monthOf(date: string) {
  const [y, m] = (date || todayISO()).split('-').map(Number);
  return new Date(y, m - 1, 1);
}

function label(date: string) {
  if (!date) return 'Choose a date';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Calendar picker used for the From / Until dates on the Add / Edit Listing form.
// Pure JS (no native date-picker package) so it behaves the same on Expo Go, Android and web.
export function DatePickerModal(props: Props) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      {/* Mounted only while open, so the month and draft date start fresh from `value` each time. */}
      {props.visible ? <PickerCard {...props} /> : null}
    </Modal>
  );
}

function PickerCard({ title, value, minDate, onClose, onSelect }: Props) {
  const [month, setMonth] = useState(() => monthOf(value || minDate || ''));
  const [draft, setDraft] = useState(value);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => (i < firstDay ? null : i - firstDay + 1));
  const isDisabled = (date: string) => !!minDate && date < minDate;

  return (
    <Pressable style={s.backdrop} onPress={onClose}>
      <Pressable style={s.card} onPress={() => {}}>
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close calendar">
            <Ionicons name="close-circle" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
        <Text style={s.preview}>{label(draft)}</Text>

        <View style={s.monthRow}>
          <Pressable onPress={() => setMonth(new Date(year, monthIndex - 1, 1))} hitSlop={10} accessibilityLabel="Previous month">
            <Ionicons name="chevron-back" size={22} color={colors.primaryDark} />
          </Pressable>
          <Text style={s.monthTitle}>
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable onPress={() => setMonth(new Date(year, monthIndex + 1, 1))} hitSlop={10} accessibilityLabel="Next month">
            <Ionicons name="chevron-forward" size={22} color={colors.primaryDark} />
          </Pressable>
        </View>

        <View style={s.grid}>
          {WEEK_DAYS.map((d) => (
            <Text key={d} style={s.weekday}>{d}</Text>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <View key={`blank-${i}`} style={s.cell} />;
            const date = iso(year, monthIndex, day);
            const disabled = isDisabled(date);
            const selected = draft === date;
            return (
              <Pressable
                key={date}
                disabled={disabled}
                onPress={() => setDraft(date)}
                style={[s.cell, selected && s.cellSelected, disabled && s.cellDisabled]}
                accessibilityRole="button"
                accessibilityLabel={label(date)}
                accessibilityState={{ disabled, selected }}
              >
                <Text style={[s.dayText, selected && s.dayTextSelected, disabled && s.dayTextDisabled]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.actions}>
          <Pressable style={s.cancel} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[s.confirm, (!draft || isDisabled(draft)) && s.confirmDisabled]}
            disabled={!draft || isDisabled(draft)}
            onPress={() => onSelect(draft)}
          >
            <Text style={s.confirmText}>Select</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  card: { width: '100%', maxWidth: 380, backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  preview: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs, marginBottom: spacing.md },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '600', paddingVertical: spacing.xs },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  cellSelected: { backgroundColor: colors.primary },
  cellDisabled: { opacity: 0.35 },
  dayText: { color: colors.text, fontSize: 13 },
  dayTextSelected: { color: colors.white, fontWeight: '800' },
  dayTextDisabled: { color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancel: { flex: 1, height: 44, borderRadius: radius.button, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  cancelText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  confirm: { flex: 1, height: 44, borderRadius: radius.button, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  confirmDisabled: { backgroundColor: colors.disabled },
  confirmText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
