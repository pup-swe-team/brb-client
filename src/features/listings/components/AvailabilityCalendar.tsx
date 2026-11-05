
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';

export type ReservedDateRange = {
  startDate: string;
  endDate: string;
};

type AvailabilityCalendarProps = {
  availableFrom?: string;
  availableTo?: string;
  start?: string;
  end?: string;
  reservedRanges?: ReservedDateRange[];
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CALENDAR_COLORS = {
  available: '#22A06B',
  availableBackground: '#E6F5ED',
  reserved: '#D97706',
  reservedBackground: '#FEF0DC',
  unavailable: '#9CA3AF',
  unavailableBackground: '#F1F2F4',
};

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function AvailabilityCalendar({
  availableFrom,
  availableTo,
  start,
  end,
  reservedRanges = [],
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initialDate = start ? parseISODate(start) : new Date();

    return new Date(
      initialDate.getFullYear(),
      initialDate.getMonth(),
      1,
    );
  });

  const today = toISODate(new Date());

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ).getDate();

    const blanks = firstDay.getDay();

    return [
      ...Array(blanks).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [currentMonth]);

  const isReserved = (date: string): boolean => {
    return reservedRanges.some(
      (range) =>
        date >= range.startDate && date <= range.endDate,
    );
  };

  const isAvailable = (date: string): boolean => {
    if (date < today) return false;

    if (availableFrom && date < availableFrom) return false;
    if (availableTo && date > availableTo) return false;

    if (isReserved(date)) return false;

    return true;
  };

  const isSelected = (date: string): boolean => {
    if (!start && !end) return false;

    if (start && end) {
      return date >= start && date <= end;
    }

    return date === start || date === end;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() - 1,
        1,
      ),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth((previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + 1,
        1,
      ),
    );
  };

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.header}>
        <Pressable
          onPress={goToPreviousMonth}
          style={styles.arrowButton}
          accessibilityLabel="Previous month"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.monthTitle}>{monthLabel}</Text>

        <Pressable
          onPress={goToNextMonth}
          style={styles.arrowButton}
          accessibilityLabel="Next month"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text}
          />
        </Pressable>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day) => (
          <View key={day} style={styles.dayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar dates */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <View
                key={`blank-${index}`}
                style={styles.dayCell}
              />
            );
          }

          const date = toISODate(
            new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day,
            ),
          );

          const reserved = isReserved(date);
          const available = isAvailable(date);
          const selected = isSelected(date);
          const isToday = date === today;

          const unavailable = !available && !reserved;

          return (
            <View key={date} style={styles.dayCell}>
              <View
                style={[
                  styles.day,
                  available && styles.availableDay,
                  unavailable && styles.unavailableDay,
                  reserved && styles.reservedDay,
                  selected && styles.selectedDay,
                  isToday && !selected && styles.todayDay,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    available && styles.availableDayText,
                    unavailable && styles.unavailableDayText,
                    reserved && styles.reservedDayText,
                    selected && styles.selectedDayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, styles.availableDot]}
          />
          <Text style={styles.legendText}>Available</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, styles.reservedDot]}
          />
          <Text style={styles.legendText}>Reserved</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, styles.unavailableDot]}
          />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  arrowButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.2857%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayText: {
    fontSize: 13,
    color: colors.text,
  },

  // Available dates - Green
  availableDay: {
    backgroundColor: CALENDAR_COLORS.availableBackground,
  },

  availableDayText: {
    color: CALENDAR_COLORS.available,
    fontWeight: '600',
  },

  // Reserved dates - Orange
  reservedDay: {
    backgroundColor: CALENDAR_COLORS.reservedBackground,
  },

  reservedDayText: {
    color: CALENDAR_COLORS.reserved,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },

  // Unavailable dates - Gray
  unavailableDay: {
    backgroundColor: CALENDAR_COLORS.unavailableBackground,
  },

  unavailableDayText: {
    color: CALENDAR_COLORS.unavailable,
  },

  // Selected dates
  selectedDay: {
    backgroundColor: colors.primary,
  },

  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'none',
  },

  // Today's date
  todayDay: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  availableDot: {
    backgroundColor: CALENDAR_COLORS.available,
  },

  reservedDot: {
    backgroundColor: CALENDAR_COLORS.reserved,
  },

  unavailableDot: {
    backgroundColor: CALENDAR_COLORS.unavailable,
  },

  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
