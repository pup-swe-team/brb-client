import { USE_MOCK } from '../../../services/http';
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

export async function searchLenders(keyword: string, page: number, pageSize: number): Promise<LenderSearchResult> {
  if (USE_MOCK) return searchMock(keyword, page, pageSize);
  // TODO: real endpoint, once the backend confirms it.
  throw new Error('Lender search endpoint not connected yet. Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}

// Mock helper so a listing card can open its owner's profile. Real listings will carry the owner id.
export function lenderIdByName(name: string): string | undefined {
  return Object.values(MOCK_LENDERS).find((l) => l.fullName === name)?.id;
}
