import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '../../../shared/components';
import { colors } from '../../../theme';

export default function PasswordResetSentScreen({
  navigation,
}: any) {
  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* PASSWORD RESET SENT ICON */}
        <Image
          source={require('../../../../assets/password-reset-sent.png')}
          style={styles.sentIcon}
          resizeMode="contain"
        />

        {/* TITLE */}
        <Text style={styles.title}>
          Password Reset Email Sent!
        </Text>

        {/* DESCRIPTION */}
        <Text style={styles.description}>
          Follow the instruction sent in your PUP
          {'\n'}
          Webmail to reset your password.
        </Text>

        {/* BACK TO LOGIN */}
        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backButtonText}>
            Back to Login
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
    paddingHorizontal: 17,

    // Move the whole content slightly down
    paddingTop: 175,
  },

  /*
   * Envelope icon
   */
  sentIcon: {
    width: 150,
    height: 115,

    // Icon → Title
    marginBottom: 48,
  },

  /*
   * Title
   */
  title: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',

    // Title → Description
    marginBottom: 30,
  },

  /*
   * Description
   */
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',

    // Description → Button
    marginBottom: 48,
  },

  /*
   * Back to Login
   */
  backButton: {
    width: '100%',
    height: 39,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.7,
  },

});