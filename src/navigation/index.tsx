import React from 'react';
import { Text } from 'react-native';

import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';

/* =========================================================
   AUTH SCREENS
========================================================= */

import LandingScreen from '../features/auth/screens/LandingScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import VerifyEmailScreen from '../features/auth/screens/VerifyEmailScreen';
import EmailVerifiedScreen from '../features/auth/screens/EmailVerifiedScreen';
import AccountSuspendedScreen from '../features/auth/screens/AccountSuspendedScreen';
import SignUpMessageScreen from '../features/auth/screens/SignUpMessageScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';
import PasswordResetSentScreen from '../features/auth/screens/PasswordResetSentScreen';
import TermsScreen from '../features/auth/screens/TermsScreen';
import PrivacyScreen from '../features/auth/screens/PrivacyScreen';

/* =========================================================
   DASHBOARD
========================================================= */

import HomeScreen from '../features/dashboard/screens/HomeScreen';
import { ComponentGallery } from '../features/gallery/ComponentGallery';

/* =========================================================
   LISTINGS
========================================================= */

import SearchScreen from '../features/listings/screens/SearchScreen';

/* =========================================================
   PROFILE
========================================================= */

import ProfileScreen from '../features/profile/screens/ProfileScreen';
import VerifyIdentityScreen from '../features/profile/screens/VerifyIdentityScreen';

/* =========================================================
   SHARED
========================================================= */

import { ScreenContainer } from '../shared/components';
import { colors } from '../theme';

/* =========================================================
   TYPES
========================================================= */

import type {
  RootStackParamList,
  TabParamList,
} from './types';

/* =========================================================
   NAVIGATORS
========================================================= */

const Stack =
  createNativeStackNavigator<RootStackParamList>();

const Tab =
  createBottomTabNavigator<TabParamList>();

/* =========================================================
   TEMPORARY STUB SCREEN
========================================================= */

function StubScreen({
  label,
}: {
  label: string;
}) {
  return (
    <ScreenContainer>
      <Text>{label}</Text>
    </ScreenContainer>
  );
}

/* =========================================================
   MAIN TAB NAVIGATION
========================================================= */

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textMuted,

        tabBarStyle: {
          backgroundColor:
            colors.white,

          borderTopColor:
            colors.border,

          height: 70,

          paddingTop: 6,

          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
        },

        tabBarIcon: ({
          color,
          size,
          focused,
        }) => {
          let iconName:
            keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused
                ? 'home'
                : 'home-outline';
              break;

            case 'Search':
              iconName = focused
                ? 'search'
                : 'search-outline';
              break;

            case 'AddItem':
              iconName = focused
                ? 'add-circle'
                : 'add-circle-outline';
              break;

            case 'Chat':
              iconName = focused
                ? 'chatbubbles'
                : 'chatbubbles-outline';
              break;

            case 'Profile':
              iconName = focused
                ? 'person'
                : 'person-outline';
              break;

            default:
              iconName =
                'ellipse-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      {/* =================================================
          HOME
      ================================================= */}

      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />

      {/* =================================================
          SEARCH
      ================================================= */}

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
        }}
      />

      {/* =================================================
          ADD ITEM
          TEMPORARY UNTIL ADD ITEM SCREEN IS READY
      ================================================= */}

      <Tab.Screen
        name="AddItem"
        children={() => (
          <StubScreen
            label="Add Item"
          />
        )}
        options={{
          title: 'Add Item',
        }}
      />

      {/* =================================================
          CHAT
          TEMPORARY UNTIL CHAT SCREEN IS READY
      ================================================= */}

      <Tab.Screen
        name="Chat"
        children={() => (
          <StubScreen
            label="Chat"
          />
        )}
        options={{
          title: 'Chat',
        }}
      />

      {/* =================================================
          PROFILE
      ================================================= */}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

/* =========================================================
   ROOT NAVIGATION
========================================================= */

export function RootNavigator() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,

        colors: {
          ...DefaultTheme.colors,

          background:
            colors.bg,

          card:
            colors.white,

          text:
            colors.text,

          border:
            colors.border,

          primary:
            colors.primary,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* =================================================
            AUTHENTICATION
        ================================================= */}

        <Stack.Screen
          name="Landing"
          component={LandingScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
        />

        <Stack.Screen
          name="EmailVerified"
          component={EmailVerifiedScreen}
        />

        <Stack.Screen
          name="AccountSuspended"
          component={AccountSuspendedScreen}
        />

        <Stack.Screen
          name="SignUpMessage"
          component={SignUpMessageScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="PasswordResetSent"
          component={PasswordResetSentScreen}
        />

        <Stack.Screen
          name="Terms"
          component={TermsScreen}
        />

        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
        />

        {/* =================================================
            MAIN APPLICATION
        ================================================= */}

        <Stack.Screen
          name="Tabs"
          component={MainTabs}
        />

      <Stack.Screen
        name="VerifyIdentity"
        component={VerifyIdentityScreen}
        />

        {/* =================================================
            COMPONENT GALLERY
        ================================================= */}

        <Stack.Screen
          name="Gallery"
          component={ComponentGallery}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;