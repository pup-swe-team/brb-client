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

export default function AccountSuspendedScreen({
  navigation,
}: any) {
  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* ICON */}

        <View style={styles.iconCircle}>
          <Ionicons
            name="ban-outline"
            size={31}
            color="#D94D61"
          />
        </View>

        {/* TITLE */}

        <Text style={styles.title}>
          Account Suspended
        </Text>

        {/* DESCRIPTION */}

        <Text style={styles.description}>
          Your CoPUP account can't be used right now.
          If you think this is a mistake, email us at
        </Text>

        <Text style={styles.email}>
          CoPUPsupport@gmail.com
        </Text>

        <Text style={styles.description}>
          and we’ll take a look.
        </Text>

        {/* BACK TO LOGIN */}

        <Pressable
          style={styles.button}
          onPress={() =>
            navigation.navigate('Login')
          }
        >
          <Text style={styles.buttonText}>
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
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 80,
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F9DDE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  title: {
    color: '#29252B',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },

  description: {
    color: '#65718D',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },

  email: {
    color: '#65718D',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },

  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#C5000B',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});