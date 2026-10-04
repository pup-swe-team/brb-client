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

export default function PrivacyScreen({
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
              PRIVACY POLICY
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
              Borrow Return Borrow values your privacy.
            </Text>

            <Text style={styles.paragraph}>
              This Privacy Policy explains how we collect,
              use, and protect your information when you use
              our app.
            </Text>

            <Text style={styles.section}>
              1. Information We Collect
            </Text>

            <Text style={styles.paragraph}>
              We may collect the following types of
              information:
            </Text>

            <Text style={styles.bullet}>
              • Personal Information: such as name, email
              address, or username (if provided by you)
            </Text>

            <Text style={styles.bullet}>
              • Usage Information: such as app interactions,
              features used, and basic device information
            </Text>

            <Text style={styles.section}>
              2. How We Use Your Information
            </Text>

            <Text style={styles.paragraph}>
              We use the collected information to:
            </Text>

            <Text style={styles.bullet}>
              • Provide and improve the app's features and
              functionality
            </Text>

            <Text style={styles.bullet}>
              • Communicate with you about updates or
              support
            </Text>

            <Text style={styles.bullet}>
              • Ensure the security and proper operation of
              the app
            </Text>

            <Text style={styles.section}>
              3. Sharing of Information
            </Text>

            <Text style={styles.paragraph}>
              We do not sell or rent your personal
              information. We may share information only
              when:
            </Text>

            <Text style={styles.bullet}>
              • Required by law
            </Text>

            <Text style={styles.bullet}>
              • Necessary to protect the rights, safety, or
              security of users or the app
            </Text>

            <Text style={styles.section}>
              4. Data Security
            </Text>

            <Text style={styles.paragraph}>
              We take reasonable measures to protect your
              information from unauthorized access, loss,
              or misuse. However, no method of electronic
              storage is 100% secure.
            </Text>

            <Text style={styles.section}>
              5. Third-Party Services
            </Text>

            <Text style={styles.paragraph}>
              The app may use third-party services (such as
              analytics or hosting providers). These
              services may collect information according to
              their own privacy policies.
            </Text>

            <Text style={styles.section}>
              6. Children's Privacy
            </Text>

            <Text style={styles.paragraph}>
              The app is not intended for children under the
              age of 13. We do not knowingly collect
              personal information from children.
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
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 14,
  },

  bold: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    marginBottom: 13,
  },

  section: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    marginBottom: 0,
  },

  paragraph: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 6,
  },

  bullet: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginLeft: 6,
    marginBottom: 2,
  },

});