import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '../../../shared/components';
import { colors } from '../../../theme';
import {
  extractApiError,
  verifyEmail,
} from '../services/authService';

function extractUidToken(raw: string): {
  uid?: string;
  token?: string;
} {
  const parsed = Linking.parse(raw.trim());
  const query = parsed.queryParams ?? {};

  const first = (v?: string | string[]) =>
    Array.isArray(v) ? v[0] : v;

  const uid = first(
    query.uid ?? query.user_id ?? query.uidb64,
  );
  const token = first(query.token ?? query.tokenb64);

  if (uid && token) return { uid, token };

  const segments = (parsed.path ?? '')
    .split('/')
    .filter(Boolean);
  const last = segments.pop();
  const second = segments.pop();

  if (last && second) return { uid: second, token: last };

  return {};
}

export default function VerifyEmailScreen({
  navigation,
  route,
}: any) {
  const email =
    route?.params?.email ||
    'danielo.ang@iskolarngbayan.pup.edu.ph';

  const uid = route?.params?.uid;
  const token = route?.params?.token;

  const [verifying, setVerifying] = useState(
    Boolean(uid && token),
  );
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');

  const runVerification = useCallback(
    async (u: string, t: string) => {
      try {
        await verifyEmail(u, t);
        navigation.replace('EmailVerified');
      } catch (err) {
        setError(extractApiError(err));
        setVerifying(false);
      }
    },
    [navigation],
  );

  useEffect(() => {
    if (!uid || !token) return;

    verifyEmail(uid, token)
      .then(() => navigation.replace('EmailVerified'))
      .catch((err: unknown) => {
        setError(extractApiError(err));
        setVerifying(false);
      });
  }, [uid, token, navigation]);

  const deepLinked = Boolean(uid && token);

  const openModal = () => {
    setLinkInput('');
    setLinkError('');
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const handleSubmitLink = async () => {
    const parsed = extractUidToken(linkInput);

    if (!parsed.uid || !parsed.token) {
      setLinkError(
        "Couldn't find uid and token in that link. Paste the full link from the verification email.",
      );
      return;
    }

    setVerifying(true);
    setError('');
    closeModal();
    runVerification(parsed.uid, parsed.token);
  };

  return (
    <ScreenContainer auth>
      <View style={styles.container}>

        {/* MAIN CARD */}
        <View style={styles.card}>

          {/* EMAIL ICON */}
          <View style={styles.iconCircle}>
            {verifying ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <Ionicons
                name="mail-outline"
                size={32}
                color={colors.primary}
              />
            )}
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            {deepLinked
              ? 'Verifying your email'
              : 'Verify Your Email'}
          </Text>

          {/* DESCRIPTION */}
          {!deepLinked && (
            <>
              <Text style={styles.description}>
                We sent a verification link to your PUP Webmail
              </Text>

              <Text style={styles.email}>
                {email}.
              </Text>

              <Text style={styles.description}>
                Open it to activate your account.
              </Text>
            </>
          )}

          {deepLinked && !verifying && !error && (
            <Text style={styles.description}>
              Hang tight, we&apos;re confirming your link.
            </Text>
          )}

          {/* ERROR */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* WARNING */}
          {!deepLinked && (
            <View style={styles.warningBox}>
              <Ionicons
                name="time-outline"
                size={17}
                color="#9A6500"
                style={styles.warningIcon}
              />

              <Text style={styles.warningText}>
                Heads up: accounts that stay unverified are
                deactivated after 7 days, and you&apos;ll need to
                sign up again.
              </Text>
            </View>
          )}

          {/* RESEND EMAIL */}
          {!deepLinked && (
            <Pressable
              style={({ pressed }) => [
                styles.resendButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                navigation.navigate('EmailVerified')
              }
            >
              <Text style={styles.resendText}>
                Resend Email
              </Text>
            </Pressable>
          )}

          {/* PASTE VERIFICATION LINK */}
          {!deepLinked && (
            <Pressable
              style={({ pressed }) => [
                styles.pasteButton,
                pressed && styles.pressed,
              ]}
              onPress={openModal}
            >
              <Text style={styles.pasteText}>
                Paste verification link
              </Text>
            </Pressable>
          )}

          {/* BACK TO LOGIN */}
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('Login')
            }
          >
            <Text style={styles.backText}>
              Back to Login
            </Text>
          </Pressable>

        </View>

        {/* PASTE LINK MODAL */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>

              <Text style={styles.modalTitle}>
                Paste your verification link
              </Text>

              <Text style={styles.modalHint}>
                Copy the full link from the verification email
                (it prints in the backend terminal when you
                register) and paste it below.
              </Text>

              <TextInput
                style={styles.linkInput}
                value={linkInput}
                onChangeText={setLinkInput}
                placeholder="https://…?uid=…&token=…"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                multiline
                editable={!verifying}
              />

              {linkError ? (
                <Text style={styles.linkErrorText}>
                  {linkError}
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.submitLinkButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleSubmitLink}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.white}
                  />
                ) : (
                  <Text style={styles.submitLinkText}>
                    Verify
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.pressed,
                ]}
                onPress={closeModal}
                disabled={verifying}
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </Pressable>

            </View>
          </View>
        </Modal>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: '100%',
    alignItems: 'center',
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },

  email: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  warningBox: {
    width: '100%',
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
    backgroundColor: colors.goldSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 18,
    marginBottom: 14,
  },

  warningIcon: {
    marginRight: 9,
  },

  warningText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  resendButton: {
    width: '100%',
    height: 42,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  resendText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  backButton: {
    width: '100%',
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  pasteButton: {
    width: '100%',
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  pasteText: {
    color: '#9A6500',
    fontSize: 12,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },

  modalHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },

  linkInput: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.bg,
    padding: 12,
    color: colors.text,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 12,
  },

  linkErrorText: {
    color: colors.error,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },

  submitLinkButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  submitLinkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  modalCancelButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

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
    marginTop: 18,
    marginBottom: 14,
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

  pressed: {
    opacity: 0.75,
  },
});