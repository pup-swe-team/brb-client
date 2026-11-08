import React from 'react';
import { SlotPlaceholder } from '../../../shared/components';

// OWNER: Izzy. CP-601 Display reviews on the signed-in user's profile.
// Mounted in ProfileScreen (Sprint 4 scaffold), so ProfileScreen is not edited again.
// Lender profile and listing review lists already render LenderReview data
// (LenderProfileScreen, LenderReviewCard, ItemDetailScreen): Izzy edits those for real data.
export function ReviewsSection() {
  return <SlotPlaceholder ticket="CP-601" owner="Izzy" label="Reviews on my profile" />;
}
