import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors } from '../../../theme';

// OWNER: Izzy. CP-601 Rate and review counterparty after order completion.
// 1-5 star rating + comment form. Route: ReviewForm { orderId } (registered).
// Opened from ReviewAction on OrderDetailScreen when the order is Completed.
// Service: features/reviews/services/reviewsService.ts (submitReview). Reuse StarRating
// (features/profile/components/StarRating.tsx) for display; build the tappable star input here.
// On success call navigation.goBack() so OrderDetail reloads.
export default function ReviewFormScreen({ navigation }: any) {
  return (
    <View style={s.root}>
      <TopBar title="Rate & Review" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll>
        <SlotPlaceholder ticket="CP-601" owner="Izzy" label="Star rating + comment form" />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
