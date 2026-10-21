export type Affiliation = 'Student' | 'Faculty' | 'Staff';
export type LenderReview = {
  id: string;
  reviewerName: string;
  reviewerVerified: boolean;
  rating: number; // 1-5
  comment: string;
  itemTitle: string;
  date: string; // YYYY-MM-DD
};

export type LenderListing = {
  id: string;
  title: string;
  category: string;
  location: string;
  availableFrom: string; // YYYY-MM-DD
  availableTo: string; // YYYY-MM-DD
};

// CP-107: this is everything other users may see about a lender.
// No email, contact number, home address or ID document fields on purpose.
export type PublicLenderProfile = {
  id: string;
  fullName: string;
  photoUrl?: string;
  verified: boolean;
  affiliation: Affiliation;
  program?: string;
  rating: number;
  reviewCount: number;
  memberSince: string; // YYYY-MM-DD
  reviews: LenderReview[];
  listings: LenderListing[]; // active listings only
};