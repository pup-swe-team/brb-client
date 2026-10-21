import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

function extractUidToken(raw: string): {
  uid?: string;
  token?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  try {
    const parsed = Linking.parse(trimmed);
    const query = parsed.queryParams ?? {};

    const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

    const uid = first(query.uid ?? query.user_id ?? query.uidb64);
    const token = first(query.token ?? query.tokenb64);

    if (uid && token) return { uid, token };

    const segments = (parsed.path ?? '').split('/').filter(Boolean);
    const last = segments.pop();
    const second = segments.pop();

    if (last && second) return { uid: second, token: last };
  } catch {
    // fall through
  }

  // Fallback for raw uid/token pasted separately
  const uidMatch = trimmed.match(/uid=([^\s&]+)/i) || trimmed.match(/uidb64=([^\s&]+)/i);
  const tokenMatch = trimmed.match(/token=([^\s&]+)/i) || trimmed.match(/tokenb64=([^\s&]+)/i);
  if (uidMatch && tokenMatch) {
    return { uid: uidMatch[1], token: tokenMatch[1] };
  }

  return {};
}

export default function PasswordResetSentScreen({
  navigation,
}: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openModal = () => {
    setLinkInput('');
    setLinkError('');
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const handleSubmitLink = () => {
    const parsed = extractUidToken(linkInput);
    if (!parsed.uid || !parsed.token) {
      setLinkError("Couldn't find uid and token in that link. Paste the full link from the reset email.");
      return;
    }
    setSubmitting(true);
    setLinkError('');
    closeModal();
    navigation.navigate('NewPassword', { uid: parsed.uid, token: parsed.token });
    setSubmitting(false);
  };

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

        {/* PASTE RESET LINK */}
        <Pressable
          style={({ pressed }) => [styles.pasteButton, pressed && styles.pressed]}
          onPress={openModal}
        >
          <Text style={styles.pasteText}>Paste reset link</Text>
        </Pressable>

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

      {/* PASTE LINK MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Paste your reset link</Text>
            <Text style={styles.modalHint}>
              Copy the full link from the password reset email (it prints in the backend terminal)
              and paste it below.
            </Text>

            <TextInput
              style={styles.linkInput}
              value={linkInput}
              onChangeText={setLinkInput}
              placeholder="https://...uid=...&token=..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
              editable={!submitting}
            />

            {linkError ? <Text style={styles.linkErrorText}>{linkError}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.submitLinkButton, pressed && styles.pressed]}
              onPress={handleSubmitLink}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitLinkText}>Continue</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={closeModal}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
   * Paste reset link
   */
  pasteButton: {
    width: '100%',
    height: 39,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  pasteText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },

  modalTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  modalHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },

  linkInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 12,
    color: colors.textSecondary,
  },

  linkErrorText: {
    color: colors.error,
    fontSize: 11,
    textAlign: 'center',
  },

  submitLinkButton: {
    height: 39,
    backgroundColor: colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitLinkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  cancelButton: {
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

});