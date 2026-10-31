import { http, USE_MOCK } from '../../../services/http';
import { Affiliation, LenderListing, PublicLenderProfile } from './lenderTypes';
import { MOCK_LENDERS } from './mockLenders';

export * from './lenderTypes';

function getMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
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

  const numeric = lenderId.replace(/\D/g, '');
  const idToFetch = numeric || lenderId;

  const { data } = await http.get(`/lenders/${idToFetch}/`);

  const memberSince = data.date_joined ? data.date_joined.slice(0, 10) : '2024-01-01';

  const listings: LenderListing[] = (data.active_listings ?? []).map((l: any) => {
    const fromDate = l.created_at ? l.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return {
      id: String(l.id),
      title: l.title || 'Item',
      category: l.category?.name || (typeof l.category === 'string' ? l.category : 'General'),
      location: l.pickup_location?.name || (typeof l.pickup_location === 'string' ? l.pickup_location : 'PUP Main Campus'),
      availableFrom: fromDate,
      availableTo: futureDate,
    };
  });

  const affiliation: Affiliation =
    data.affiliation === 'Faculty' || data.affiliation === 'Staff' ? data.affiliation : 'Student';

  return {
    id: String(data.id),
    fullName: data.full_name || 'Lender',
    photoUrl: getMediaUrl(data.photo),
    verified: true,
    affiliation,
    program: undefined,
    rating: data.average_rating != null ? Number(data.average_rating) : 0,
    reviewCount: data.review_count ?? 0,
    memberSince,
    reviews: [],
    listings,
  };
}
