import { http, USE_MOCK } from '../../../services/http';
import { absoluteMediaUrl } from '../../../services/api';
import { MOCK_LENDERS } from '../../profile/services/mockLenders';
import { LenderSearchResult, LenderSummary } from '../types';

function toSummary(l: (typeof MOCK_LENDERS)[string]): LenderSummary {
  return {
    id: l.id,
    fullName: l.fullName,
    verified: l.verified,
    affiliation: l.affiliation,
    program: l.program,
    photoUrl: l.photoUrl,
    rating: l.rating,
    reviewCount: l.reviewCount,
    activeListings: l.listings.length,
  };
}

async function searchMock(keyword: string, page: number, pageSize: number): Promise<LenderSearchResult> {
  await new Promise((r) => setTimeout(r, 400));
  const kw = keyword.trim().toLowerCase();
  const all = Object.values(MOCK_LENDERS)
    .map(toSummary)
    .filter((l) => !kw || `${l.fullName} ${l.affiliation} ${l.program ?? ''}`.toLowerCase().includes(kw))
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), page, totalPages, total: all.length };
}

// One row from `GET /api/v1/lenders/?q=` (CP-302).
type ApiLenderRow = {
  id: number;
  full_name: string;
  affiliation: string;
  photo: string | null;
  bio: string;
  active_listing_count: number;
};

type ApiPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function searchLenders(keyword: string, page: number, pageSize: number): Promise<LenderSearchResult> {
  if (USE_MOCK) return searchMock(keyword, page, pageSize);

  const params: Record<string, string | number> = { page };
  const q = keyword.trim();
  if (q) params.q = q;

  const { data } = await http.get<ApiPaginated<ApiLenderRow>>('/lenders/', { params });
  const rows = data.results ?? [];
  const total = data.count ?? rows.length;
  const serverPageSize = rows.length > 0 && total > rows.length ? rows.length : pageSize;

  const items: LenderSummary[] = rows.map((r) => ({
    id: String(r.id),
    fullName: r.full_name,
    // CP-302 only returns active, verified lenders.
    verified: true,
    affiliation: r.affiliation,
    // The backend has no `program` field; the card simply hides the line.
    program: undefined,
    photoUrl: absoluteMediaUrl(r.photo),
    // Lender rating comes from completed-order reviews; none exist yet, so the
    // card renders "No ratings yet".
    rating: 0,
    reviewCount: 0,
    activeListings: r.active_listing_count ?? 0,
  }));

  return {
    items,
    page,
    totalPages: Math.max(1, Math.ceil(total / serverPageSize)),
    total,
  };
}

// Kept for the mock path so a listing card can open its owner's profile.
// Real listings carry `lender.id` directly, so screens should prefer that.
export function lenderIdByName(name: string): string | undefined {
  return Object.values(MOCK_LENDERS).find((l) => l.fullName === name)?.id;
}
