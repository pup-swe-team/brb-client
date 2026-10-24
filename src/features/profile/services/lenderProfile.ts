import { http, USE_MOCK } from '../../../services/http';
import { absoluteMediaUrl } from '../../../services/api';
import { Affiliation, PublicLenderProfile } from './lenderTypes';
import { MOCK_LENDERS } from './mockLenders';
import { mapServerListing } from '../../search/services/searchListings';

export * from './lenderTypes';

// Response of `GET /api/v1/lenders/<id>/` (CP-304).
type ApiLenderProfile = {
  id: number;
  full_name: string;
  affiliation: string;
  photo: string | null;
  bio: string;
  average_rating: number | null;
  review_count: number;
  active_listings: Parameters<typeof mapServerListing>[0][];
};

const AFFILIATIONS: Affiliation[] = ['Student', 'Faculty', 'Staff'];

function toAffiliation(value: string): Affiliation {
  return AFFILIATIONS.includes(value as Affiliation) ? (value as Affiliation) : 'Student';
}

export async function getLenderProfile(lenderId: string): Promise<PublicLenderProfile> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const profile = MOCK_LENDERS[lenderId];
    if (!profile) {
      throw new Error('Lender not found');
    }
    return profile;
  }

  const { data } = await http.get<ApiLenderProfile>(`/lenders/${lenderId}/`);
  const listings = (data.active_listings ?? []).map((row) => mapServerListing(row).listing);

  return {
    id: String(data.id),
    fullName: data.full_name,
    photoUrl: absoluteMediaUrl(data.photo),
    // CP-304 only serves active, verified lenders.
    verified: true,
    affiliation: toAffiliation(data.affiliation),
    // Not part of the CP-304 contract; the screen hides the line when absent.
    program: undefined,
    rating: data.average_rating ?? 0,
    reviewCount: data.review_count ?? 0,
    // No join date in the CP-304 payload yet; the screen omits it when empty.
    memberSince: '',
    // Reviews are not embedded in CP-304; the screen shows its empty state.
    reviews: [],
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      category: l.category,
      location: l.location,
      availableFrom: l.availableFrom,
      availableTo: l.availableTo,
    })),
  };
}
