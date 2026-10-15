import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button, Input, ScreenContainer, TopBar } from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import { extractApiError } from '../../auth/services/authService';
import type { Affiliation } from '../../auth/services/authService';
import { InlineBanner } from '../components/InlineBanner';
import type { BannerVariant } from '../components/InlineBanner';
import {
  cancelEmailChange,
  getPendingEmailChange,
  getProfileDetails,
  requestEmailChange,
  resendEmailChangeLink,
} from '../services/accountService';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_DOMAIN = '@iskolarngbayan.pup.edu.ph'; // Student / Alumni
const FACULTY_DOMAIN = '@pup.edu.ph'; // Faculty / Staff
const DOMAIN_HINT = `Use ${STUDENT_DOMAIN} for Student/Alumni or ${FACULTY_DOMAIN} for Faculty/Staff.`;

// Returns an error message, or '' when the address is acceptable.
function validateNewEmail(email: string, affiliation: Affiliation, currentEmail: string): string {
  const value = email.trim().toLowerCase();
  if (!value) return 'Please enter your new PUP Webmail.';
  if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email address.';

  const isStudentDomain = value.endsWith(STUDENT_DOMAIN);
  const isFacultyDomain = value.endsWith(FACULTY_DOMAIN);
  if (!isStudentDomain && !isFacultyDomain) return DOMAIN_HINT;

  const expected = affiliation === 'Student' ? STUDENT_DOMAIN : FACULTY_DOMAIN;
  if (!value.endsWith(expected)) {
    return `As a ${affiliation}, use an ${expected} address.`;
  }
  if (value === currentEmail.toLowerCase()) return 'That is already your email address.';
  return '';
}

export default function ChangeEmailScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [currentEmail, setCurrentEmail] = useState('');
  const [affiliation, setAffiliation] = useState<Affiliation>('Student');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [banner, setBanner] = useState<{ variant: BannerVariant; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getProfileDetails(), getPendingEmailChange()])
      .then(([profile, pending]) => {
        if (!active) return;
        setCurrentEmail(profile.email);
        setAffiliation(profile.affiliation);
        if (pending) {
          setPendingEmail(pending.newEmail);
          setNewEmail(pending.newEmail);
        }
      })
      .catch((err) => {
        if (active) setBanner({ variant: 'error', message: extractApiError(err) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSend() {
    if (busy) return;
    setBanner(null);
    const error = validateNewEmail(newEmail, affiliation, currentEmail);
    setEmailError(error);
    if (error) return;

    setBusy(true);
    try {
      const pending = await requestEmailChange(newEmail.trim());
      setPendingEmail(pending.newEmail);
    } catch (err) {
      setBanner({ variant: 'error', message: extractApiError(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (busy) return;
    setBusy(true);
    setBanner(null);
    try {
      const message = await resendEmailChangeLink();
      setBanner({ variant: 'success', message });
    } catch (err) {
      setBanner({ variant: 'error', message: extractApiError(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (busy) return;
    setBusy(true);
    setBanner(null);
    try {
      await cancelEmailChange();
      setPendingEmail(null);
      setNewEmail('');
      setBanner({ variant: 'success', message: 'Email change cancelled.' });
    } catch (err) {
      setBanner({ variant: 'error', message: extractApiError(err) });
    } finally {
      setBusy(false);
    }
  }

  const isPending = pendingEmail !== null;

  return (
    <View style={s.root}>
      <TopBar title="Change Email" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll keyboardAware>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={s.loader} />
        ) : (
          <>
            {isPending ? (
              <InlineBanner
                variant="info"
                message={`Verification pending. We sent a link to ${pendingEmail}. Your current email stays active until you verify the new one.`}
              />
            ) : null}
            {banner ? <InlineBanner variant={banner.variant} message={banner.message} /> : null}

            <View style={s.field}>
              <Text style={text.body}>Current Email</Text>
              <Text style={[text.title, s.currentEmail]}>{currentEmail}</Text>
            </View>

            <View style={s.field}>
              <Input
                label="New PUP Webmail"
                required
                value={newEmail}
                onChangeText={(value) => {
                  setNewEmail(value);
                  setEmailError('');
                }}
                editable={!isPending}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="Enter your new PUP Webmail"
                error={emailError}
              />
              <Text style={text.caption}>{DOMAIN_HINT}</Text>
            </View>

            {isPending ? (
              <View style={s.actions}>
                <Button
                  title="Resend Verification Link"
                  variant="secondary"
                  onPress={handleResend}
                  loading={busy}
                />
                <Button
                  title="Cancel Email Change"
                  variant="secondary"
                  onPress={handleCancel}
                  disabled={busy}
                />
              </View>
            ) : (
              <Button title="Send Verification Link" onPress={handleSend} loading={busy} />
            )}
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxxl },
  field: { gap: spacing.xs },
  currentEmail: { color: colors.textSecondary },
  actions: { gap: spacing.sm },
});
