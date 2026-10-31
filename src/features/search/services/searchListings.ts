import { Listing, SearchParams, SearchResult, ListingCategory } from '../types';
import { http, USE_MOCK } from '../../../services/http';
import { MOCK_LISTINGS } from './mockListings';

function matches(l: Listing, p: SearchParams): boolean {
  const kw = p.keyword.trim().toLowerCase();
  if (kw && !`${l.title} ${l.category} ${l.ownerName}`.toLowerCase().includes(kw)) return false;

  const f = p.filters;
  if (f.category && l.category !== f.category) return false;
  if (f.location && l.location !== f.location) return false;
  if (f.minRating && l.rating < f.minRating) return false;

  // Availability: the listing's window must cover the requested dates (YYYY-MM-DD compares as text).
  const from = f.availableFrom || f.availableTo;
  const to = f.availableTo || f.availableFrom;
  if (from && to && !(l.availableFrom <= from && l.availableTo >= to)) return false;

  return true;
}

function relevance(l: Listing, kw: string): number {
  if (!kw) return l.rating * 10 + Math.min(l.reviewCount, 30) / 10;
  const title = l.title.toLowerCase();
  const base = title.startsWith(kw) ? 3 : title.includes(kw) ? 2 : 1;
  return base * 100 + l.rating;
}

async function searchMock(p: SearchParams): Promise<SearchResult> {
  await new Promise((r) => setTimeout(r, 400)); // fake network delay

  const kw = p.keyword.trim().toLowerCase();
  const all = MOCK_LISTINGS.filter((l) => matches(l, p));

  all.sort((a, b) => {
    if (p.sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
    if (p.sort === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
    return relevance(b, kw) - relevance(a, kw);
  });

  const totalPages = Math.max(1, Math.ceil(all.length / p.pageSize));
  const start = (p.page - 1) * p.pageSize;
  return { items: all.slice(start, start + p.pageSize), page: p.page, totalPages, total: all.length };
}

function getMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

function mapBackendListing(item: any): Listing {
  const photoList = (item.photos || [])
    .map((p: any) => getMediaUrl(p.file_reference || p.photo || p.url))
    .filter((uri: any): uri is string => Boolean(uri));
  const firstPhoto = photoList.length > 0 ? photoList[0] : undefined;

  return {
    id: String(item.id),
    title: item.title,
    category: (item.category?.name ?? 'School Supplies') as ListingCategory,
    location: item.pickup_location?.name ?? 'Main Campus Library',
    ownerName: item.lender?.full_name ?? 'BRB Lender',
    ownerId: item.lender?.id != null ? String(item.lender.id) : undefined,
    ownerVerified: Boolean(item.is_ownership_confirmed || item.lender?.verified),
    ownerPhoto: item.lender?.photo ? getMediaUrl(item.lender.photo) : undefined,
    photos: photoList,
    imageUrl: firstPhoto,
    description: item.description || '',
    rating: 4.8,
    reviewCount: 5,
    availableFrom: item.available_from ?? '',
    availableTo: item.available_to ?? '',
    createdAt: (item.created_at ?? '').slice(0, 10),
    price: item.rate_per_day && Number(item.rate_per_day) > 0 ? `₱${item.rate_per_day}/day` : 'FREE',
  };
}

export async function searchListings(p: SearchParams): Promise<SearchResult> {
  if (USE_MOCK) return searchMock(p);

  const params: Record<string, any> = {
    page: p.page,
  };
  if (p.keyword?.trim()) {
    params.q = p.keyword.trim();
  }
  if (p.sort === 'newest') {
    params.sort = '-created_at';
  } else if (p.sort === 'rating') {
    params.sort = '-created_at';
  }

  const { data } = await http.get('/listings/', { params });
  const rawList: any[] = Array.isArray(data) ? data : (data.results ?? []);
  const count: number = Array.isArray(data) ? rawList.length : (data.count ?? rawList.length);
  const totalPages = Math.max(1, Math.ceil(count / p.pageSize));

  return {
    items: rawList.map(mapBackendListing),
    page: p.page,
    totalPages,
    total: count,
  };
}