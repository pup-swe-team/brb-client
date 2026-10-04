import React, { useState } from 'react';
import {
  Image,
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

export default function ForgotPasswordScreen({
  navigation,
}: any) {
  const [emailOrUsername, setEmailOrUsername] =
    useState('');

  const [error, setError] = useState('');

  const handleSendEmail = () => {
    setError('');

    if (!emailOrUsername.trim()) {
      setError(
        'Please enter your PUP Webmail or Username.'
      );
      return;
    }

    navigation.navigate('PasswordResetSent');
  };

  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Password Reset
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        {/* PASSWORD RESET ICON */}
        <Image
          source={require('../../../../assets/password-reset.png')}
          style={styles.resetIcon}
          resizeMode="contain"
        />

        {/* DESCRIPTION */}
        <Text style={styles.description}>
          Enter your PUP Webmail that you used to
          {'\n'}
          register. We'll send you a link to reset your
          {'\n'}
          password.
        </Text>

        {/* EMAIL */}
        <View style={styles.emailSection}>

          <Text style={styles.label}>
            Email or Username
          </Text>

          <Input
            placeholder="Enter your PUP Webmail or Username"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            error={error}
          />

        </View>

        {/* SEND EMAIL */}
        <Pressable
          onPress={handleSendEmail}
          style={styles.sendButton}
        >
          <Text style={styles.sendButtonText}>
            Send Email
          </Text>
        </Pressable>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 85,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    // Header → Icon
    marginBottom: 68,
  },

  backButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 32,
    lineHeight: 34,
    color: colors.textSecondary,
    fontWeight: '300',
    marginTop: -3,
  },

  title: {
    color: colors.textSecondary,
    fontSize: 19,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 38,
  },

  /* ICON */

  resetIcon: {
    width: 150,
    height: 150,
    alignSelf: 'center',

    // Icon → Description
    marginBottom: 38,
  },

  /* DESCRIPTION */

  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',

    // Description → Email
    marginBottom: 38,
  },

  /* EMAIL */

  emailSection: {
    marginBottom: 27,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },

  /* SEND EMAIL */

  sendButton: {
    width: '100%',
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

});