import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '../../../shared/components';
import { colors } from '../../../theme';

export default function TermsScreen({
  navigation,
}: any) {
  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        <View style={styles.card}>

          {/* HEADER */}
          <View style={styles.header}>

            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              TERMS & CONDITIONS
            </Text>

            <View style={styles.headerSpacer} />

          </View>

          {/* CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >

            <Text style={styles.updated}>
              Last updated: 01 / 10 / 2026
            </Text>

            <Text style={styles.bold}>
              Welcome to Borrow Return Borrow!
            </Text>

            <Text style={styles.paragraph}>
              By downloading, accessing, or using this app,
              you agree to be bound by these Terms and
              Conditions. If you do not agree, please do not
              use the app.
            </Text>

            <Text style={styles.section}>
              1. Use of the App
            </Text>

            <Text style={styles.paragraph}>
              You agree to use the app only for lawful
              purposes and in a way that does not harm,
              disrupt, or misuse the app or other users.
            </Text>

            <Text style={styles.section}>
              2. User Accounts
            </Text>

            <Text style={styles.paragraph}>
              If the app requires an account, you are
              responsible for keeping your login information
              secure and for all activities that occur under
              your account.
            </Text>

            <Text style={styles.section}>
              3. Content
            </Text>

            <Text style={styles.paragraph}>
              All content provided in the app is for general
              information purposes only. We reserve the
              right to modify or remove content at any time
              without notice.
            </Text>

            <Text style={styles.section}>
              4. Intellectual Property
            </Text>

            <Text style={styles.paragraph}>
              The app and its content, including text,
              graphics, logos, and design, are owned by
              [App Name] and are protected by applicable
              laws. You may not copy, distribute, or
              reproduce any part of this app without
              permission.
            </Text>

            <Text style={styles.section}>
              5. Limitation of Liability
            </Text>

            <Text style={styles.paragraph}>
              We are not responsible for any damages or
              losses resulting from your use of the app,
              including but not limited to technical issues,
              data loss, or service interruptions.
            </Text>

            <Text style={styles.section}>
              6. Termination
            </Text>

            <Text style={styles.paragraph}>
              We may suspend or terminate your access to
              the app at any time if you violate these Terms
              and Conditions.
            </Text>

            <Text style={styles.section}>
              7. Changes to These Terms
            </Text>

            <Text style={styles.paragraph}>
              We may update these Terms and Conditions from
              time to time. Continued use of the app means
              you accept any changes.
            </Text>

          </ScrollView>

        </View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 47,
  },

  /*
   * Figma-style outer panel
   */
  card: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 23,
    overflow: 'hidden',
  },

  /*
   * HEADER
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 10,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',

    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  backIcon: {
    fontSize: 32,
    lineHeight: 34,
    color: colors.textSecondary,
    fontWeight: '300',
    marginTop: -3,
  },

  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 7,
  },

  headerSpacer: {
    width: 38,
  },

  /*
   * TEXT AREA
   */
  content: {
    paddingHorizontal: 17,
    paddingBottom: 22,
  },

  updated: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 14,
  },

  bold: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    marginBottom: 13,
  },

  section: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    marginBottom: 0,
  },

  paragraph: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 6,
  },

});