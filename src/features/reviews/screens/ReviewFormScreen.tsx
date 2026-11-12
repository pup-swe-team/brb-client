
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  Input,
  ScreenContainer,
  TopBar,
} from '../../../shared/components';

import { colors, spacing, radius } from '../../../theme';
import {
  getOrderReview,
  submitReview,
} from '../services/reviewsService';

interface ReviewFormScreenProps {
  navigation: any;
  route: {
    params: {
      orderId: string;
    };
  };
}

export default function ReviewFormScreen({
  navigation,
  route,
}: ReviewFormScreenProps) {
  const orderId = String(route.params.orderId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [checkError, setCheckError] = useState('');
  const [retry, setRetry] = useState(0);

  const submittingRef = useRef(false);

  // Check whether this order already has a review.
  useEffect(() => {
    let active = true;

    async function checkExistingReview() {
      setChecking(true);
      setCheckError('');

      try {
        const existingReview = await getOrderReview(orderId);

        if (active) {
          setAlreadyReviewed(!!existingReview);
        }
      } catch (error: any) {
        if (active) {
          setCheckError(
            error?.message || 'Unable to check existing review.'
          );
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkExistingReview();

    return () => {
      active = false;
    };
  }, [orderId, retry]);

  const handleSubmit = async () => {
    if (submittingRef.current || checking || alreadyReviewed || checkError) {
      return;
    }

    let valid = true;

    setRatingError('');
    setCommentError('');

    if (rating < 1 || rating > 5) {
      setRatingError('Please select a rating from 1 to 5 stars.');
      valid = false;
    }

    if (!comment.trim()) {
      setCommentError('Please write a comment before submitting.');
      valid = false;
    }

    if (!valid) return;

    submittingRef.current = true;
    setLoading(true);

    try {
      // Check again before submission.
      const existingReview = await getOrderReview(orderId);

      if (existingReview) {
        setAlreadyReviewed(true);

        Alert.alert(
          'Already Reviewed',
          'You have already submitted a review for this order.'
        );

        return;
      }

      await submitReview({
        orderId,
        rating,
        comment: comment.trim(),
      });

      Alert.alert(
        'Review Submitted',
        'Thank you for sharing your experience!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error?.message || 'Unable to submit your review. Please try again.'
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar
        title="Rate & Review"
        onBack={() => navigation.goBack()}
      />

      <ScreenContainer scroll>
        <View style={styles.container}>
          <View style={styles.intro}>
            <Text style={styles.title}>
              How was your experience?
            </Text>

            <Text style={styles.subtitle}>
              Your feedback helps other users make informed decisions.
            </Text>
          </View>

          {checking ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
              <Text style={styles.helper}>
                Checking existing review...
              </Text>
            </View>
          ) : checkError ? (
            <View style={styles.messageCard}>
              <Ionicons
                name="alert-circle-outline"
                size={32}
                color={colors.error}
              />

              <Text style={styles.messageTitle}>
                Unable to load review status
              </Text>

              <Text style={styles.helper}>
                {checkError}
              </Text>

              <Button
                title="Try Again"
                variant="secondary"
                onPress={() => setRetry((current) => current + 1)}
              />
            </View>
          ) : alreadyReviewed ? (
            <View style={styles.messageCard}>
              <Ionicons
                name="checkmark-circle"
                size={42}
                color={colors.primary}
              />

              <Text style={styles.messageTitle}>
                Already Reviewed
              </Text>

              <Text style={styles.helper}>
                You have already submitted a review for this order.
              </Text>

              <Button
                title="Go Back"
                onPress={() => navigation.goBack()}
              />
            </View>
          ) : (
            <>
              <View style={styles.ratingCard}>
                <Text style={styles.sectionTitle}>
                  Rate your experience
                </Text>

                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => {
                        setRating(star);
                        setRatingError('');
                      }}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${star} out of 5 stars`}
                      accessibilityState={{
                        selected: rating === star,
                        disabled: loading,
                      }}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={38}
                        color={
                          star <= rating
                            ? '#F5B82E'
                            : colors.textMuted
                        }
                      />
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.ratingLabel}>
                  {rating === 0
                    ? 'Tap a star to rate'
                    : `${rating} out of 5 stars`}
                </Text>

                {ratingError ? (
                  <Text style={styles.errorText}>
                    {ratingError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>
                  Write your review
                </Text>

                <Text style={styles.helper}>
                  Share your experience with the counterparty.
                </Text>

                <Input
                  placeholder="Tell us about your experience..."
                  value={comment}
                  onChangeText={(value) => {
                    setComment(value);
                    if (value.trim()) setCommentError('');
                  }}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={1000}
                  error={commentError}
                  editable={!loading}
                  style={[
                    { flex: 1, fontSize: 14, color: colors.text },
                    styles.commentInput,
                  ]}
                />

                <Text style={styles.characterCount}>
                  {comment.length}/1000 characters
                </Text>
              </View>

              <View style={styles.submitSection}>
                <Button
                  title="Submit Review"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading || checking}
                />

                <Text style={styles.footerText}>
                  Your feedback helps improve the BRB community.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  intro: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  ratingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  commentSection: {
    gap: spacing.sm,
  },
  commentInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  submitSection: {
    gap: spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  helper: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  messageCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});
