import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../theme';
import { getAccessToken } from '../../../services/http';

export default function LandingScreen({ navigation }: any) {
  // Landing is always the first screen. If a session is already saved, Get
  // Started resumes it (Tabs); otherwise it goes to Login.
  const handleGetStarted = async () => {
    try {
      const token = await getAccessToken();
      navigation.navigate(token ? 'Tabs' : 'Login');
    } catch {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.screen}>

      <StatusBar
        barStyle="light-content"
      />

      <ImageBackground
        source={require('../../../../assets/landing-background.png')}
        style={styles.background}
        resizeMode="cover"
      >

        <View style={styles.content}>

          {/* BRB Logo */}
          <Image
            source={require('../../../../assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Landing Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Your Campus Library,
            </Text>

            <Text style={styles.subtitle}>
              Powered by Students.
            </Text>
          </View>

          {/* Get Started Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>
              Get Started
            </Text>
          </Pressable>

        </View>

      </ImageBackground>

    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  logo: {
    width: 190,
    height: 190,
    marginBottom: 28,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: 130,
  },

  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  button: {
    width: '100%',
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },

});