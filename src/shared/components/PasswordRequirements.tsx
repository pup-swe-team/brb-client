import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, text } from '../../theme';

export type PasswordChecks = {
  length: boolean;
  mixedCase: boolean;
  special: boolean;
};

// Same rules as RegisterScreen: 8+ characters, upper AND lower case, one special symbol.
export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const checks = getPasswordChecks(password);
  return checks.length && checks.mixedCase && checks.special;
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View
      style={s.row}
      accessibilityLabel={`${label}: ${met ? 'met' : 'not met yet'}`}
    >
      {/* Icon shape changes too, so the state never relies on color alone. */}
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={met ? colors.success : colors.textMuted}
      />
      <Text style={[text.caption, met && { color: colors.success }]}>{label}</Text>
    </View>
  );
}

// "Your password must contain:" checklist used by every new-password form.
export function PasswordRequirements({ password }: { password: string }) {
  const checks = getPasswordChecks(password);
  return (
    <View style={s.wrap}>
      <Text style={text.caption}>Your password must contain:</Text>
      <Requirement met={checks.length} label="At least 8 characters" />
      <Requirement met={checks.mixedCase} label="Uppercase and lowercase letters" />
      <Requirement met={checks.special} label="Special symbols" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
