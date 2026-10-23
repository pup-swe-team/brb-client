import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';
import { Button, Input } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { SettingsShell } from '../components/SettingsShell';
import { requestEmailChange, resendEmailChangeVerification } from '../services/accountService';
import { verifyEmail } from '../../auth/services/authService';
import { extractUidToken } from '../../auth/screens/VerifyEmailScreen';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isPupEmail(v: string) {
  const e = v.toLowerCase();
  return e.endsWith('@pup.edu.ph') || e.endsWith('@iskolarngbayan.pup.edu.ph');
}

export default function ChangeEmailScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const submit = async () => {
    const value = email.trim();
    const e: typeof errors = {};
    if (!value) e.email = 'Enter your new email address.';
    else if (!EMAIL_PATTERN.test(value)) e.email = 'Enter a valid email address.';
    else if (!isPupEmail(value)) e.email = 'Use your PUP webmail (@pup.edu.ph or @iskolarngbayan.pup.edu.ph).';
    if (!password) e.password = 'Enter your password to confirm.';
    setErrors(e);
    if (e.email || e.password) return;
    setLoading(true);
    try {
      await requestEmailChange(value, password);
      setSentTo(value);
      setPassword('');
    } catch (err) {
      setErrors({ submit: extractApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!sentTo) return;
    setResendMsg('');
    try {
      await resendEmailChangeVerification(sentTo);
      setResendMsg('We sent a new verification link.');
    } catch (err) {
      setResendMsg(extractApiError(err));
    }
  };

  const submitLink = async () => {
    const { uid, token } = extractUidToken(linkInput);
    if (!uid || !token) {
      setLinkError("Couldn't find uid and token in that link. Paste the full link from the verification email.");
      return;
    }
    setLinkError('');
    setVerifying(true);
    try {
      await verifyEmail(uid, token);
      Alert.alert('Email verified', 'Your email address has been updated.');
      navigation.goBack();
    } catch (err) {
      setLinkError(extractApiError(err));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SettingsShell title="Change Email" onBack={() => navigation.goBack()}>
      {sentTo ? (
        <View style={s.notice}>
          <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
          <Text style={text.h2}>Verify your new email</Text>
          <Text style={[text.body, { textAlign: 'center', color: colors.textSecondary }]}>
            We sent a verification link to {sentTo}. Your email will not change until you open the link. Until then, keep logging in with your current email.
          </Text>
          {resendMsg ? <Text style={text.caption}>{resendMsg}</Text> : null}
          {showPaste ? (
            <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
              <Input
                placeholder="https://…?uid=…&token=…"
                value={linkInput}
                onChangeText={(v) => { setLinkInput(v); setLinkError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                error={linkError}
              />
              <Button title="Verify" onPress={submitLink} loading={verifying} />
            </View>
          ) : null}
          <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
            {!showPaste ? (
              <Button title="Paste verification link" onPress={() => setShowPaste(true)} />
            ) : null}
            <Button title="Resend link" variant="secondary" onPress={resend} />
            <Button title="Done" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        </View>
      ) : (
        <>
          <Text style={[text.body, { color: colors.textSecondary }]}>
            We will send a verification link to the new address before the change takes effect.
          </Text>
          <Input label="New email" required value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="name@iskolarngbayan.pup.edu.ph" />
          <Input label="Current password" required password value={password} onChangeText={setPassword} error={errors.password} />
          {errors.submit ? <Text style={s.error}>{errors.submit}</Text> : null}
          <Button title="Send verification link" onPress={submit} loading={loading} />
        </>
      )}
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  error: { color: colors.error, fontSize: 12 },
  notice: { alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: spacing.xl },
});