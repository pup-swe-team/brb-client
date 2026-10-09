import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { colors, radius, spacing } from '../../../theme';
import { Button, ScreenContainer } from '../../../shared/components';
import { Checkbox } from '../../../shared/components/Checkbox';
import { IdDocumentType, submitIdDocument } from '../services/verification';

const DOC_TYPES: IdDocumentType[] = ['PUP ID', 'Government ID'];
const CONSENT_LABEL =
  'I agree that my ID will be stored and used to help recover items if a borrowed item is lost or not returned.';

function Shell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <ScreenContainer>
      <View style={s.screen}>
        <View style={s.header}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <Text style={s.headerTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </ScreenContainer>
  );
}

export default function VerifyIdentityScreen({ navigation }: any) {
  const [docType, setDocType] = useState<IdDocumentType>('PUP ID');
  const [uri, setUri] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ file?: string; consent?: string; submit?: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pick = async (source: 'library' | 'camera') => {
    const launch = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await launch({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) {
      setUri(result.assets[0].uri);
      setErrors((e) => ({ ...e, file: undefined }));
    }
  };

  const submit = async () => {
    const next = {
      file: uri ? undefined : 'Upload a clear photo of your ID.',
      consent: consent ? undefined : 'You need to agree before submitting.',
    };
    setErrors(next);
    if (next.file || next.consent || !uri) return;

    setLoading(true);
    try {
      await submitIdDocument({ documentType: docType, uri, consent });
      setSubmitted(true);
    } catch {
      setErrors({ submit: 'Could not submit your ID. Check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Shell title="Verify Identity" onBack={() => navigation.goBack()}>
        <View style={s.doneWrap}>
          <View style={s.doneIcon}>
            <Ionicons name="checkmark" size={30} color={colors.white} />
          </View>
          <Text style={s.doneTitle}>ID submitted</Text>
          <Text style={s.doneText}>
            An admin will review it. Until you are verified, some actions stay blocked.
          </Text>
          <Button title="Back to profile" onPress={() => navigation.goBack()} />
        </View>
      </Shell>
    );
  }

  return (
    <Shell title="Verify Identity" onBack={() => navigation.goBack()}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* PRIVACY NOTE */}
        <View style={s.noteCard}>
          <View style={s.noteIcon}>
            <Ionicons name="shield-checkmark-outline" size={23} color={colors.primary} />
          </View>
          <View style={s.noteInfo}>
            <Text style={s.noteTitle}>Your ID stays private</Text>
            <Text style={s.noteText}>
              Other users only see that you are verified, never the document.
            </Text>
          </View>
        </View>

        {/* ID TYPE */}
        <View>
          <Text style={s.label}>ID type</Text>
          <View style={s.segment}>
            {DOC_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[s.segmentBtn, docType === t && s.segmentBtnActive]}
                onPress={() => setDocType(t)}
              >
                <Text style={[s.segmentText, docType === t && s.segmentTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* UPLOAD */}
        <View style={s.card}>
          <Text style={s.label}>Photo of your ID</Text>
          {uri ? (
            <Image source={{ uri }} style={s.preview} resizeMode="cover" accessibilityLabel="ID preview" />
          ) : (
            <View style={s.placeholder}>
              <Ionicons name="id-card-outline" size={30} color={colors.primary} />
              <Text style={s.placeholderText}>No photo yet</Text>
            </View>
          )}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Button title="Choose photo" variant="secondary" onPress={() => pick('library')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Take photo" variant="secondary" onPress={() => pick('camera')} />
            </View>
          </View>
          {errors.file ? <Text style={s.error}>{errors.file}</Text> : null}
        </View>

        {/* CONSENT */}
        <View style={s.card}>
          <Checkbox
            checked={consent}
            onChange={(v) => {
              setConsent(v);
              setErrors((e) => ({ ...e, consent: undefined }));
            }}
            label={CONSENT_LABEL}
            error={errors.consent}
          />
        </View>

        {errors.submit ? <Text style={s.error}>{errors.submit}</Text> : null}
        <Button title="Submit for verification" onPress={submit} loading={loading} />
      </ScrollView>
    </Shell>
  );
}

const s = StyleSheet.create({
  // Same full-bleed trick as ProfileScreen so the header spans the screen.
  screen: {
    flex: 1,
    width: '110%',
    backgroundColor: colors.bg,
    marginLeft: -spacing.lg,
    marginRight: -spacing.lg,
    padding: 0,
  },

  header: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  /* NOTE */
  noteCard: {
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  noteInfo: { flex: 1 },
  noteTitle: { color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  noteText: { color: colors.textSecondary, fontSize: 10, lineHeight: 14 },

  /* LABELS + SEGMENT */
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: spacing.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E8EBF0',
    borderRadius: radius.button,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    height: 34,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.primaryDark, fontSize: 11, fontWeight: '600' },
  segmentTextActive: { color: colors.white },

  /* CARDS */
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  preview: {
    width: '100%',
    height: 190,
    borderRadius: radius.input,
    backgroundColor: colors.goldSoft,
  },
  placeholder: {
    height: 150,
    borderRadius: radius.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: { color: colors.textSecondary, fontSize: 10 },
  error: { color: colors.error, fontSize: 10 },

  /* DONE */
  doneWrap: { padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md, alignItems: 'stretch' },
  doneIcon: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  doneText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});