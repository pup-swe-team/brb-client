
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  Button,
  Card,
  ScreenContainer,
  TopBar,
} from '../../../shared/components';
import { colors, spacing, text, radius } from '../../../theme';

type EvidenceFile = ImagePicker.ImagePickerAsset;

export default function ReportDamageScreen({ navigation, route }: any) {
  const { orderId } = route.params as { orderId: string };

  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<EvidenceFile | null>(null);
  const [video, setVideo] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState('');

  const selectEvidence = async (type: 'photo' | 'video') => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow gallery access to attach evidence.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'photo' ? ['images'] : ['videos'],
        allowsEditing: type === 'photo',
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets?.length) return;

      if (type === 'photo') {
        setPhoto(result.assets[0]);
      } else {
        setVideo(result.assets[0]);
      }

      setError('');
    } catch {
      Alert.alert(
        'Selection failed',
        'Unable to open your gallery. Please try again.',
      );
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      setError('Please describe the damage or missing items.');
      return;
    }

    if (!photo) {
      setError('Please attach at least one photo.');
      return;
    }

    if (!video) {
      setError('Please attach at least one video.');
      return;
    }

    // TODO: Connect to the backend damage-report endpoint.
    Alert.alert(
      'Submission not connected',
      'Your evidence is selected, but the damage-report API still needs to be connected.',
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Report Damage" onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <ScreenContainer scroll>
          <View style={styles.content}>
            <Text style={text.caption}>Order #{orderId}</Text>

            <Text style={styles.heading}>
              Report damage or missing items
            </Text>

            <Text style={styles.subtitle}>
              Describe the item's condition after it was returned. Provide
              photo and video evidence to support your report.
            </Text>

            <Card style={styles.card}>
              <Text style={styles.label}>What happened?</Text>

              <TextInput
                value={description}
                onChangeText={(value) => {
                  setDescription(value);
                  setError('');
                }}
                placeholder="Describe the damage or missing items..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                style={styles.input}
                accessibilityLabel="Damage description"
              />

              <Text style={styles.helper}>
                Include details about the item's condition and missing parts.
              </Text>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.label}>Photo evidence *</Text>
              <Text style={styles.helper}>
                At least one photo is required.
              </Text>

              <Button
                title={photo ? 'Replace Photo' : 'Select Photo'}
                variant="secondary"
                onPress={() => selectEvidence('photo')}
              />

              {photo ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoPreview}
                  />

                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {photo.fileName || 'Selected photo'}
                    </Text>
                    <Text style={styles.helper}>Photo attached</Text>
                  </View>

                  <Pressable
                    onPress={() => setPhoto(null)}
                    accessibilityLabel="Remove photo"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color={colors.error}
                    />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.helper}>No photo attached</Text>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.label}>Video evidence *</Text>
              <Text style={styles.helper}>
                At least one video is required. Maximum duration: 60 seconds.
              </Text>

              <Button
                title={video ? 'Replace Video' : 'Select Video'}
                variant="secondary"
                onPress={() => selectEvidence('video')}
              />

              {video ? (
                <View style={styles.previewContainer}>
                  <View style={styles.videoPreview}>
                    <Ionicons
                      name="videocam"
                      size={28}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {video.fileName || 'Selected video'}
                    </Text>
                    <Text style={styles.helper}>Video attached</Text>
                  </View>

                  <Pressable
                    onPress={() => setVideo(null)}
                    accessibilityLabel="Remove video"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color={colors.error}
                    />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.helper}>No video attached</Text>
              )}
            </Card>

            <View style={styles.notice}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.warning}
              />
              <Text style={styles.noticeText}>
                This order has been marked Disputed. Submitting this form
                records the damage report for review.
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScreenContainer>
      </View>

      <View style={styles.footer}>
        <Button
          title="Submit Damage Report"
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  heading: {
    ...text.h2,
    fontSize: 18,
  },
  subtitle: {
    ...text.body,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    gap: spacing.sm,
    padding: 14,
  },
  label: {
    ...text.body,
    fontWeight: '600',
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  helper: {
    ...text.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  photoPreview: {
    width: 58,
    height: 58,
    borderRadius: 7,
  },
  videoPreview: {
    width: 58,
    height: 58,
    borderRadius: 7,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    ...text.body,
    fontSize: 12,
    fontWeight: '600',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 8,
    padding: 12,
  },
  noticeText: {
    ...text.caption,
    color: colors.warning,
    flex: 1,
    lineHeight: 17,
  },
  error: {
    ...text.caption,
    color: colors.error,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
});
