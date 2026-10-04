import React from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../theme';

export default function SignUpMessageScreen({
  navigation,
}: any) {
  return (
    <View style={styles.screen}>

      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
      />

      <View style={styles.content}>

        {/* LOGO */}
        <Image
          source={require('../../../../assets/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* WELCOME MESSAGE */}
        <Text style={styles.welcomeText}>
          Welcome to BRB,
          {'\n'}
          Iskolar ng Bayan!
        </Text>

        {/* SUBTITLE */}
        <Text style={styles.subtitle}>
          Join the sharing
        </Text>

        {/* START BROWSING */}
        <Pressable
          onPress={() => navigation.navigate('Tabs')}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Start Browsing
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  /*
   * FULL RED BACKGROUND
   */
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  /*
   * MAIN CONTENT
   */
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 178,
  },

  /*
   * LOGO
   */
  logo: {
    width: 183,
    height: 183,
    alignSelf: 'center',
    marginBottom: 31,
  },

  /*
   * WELCOME MESSAGE
   */
  welcomeText: {
    width: '100%',
    color: colors.white,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
  },

  /*
   * SUBTITLE
   */
  subtitle: {
    width: '100%',
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },

  /*
   * START BROWSING
   */
  button: {
  position: 'absolute',
  left: '6%',
  right: '6%',
  bottom: 215,
  height: 53,
  backgroundColor: colors.white,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
},

  buttonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

});