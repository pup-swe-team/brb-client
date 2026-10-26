import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';

export type DashboardRole = 'Borrower' | 'Lender';

// OWNER: Member A. CP-203 Build dashboard-switch control for dual-role users.
// Extracted from ProfileScreen so Danielo (Borrower dashboard) and Member A can
// work without touching the same lines. Today it always offers both roles.
// TODO (Member A): only show the Lender option for users who have the Lender
// role, and keep the Borrower view as the default (HTML 20, 22).
export function DashboardSwitch({ role, onChange }: { role: DashboardRole; onChange: (role: DashboardRole) => void }) {
  const options: DashboardRole[] = ['Borrower', 'Lender'];
  return (
    <View style={s.container}>
      {options.map((option) => {
        const active = role === option;
        return (
          <Pressable
            key={option}
            style={[s.button, active && s.buttonActive]}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.label, active && s.labelActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
    borderRadius: radius.button,
    padding: 2,
  },
  button: { flex: 1, height: 31, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  buttonActive: { backgroundColor: colors.primary },
  label: { color: colors.primaryDark, fontSize: 10, fontWeight: '600' },
  labelActive: { color: colors.white },
});
