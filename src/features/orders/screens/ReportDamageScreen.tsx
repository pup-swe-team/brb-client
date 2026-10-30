
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  Card,
  ScreenContainer,
  TopBar,
} from '../../../shared/components';
import { colors, spacing, text, radius } from '../../../theme';

export default function ReportDamageScreen({ navigation, route }: any) {
  const { orderId } = route.params as { orderId: string };

  const [description, setDescription] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);
  const [videoSelected, setVideoSelected] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) {
      setError('Please describe the damage or missing items.');
      return;
    }

    if (!photoSelected || !videoSelected) {
      setError('Please attach at least one photo and one video.');
      return;
    }

    Alert.alert(
      'Report submitted',
      `Your damage report for order ${orderId} has been submitted.`,
      [{ text: 'Done', onPress: () => navigation.popToTop() }],
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Report Damage" onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <ScreenContainer scroll>
          <View style={styles.content}>
            <Text style={text.caption}>Order #{orderId}</Text>

            <Text style={styles.heading}>Report damage or missing items</Text>
            <Text style={styles.subtitle}>
              Describe the item&apos;s condition after it was returned. Please
              provide photo and video evidence to support your report.
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
                Include details about the item&apos;s condition and any missing parts.
              </Text>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.label}>Photo evidence *</Text>
              <Text style={styles.helper}>
                At least one photo is required.
              </Text>

              <Button
                title={photoSelected ? 'Photo selected ✓' : 'Select Photo'}
                variant="secondary"
                onPress={() => {
                  setPhotoSelected(true);
                  setError('');
                  Alert.alert(
                    'Demo selection',
                    'This is a UI placeholder. Actual photo picking is not connected yet.',
                  );
                }}
              />

              <View style={styles.evidenceStatus}>
                <Ionicons
                  name={photoSelected ? 'checkmark-circle' : 'image-outline'}
                  size={20}
                  color={photoSelected ? colors.success : colors.textMuted}
                />
                <Text style={styles.helper}>
                  {photoSelected ? 'Photo marked as selected' : 'No photo attached'}
                </Text>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.label}>Video evidence *</Text>
              <Text style={styles.helper}>
                At least one video is required.
              </Text>

              <Button
                title={videoSelected ? 'Video selected ✓' : 'Select Video'}
                variant="secondary"
                onPress={() => {
                  setVideoSelected(true);
                  setError('');
                  Alert.alert(
                    'Demo selection',
                    'This is a UI placeholder. Actual video picking is not connected yet.',
                  );
                }}
              />

              <View style={styles.evidenceStatus}>
                <Ionicons
                  name={videoSelected ? 'checkmark-circle' : 'videocam-outline'}
                  size={20}
                  color={videoSelected ? colors.success : colors.textMuted}
                />
                <Text style={styles.helper}>
                  {videoSelected ? 'Video marked as selected' : 'No video attached'}
                </Text>
              </View>
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
  evidenceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
