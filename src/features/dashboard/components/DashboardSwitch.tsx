import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';

export type DashboardRole = 'Borrower' | 'Lender';

// OWNER: Member A. CP-203 Build dashboard-switch control for dual-role users.
// Extracted from ProfileScreen so Danielo (Borrower dashboard) and Member A can
// work without touching the same lines.
// Only dual-role users see the switch. Everyone else stays on the Borrower view (HTML 20, 22).
//   hasLenderRole is optional and defaults to true, so the current ProfileScreen call keeps working
//   unchanged. Once ProfileScreen passes the real value, users without the Lender role get no switch.
export function DashboardSwitch({
  role,
  onChange,
  hasLenderRole = true,
}: {
  role: DashboardRole;
  onChange: (role: DashboardRole) => void;
  hasLenderRole?: boolean;
}) {
  // A user without the Lender role can never be left on the Lender dashboard.
  useEffect(() => {
    if (!hasLenderRole && role !== 'Borrower') onChange('Borrower');
  }, [hasLenderRole, role, onChange]);

  if (!hasLenderRole) return null;

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