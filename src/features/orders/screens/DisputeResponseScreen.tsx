// OWNER: Danielo | CP-903
// Borrower response/evidence-submission UI for disputed orders / damage claims.

import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors, radius, spacing, text } from '../../../theme';
import { DamageEvidenceFile, submitDisputeResponse } from '../services/ordersService';

type EvidenceFile = ImagePicker.ImagePickerAsset;

export default function DisputeResponseScreen({ navigation, route }: any) {
  const { orderId } = route.params as { orderId: string };

  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<EvidenceFile | null>(null);
  const [video, setVideo] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectEvidence = async (type: 'photo' | 'video') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access to attach counter-evidence.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'photo' ? ['images'] : ['videos'],
        allowsEditing: type === 'photo',
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets?.length) return;

      if (type === 'photo') setPhoto(result.assets[0]);
      else setVideo(result.assets[0]);
      setError('');
    } catch {
      Alert.alert('Selection failed', 'Unable to open gallery. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!description.trim()) {
      setError('Please provide an explanation or counter-statement.');
      return;
    }

    const evidence: DamageEvidenceFile[] = [];
    if (photo) {
      evidence.push({ kind: 'photo', uri: photo.uri, fileName: photo.fileName, mimeType: photo.mimeType, file: photo.file });
    }
    if (video) {
      evidence.push({ kind: 'video', uri: video.uri, fileName: video.fileName, mimeType: video.mimeType, file: video.file });
    }

    setSubmitting(true);
    setError('');
    try {
      await submitDisputeResponse(orderId, description, evidence);
      Alert.alert(
        'Response submitted',
        'Your statement and counter-evidence have been recorded for dispute resolution.',
        [{ text: 'OK', onPress: () => navigation.navigate('OrderDetail', { orderId, role: 'Borrower' }) }],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.root}>
      <TopBar title="Dispute Response" onBack={() => navigation.goBack()} />

      <ScreenContainer scroll>
        <SlotPlaceholder
          ticket="CP-903"
          owner="Danielo"
          label="Borrower Dispute Response & Counter-Evidence Submission"
        />

        <View style={s.content}>
          <Text style={text.caption}>Order #{orderId}</Text>
          <Text style={s.heading}>Respond to Damage Claim</Text>
          <Text style={s.subtitle}>
            The lender reported item damage or missing components. Submit your explanation and photo or video evidence.
          </Text>

          <Card style={s.card}>
            <Text style={s.label}>Your Explanation</Text>
            <TextInput
              value={description}
              onChangeText={(v) => {
                setDescription(v);
                setError('');
              }}
              placeholder="Explain the item condition during handover and return..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              style={s.input}
              accessibilityLabel="Dispute response description"
            />
          </Card>

          <Card style={s.card}>
            <Text style={s.label}>Photo evidence (Optional)</Text>
            <Button
              title={photo ? 'Replace Photo' : 'Select Photo'}
              variant="secondary"
              onPress={() => selectEvidence('photo')}
            />
            {photo ? (
              <View style={s.previewWrap}>
                <Image source={{ uri: photo.uri }} style={s.preview} />
                <Pressable onPress={() => setPhoto(null)}>
                  <Text style={s.removeLink}>Remove Photo</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>

          <Card style={s.card}>
            <Text style={s.label}>Video evidence (Optional)</Text>
            <Button
              title={video ? 'Replace Video' : 'Select Video'}
              variant="secondary"
              onPress={() => selectEvidence('video')}
            />
            {video ? (
              <View style={s.previewWrap}>
                <Text style={text.caption}>Video selected: {video.fileName || 'video.mp4'}</Text>
                <Pressable onPress={() => setVideo(null)}>
                  <Text style={s.removeLink}>Remove Video</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Button
            title="Submit Response"
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingVertical: spacing.md, gap: spacing.md },
  heading: { ...text.title, fontSize: 18, color: colors.text },
  subtitle: { ...text.body, color: colors.textSecondary, fontSize: 14 },
  card: { padding: spacing.md, gap: spacing.sm },
  label: { ...text.body, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    ...text.body,
  },
  previewWrap: { marginTop: spacing.xs, alignItems: 'center', gap: 4 },
  preview: { width: '100%', height: 160, borderRadius: radius.card },
  removeLink: { ...text.caption, color: colors.error, fontWeight: '600' },
  error: { ...text.caption, color: colors.error },
});
