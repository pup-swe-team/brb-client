import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { Button } from '../../../shared/components';
import { Input } from '../../../shared/components/Input';
import { CATEGORIES, EMPTY_FILTERS, LOCATIONS, RATING_OPTIONS, SearchFilters } from '../types';

type Props = {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(v: string) {
  if (!DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

type DateErrors = { from?: string; to?: string };
function validate(f: SearchFilters): DateErrors {
  const from = f.availableFrom.trim();
  const to = f.availableTo.trim();
  const e: DateErrors = {};
  if (from && !isValidDate(from)) e.from = 'Use YYYY-MM-DD, e.g. 2026-11-05';
  if (to && !isValidDate(to)) e.to = 'Use YYYY-MM-DD, e.g. 2026-11-08';
  if (!e.from && !e.to && from && to && to < from) e.to = 'End date must be on or after the start date.';
  return e;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FilterContent({
  filters,
  onApply,
  onClose,
}: {
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const [errors, setErrors] = useState<DateErrors>({});

  const apply = () => {
    const e = validate(draft);
    setErrors(e);
    if (e.from || e.to) return;
    onApply({ ...draft, availableFrom: draft.availableFrom.trim(), availableTo: draft.availableTo.trim() });
  };

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setErrors({});
  };

  return (
    <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close filters" />

      <View style={s.sheet}>
        <View style={s.sheetHeader}>
          <Text style={s.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
          <View style={s.section}>
            <Text style={s.label}>Category</Text>
            <View style={s.chips}>
              <Chip label="All" active={draft.category === null} onPress={() => setDraft({ ...draft, category: null })} />
              {CATEGORIES.map((c) => (
                <Chip key={c} label={c} active={draft.category === c} onPress={() => setDraft({ ...draft, category: c })} />
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.label}>Location</Text>
            <View style={s.chips}>
              <Chip label="All" active={draft.location === null} onPress={() => setDraft({ ...draft, location: null })} />
              {LOCATIONS.map((l) => (
                <Chip key={l} label={l} active={draft.location === l} onPress={() => setDraft({ ...draft, location: l })} />
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.label}>Minimum rating</Text>
            <View style={s.chips}>
              {RATING_OPTIONS.map((r) => (
                <Chip
                  key={r.label}
                  label={r.label}
                  active={draft.minRating === r.value}
                  onPress={() => setDraft({ ...draft, minRating: r.value })}
                />
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.label}>Availability dates</Text>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="From"
                  placeholder="YYYY-MM-DD"
                  value={draft.availableFrom}
                  onChangeText={(v) => setDraft({ ...draft, availableFrom: v })}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  autoCorrect={false}
                  error={errors.from}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="To"
                  placeholder="YYYY-MM-DD"
                  value={draft.availableTo}
                  onChangeText={(v) => setDraft({ ...draft, availableTo: v })}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  autoCorrect={false}
                  error={errors.to}
                />
              </View>
            </View>
            <Text style={s.hint}>Shows listings that are available for the whole range. One date works too.</Text>
          </View>
        </ScrollView>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button title="Reset" variant="secondary" onPress={reset} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Apply" onPress={apply} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function FilterModal({ visible, filters, onApply, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <FilterContent filters={filters} onApply={onApply} onClose={onClose} />
      ) : null}
    </Modal>
  );
}

        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.title}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
            <View style={s.section}>
              <Text style={s.label}>Category</Text>
              <View style={s.chips}>
                <Chip label="All" active={draft.category === null} onPress={() => setDraft({ ...draft, category: null })} />
                {CATEGORIES.map((c) => (
                  <Chip key={c} label={c} active={draft.category === c} onPress={() => setDraft({ ...draft, category: c })} />
                ))}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.label}>Location</Text>
              <View style={s.chips}>
                <Chip label="All" active={draft.location === null} onPress={() => setDraft({ ...draft, location: null })} />
                {LOCATIONS.map((l) => (
                  <Chip key={l} label={l} active={draft.location === l} onPress={() => setDraft({ ...draft, location: l })} />
                ))}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.label}>Minimum rating</Text>
              <View style={s.chips}>
                {RATING_OPTIONS.map((r) => (
                  <Chip
                    key={r.label}
                    label={r.label}
                    active={draft.minRating === r.value}
                    onPress={() => setDraft({ ...draft, minRating: r.value })}
                  />
                ))}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.label}>Availability dates</Text>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="From"
                    placeholder="YYYY-MM-DD"
                    value={draft.availableFrom}
                    onChangeText={(v) => setDraft({ ...draft, availableFrom: v })}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    autoCorrect={false}
                    error={errors.from}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="To"
                    placeholder="YYYY-MM-DD"
                    value={draft.availableTo}
                    onChangeText={(v) => setDraft({ ...draft, availableTo: v })}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    autoCorrect={false}
                    error={errors.to}
                  />
                </View>
              </View>
              <Text style={s.hint}>Shows listings that are available for the whole range. One date works too.</Text>
            </View>
          </ScrollView>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Button title="Reset" variant="secondary" onPress={reset} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Apply" onPress={apply} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '88%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  body: { gap: spacing.md, paddingBottom: spacing.sm },
  section: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.primaryDark, fontSize: 10, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  row: { flexDirection: 'row', gap: spacing.sm },
  hint: { color: colors.textSecondary, fontSize: 9 },
});