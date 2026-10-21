import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';

type Props = {
  availableFrom?: string; // YYYY-MM-DD
  availableTo?: string; // YYYY-MM-DD, empty = open ended
  start?: string; // selected check-out
  end?: string; // selected return
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');

// Read-only month view for the listing detail page: shows which days the lender is available.
export function AvailabilityCalendar({ availableFrom, availableTo, start, end }: Props) {
  const [month, setMonth] = useState(() => {
    const base = availableFrom && availableFrom > todayISO() ? availableFrom : todayISO();
    const [y, m] = base.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const today = todayISO();
  const cells = Array.from({ length: first + total }, (_, i) => (i < first ? null : i - first + 1));
  const hasWindow = !!availableFrom;

  const isAvailable = (d: string) =>
    d >= today && (!hasWindow || (d >= (availableFrom as string) && (!availableTo || d <= availableTo)));

  return (
    <View style={s.card} accessibilityLabel="Availability calendar">
      <View style={s.head}>
        <Pressable onPress={() => setMonth(new Date(y, m - 1, 1))} hitSlop={10} accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={20} color={colors.primaryDark} />
        </Pressable>
        <Text style={s.month}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => setMonth(new Date(y, m + 1, 1))} hitSlop={10} accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>

      <View style={s.grid}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`w${i}`} style={s.weekday}>{w}</Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={s.cell} />;
          const date = `${y}-${pad(m + 1)}-${pad(day)}`;
          const picked = date === start || date === end;
          const inRange = !!start && !!end && date > start && date < end;
          const ok = isAvailable(date);
          return (
            <View key={date} style={s.cell}>
              <View style={[s.day, ok && s.dayOk, inRange && s.dayRange, picked && s.dayPicked]}>
                <Text style={[s.dayText, !ok && s.dayTextOff, picked && s.dayTextPicked]}>{day}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={s.legend}>
        <View style={[s.dot, { backgroundColor: colors.goldSoft }]} /><Text style={s.legendText}>Available</Text>
        <View style={[s.dot, { backgroundColor: colors.primary }]} /><Text style={s.legendText}>Your dates</Text>
        <View style={[s.dot, { backgroundColor: colors.border }]} /><Text style={s.legendText}>Unavailable</Text>
      </View>
    </View>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { color: colors.text, fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', textAlign: 'center', color: colors.textSecondary, fontSize: 10, fontWeight: '700', paddingBottom: 4 },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayOk: { backgroundColor: colors.goldSoft },
  dayRange: { backgroundColor: '#F1B9BB' },
  dayPicked: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: 11 },
  dayTextOff: { color: colors.textMuted },
  dayTextPicked: { color: colors.white, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textSecondary, fontSize: 9, marginRight: 8 },
});
