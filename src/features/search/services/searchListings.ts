import { Listing, SearchParams, SearchResult } from '../types';
import { http, USE_MOCK } from '../../../services/http';
import { ApiPaginated, toISODate } from '../../../services/api';
import { getCategoryId, getPickupLocationId } from '../../listings/constants';
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

// Shape of one row from `GET /api/v1/listings/` (CP-301).
type ApiSearchListing = {
  id: number;
  title: string;
  condition: string;
  rate_per_day: string | null;
  lender: { id: number; full_name: string; photo: string | null };
  category: { id: number; name: string };
  pickup_location: { id: number; name: string };
  status: { id: number; name: string };
  availability_windows: { id: number; start_date: string; end_date: string }[];
  created_at: string;
};

export type ServerListing = {
  id: number;
  title: string;
  category: string;
  location: string;
  condition: string;
  ratePerDay: string | null;
  ownerName: string;
  ownerId: number;
  availableFrom: string;
  availableTo: string;
  createdAt: string;
};

// Shared mapper: backend search row -> client view model + server metadata.
export function mapServerListing(row: ApiSearchListing): { listing: Listing; server: ServerListing } {
  const window = row.availability_windows?.[0];
  const availableFrom = toISODate(window?.start_date);
  const availableTo = toISODate(window?.end_date);

  const hideLocationName = false;
  const location = row.pickup_location?.name ?? '';

  return {
    listing: {
      id: String(row.id),
      title: row.title,
      category: row.category?.name ?? '',
      location,
      ownerName: row.lender?.full_name ?? '',
      // CP-302/CP-304 only surface verified, active lenders, so any result is verified.
      ownerVerified: true,
      // Rating is a lender-level aggregate from completed orders; search rows
      // carry none yet, so the card shows "No ratings yet".
      rating: 0,
      reviewCount: 0,
      availableFrom: availableFrom || availableTo,
      availableTo: availableTo || availableFrom,
      createdAt: toISODate(row.created_at),
    },
    server: {
      id: row.id,
      title: row.title,
      category: row.category?.name ?? '',
      location: hideLocationName ? '' : location,
      condition: row.condition ?? '',
      ratePerDay: row.rate_per_day ?? null,
      ownerName: row.lender?.full_name ?? '',
      ownerId: row.lender?.id ?? 0,
      availableFrom,
      availableTo,
      createdAt: toISODate(row.created_at),
    },
  };
}

export async function searchListings(p: SearchParams): Promise<SearchResult> {
  if (USE_MOCK) return searchMock(p);

  const params: Record<string, string | number | boolean> = { page: p.page };
  const q = p.keyword.trim();
  if (q) params.q = q;

  const categoryId = getCategoryId(p.filters.category);
  if (categoryId) params.category = categoryId;

  const locationId = getPickupLocationId(p.filters.location);
  if (locationId) params.pickup_location = locationId;

  if (p.filters.availableFrom) params.available_from = p.filters.availableFrom;
  if (p.filters.availableTo) params.available_to = p.filters.availableTo;

  // Backend sort vocabulary differs from the client's; map what translates.
  if (p.sort === 'newest') params.sort = '-created_at';
  // `relevance` and `rating` have no server equivalent (no rating on search
  // rows); leave unsorted so the server default applies.

  const { data } = await http.get<ApiPaginated<ApiSearchListing>>('/listings/', { params });
  const rows = data.results ?? [];
  const total = data.count ?? rows.length;
  // The server owns the page size (DRF PAGE_SIZE=20) and ignores our pageSize,
  // so derive the page count from the response rather than the client request.
  const serverPageSize = rows.length > 0 && total > rows.length ? rows.length : p.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / serverPageSize));

  return {
    items: rows.map((row) => mapServerListing(row).listing),
    page: p.page,
    totalPages,
    total,
  };
}
