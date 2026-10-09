import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '../../../shared/components';
import { colors } from '../../../theme';

export default function EmailVerifiedScreen({
  navigation,
}: any) {
  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* SUCCESS ICON */}
        <View style={styles.successCircle}>
          <Ionicons
            name="checkmark"
            size={34}
            color={colors.success}
          />
        </View>

        {/* TITLE */}
        <Text style={styles.title}>
          Email Verified!
        </Text>

        {/* DESCRIPTION */}
        <Text style={styles.description}>
          You're in, Iskolar ng Bayan! Log in and verify
          {'\n'}
          your identity next so you can borrow and lend.
        </Text>

        {/* CONTINUE */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            navigation.navigate('Login')
          }
        >
          <Text style={styles.buttonText}>
            Continue to Login
          </Text>
        </Pressable>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },

  button: {
    width: '100%',
    height: 42,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.8,
  },
});