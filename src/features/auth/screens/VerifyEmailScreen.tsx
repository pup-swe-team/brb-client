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

export default function VerifyEmailScreen({
  navigation,
  route,
}: any) {
  const email =
    route?.params?.email ||
    'danielo.ang@iskolarngbayan.pup.edu.ph';

  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* MAIN CARD */}
        <View style={styles.card}>

          {/* EMAIL ICON */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="mail-outline"
              size={32}
              color={colors.primary}
            />
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            Verify Your Email
          </Text>

          {/* DESCRIPTION */}
          <Text style={styles.description}>
            We sent a verification link to your PUP Webmail
          </Text>

          <Text style={styles.email}>
            {email}.
          </Text>

          <Text style={styles.description}>
            Open it to activate your account.
          </Text>

          {/* WARNING */}
          <View style={styles.warningBox}>
            <Ionicons
              name="time-outline"
              size={17}
              color="#9A6500"
              style={styles.warningIcon}
            />

            <Text style={styles.warningText}>
              Heads up: accounts that stay unverified are
              deactivated after 7 days, and you'll need to
              sign up again.
            </Text>
          </View>

          {/* RESEND EMAIL */}
          <Pressable
            style={({ pressed }) => [
              styles.resendButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('EmailVerified')
            }
          >
            <Text style={styles.resendText}>
              Resend Email
            </Text>
          </Pressable>

          {/* BACK TO LOGIN */}
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('Login')
            }
          >
            <Text style={styles.backText}>
              Back to Login
            </Text>
          </Pressable>

        </View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: '100%',
    alignItems: 'center',
  },

  iconCircle: {
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
  },

  email: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  warningBox: {
    width: '100%',
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
    backgroundColor: colors.goldSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 18,
    marginBottom: 14,
  },

  warningIcon: {
    marginRight: 9,
  },

  warningText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  resendButton: {
    width: '100%',
    height: 42,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  resendText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  backButton: {
    width: '100%',
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.75,
  },
});