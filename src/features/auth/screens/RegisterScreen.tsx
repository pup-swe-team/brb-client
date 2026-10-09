import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer, Input } from '../../../shared/components';
import { colors } from '../../../theme';

type Affiliation = 'Student' | 'Faculty' | 'Staff';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] =
    useState<Affiliation | null>(null);
  const [contactNumber, setContactNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [error, setError] = useState('');

  const isPupEmail =
    email.toLowerCase().endsWith('@pup.edu.ph') ||
    email
      .toLowerCase()
      .endsWith('@iskolarngbayan.pup.edu.ph');

  const showEmailError =
    email.length > 0 && !isPupEmail;

  const hasEightCharacters =
    password.length >= 8;

  const hasUppercase =
    /[A-Z]/.test(password);

  const hasLowercase =
    /[a-z]/.test(password);

  const hasSpecialSymbol =
    /[^A-Za-z0-9]/.test(password);

  function handleSignUp() {
    setError('');

    if (
      !fullName.trim() ||
      !email.trim() ||
      !affiliation ||
      !contactNumber.trim() ||
      !homeAddress.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please complete all required fields.');
      return;
    }

    if (!isPupEmail) {
      setError('Please use a valid PUP Webmail.');
      return;
    }

    if (!hasEightCharacters) {
      setError(
        'Password must contain at least 8 characters.'
      );
      return;
    }

    if (
      !hasUppercase ||
      !hasLowercase ||
      !hasSpecialSymbol
    ) {
      setError(
        'Password must contain uppercase, lowercase, and special symbols.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError(
        'Please agree to the Terms and Conditions and Privacy Policy.'
      );
      return;
    }

    navigation.navigate('VerifyEmail', {
      email,
    });
  }

  return (
    <ScreenContainer auth>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* LOGO */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>BRB</Text>
        </View>

        {/* HEADER */}
        <Text style={styles.title}>
          Create your account
        </Text>

        <Text style={styles.subtitle}>
          Join the sharing, Iskolar ng Bayan.
        </Text>

        {/* FULL NAME */}
        <View style={styles.field}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              setError('');
            }}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
        </View>

        {/* PUP WEBMAIL */}
        <View style={styles.field}>
          <Input
            label="PUP Webmail"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="Enter your PUP Webmail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {showEmailError && (
            <View style={styles.emailErrorContainer}>
              <Text style={styles.emailErrorIcon}>
                ⚠
              </Text>

              <Text style={styles.emailErrorText}>
                Please use your PUP Webmail:
                {' '}
                <Text style={styles.emailErrorBold}>
                  @iskolarngbayan.pup.edu.ph
                </Text>
                {' '}
                (Student) or
                {' '}
                <Text style={styles.emailErrorBold}>
                  @pup.edu.ph
                </Text>
                {' '}
                (Faculty/Staff).
              </Text>
            </View>
          )}
        </View>

        {/* AFFILIATION */}
        <View style={styles.affiliationSection}>
          <Text style={styles.label}>
            PUP Affiliation{' '}
            <Text style={styles.required}>*</Text>
          </Text>

          <View style={styles.affiliationRow}>
            {(
              [
                'Student',
                'Faculty',
                'Staff',
              ] as Affiliation[]
            ).map((item) => {
              const selected =
                affiliation === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    setAffiliation(item);
                    setError('');
                  }}
                  style={[
                    styles.affiliationButton,
                    selected &&
                      styles.affiliationSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.affiliationText,
                      selected &&
                        styles.affiliationSelectedText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* CONTACT NUMBER */}
        <View style={styles.field}>
          <Input
            label="Contact Number"
            value={contactNumber}
            onChangeText={(value) => {
              setContactNumber(value);
              setError('');
            }}
            placeholder="Enter your contact number"
            keyboardType="phone-pad"
          />
        </View>

        {/* HOME ADDRESS */}
        <View style={styles.field}>
          <Input
            label="Home Address"
            value={homeAddress}
            onChangeText={(value) => {
              setHomeAddress(value);
              setError('');
            }}
            placeholder="Enter your home address"
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.passwordSection}>
          <Input
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            placeholder="Enter your password"
            password
          />

          <Text style={styles.requirementsTitle}>
            Your password must contain:
          </Text>

          <Text style={styles.requirement}>
            <Text
              style={
                hasEightCharacters
                  ? styles.valid
                  : styles.check
              }
            >
              ✓
            </Text>
            {'  '}
            At least 8 characters
          </Text>

          <Text style={styles.requirement}>
            <Text
              style={
                hasUppercase && hasLowercase
                  ? styles.valid
                  : styles.check
              }
            >
              ✓
            </Text>
            {'  '}
            Uppercase and lowercase letters
          </Text>

          <Text style={styles.requirement}>
            <Text
              style={
                hasSpecialSymbol
                  ? styles.valid
                  : styles.check
              }
            >
              ✓
            </Text>
            {'  '}
            Special symbols
          </Text>
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.confirmSection}>
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError('');
            }}
            placeholder="Confirm your password"
            password
          />
        </View>

        {/* GENERAL ERROR */}
        {error ? (
          <Text style={styles.generalError}>
            {error}
          </Text>
        ) : null}

        {/* TERMS */}
        <Pressable
          style={styles.checkboxRow}
          onPress={() => {
            setAgreeTerms(!agreeTerms);
            setError('');
          }}
        >
          <View
            style={[
              styles.checkbox,
              agreeTerms &&
                styles.checkboxChecked,
            ]}
          >
            {agreeTerms && (
              <Text style={styles.checkmark}>
                ✓
              </Text>
            )}
          </View>

          <Text style={styles.checkboxText}>
            I agree to the{' '}
            <Text
              style={styles.link}
              onPress={() =>
                navigation.navigate('Terms')
              }
            >
              Terms and Conditions
            </Text>
          </Text>
        </Pressable>

        {/* PRIVACY */}
        <Pressable
          style={styles.checkboxRow}
          onPress={() => {
            setAgreePrivacy(!agreePrivacy);
            setError('');
          }}
        >
          <View
            style={[
              styles.checkbox,
              agreePrivacy &&
                styles.checkboxChecked,
            ]}
          >
            {agreePrivacy && (
              <Text style={styles.checkmark}>
                ✓
              </Text>
            )}
          </View>

          <Text style={styles.checkboxText}>
            I agree to the{' '}
            <Text
              style={styles.link}
              onPress={() =>
                navigation.navigate('Privacy')
              }
            >
              Privacy Policy
            </Text>
          </Text>
        </Pressable>

        {/* SIGN UP */}
        <Pressable
          onPress={handleSignUp}
          style={({ pressed }) => [
            styles.signUpButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.signUpText}>
            Sign Up
          </Text>
        </Pressable>

        {/* LOGIN */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate('Login')
            }
          >
            <Text style={styles.loginLink}>
              Login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 7,
    paddingBottom: 18,
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  logoText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  title: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '700',
    marginBottom: 1,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    marginBottom: 10,
  },

  field: {
    marginBottom: 9,
  },

  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },

  required: {
    color: colors.primary,
  },

  emailErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
    paddingHorizontal: 1,
  },

  emailErrorIcon: {
    color: colors.error,
    fontSize: 11,
    marginRight: 4,
    lineHeight: 13,
  },

  emailErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 8.5,
    lineHeight: 11,
  },

  emailErrorBold: {
    fontWeight: '600',
  },

  affiliationSection: {
    marginBottom: 9,
  },

  affiliationRow: {
    flexDirection: 'row',
    gap: 7,
  },

  affiliationButton: {
    flex: 1,
    height: 30,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  affiliationSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  affiliationText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '500',
  },

  affiliationSelectedText: {
    color: colors.white,
    fontWeight: '600',
  },

  passwordSection: {
    marginBottom: 7,
  },

  requirementsTitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 5,
    marginBottom: 3,
  },

  requirement: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    marginBottom: 2,
  },

  check: {
    color: colors.textSecondary,
  },

  valid: {
    color: colors.success,
  },

  confirmSection: {
    marginBottom: 6,
  },

  generalError: {
    color: colors.error,
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 5,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkmark: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  checkboxText: {
    color: colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },

  link: {
    color: colors.link,
    textDecorationLine: 'underline',
  },

  signUpButton: {
    height: 39,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  signUpText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  loginLink: {
    color: colors.link,
    fontSize: 10,
    textDecorationLine: 'underline',
  },
});