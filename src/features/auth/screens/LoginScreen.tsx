import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Input,
  ScreenContainer,
} from '../../../shared/components';

import { colors } from '../../../theme';

export default function LoginScreen({
  navigation,
}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleLogin() {
    setError(false);

    if (!email.trim() || !password.trim()) {
      setError(true);
      return;
    }

    navigation.navigate('Tabs');
  }

  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* BRB LOGO */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>BRB</Text>
        </View>

        {/* HEADER */}
        <Text style={styles.title}>
          Welcome back!
        </Text>

        <Text style={styles.subtitle}>
          Log in to keep borrowing and lending.
        </Text>

        {/* EMAIL */}
        <View style={styles.emailSection}>
          <Input
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError(false);
            }}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.passwordSection}>
          <Input
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(false);
            }}
            placeholder="Password"
            password
          />
        </View>

        {/* ERROR */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠</Text>

            <Text style={styles.errorText}>
              Incorrect email or password. Please try again. You
              have 2 attempts left before a 15-minute lock.
            </Text>
          </View>
        )}

        {/* FORGOT PASSWORD */}
        <Pressable
          style={styles.forgotButton}
          onPress={() =>
            navigation.navigate('ForgotPassword')
          }
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </Pressable>

        {/* LOGIN */}
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.loginButtonText}>
            Login
          </Text>
        </Pressable>

        {/* DIVIDER */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />

          <Text style={styles.orText}>
            or
          </Text>

          <View style={styles.divider} />
        </View>

        {/* SIGN UP */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            Don't have an account?{' '}
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate('Register')
            }
          >
            <Text style={styles.signupLink}>
              Sign up
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
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  /* LOGO */
  logo: {
    width: 52,
    height: 52,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  logoText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },

  /* HEADER */
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    marginBottom: 3,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 19,
  },

  /* EMAIL */
  emailSection: {
    marginBottom: 14,
  },

  /* PASSWORD */
  passwordSection: {
    marginBottom: 17,
  },

  /* ERROR */
  errorBox: {
    width: '100%',
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 9,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginBottom: 17,
  },

  errorIcon: {
    color: colors.error,
    fontSize: 19,
    marginRight: 10,
  },

  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 11,
    lineHeight: 16,
  },

  /* FORGOT PASSWORD */
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },

  forgotText: {
    color: colors.link,
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  /* LOGIN BUTTON */
  loginButton: {
    width: '100%',
    height: 46,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  /* DIVIDER */
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 22,
    marginBottom: 21,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  orText: {
    color: colors.textMuted,
    fontSize: 11,
    marginHorizontal: 14,
  },

  /* SIGN UP */
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  signupText: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  signupLink: {
    color: colors.link,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});