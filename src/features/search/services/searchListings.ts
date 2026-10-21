import { Listing, SearchParams, SearchResult } from '../types';
import { USE_MOCK } from '../../../services/http';
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

export async function searchListings(p: SearchParams): Promise<SearchResult> {
  if (USE_MOCK) return searchMock(p);

  // TODO: real endpoint, once the backend confirms it. Something like:
  // const res = await http.get('/listings', { params: { q: p.keyword, ...p.filters, sort: p.sort, page: p.page, pageSize: p.pageSize } });
  // return res.data;
  throw new Error('Listings search endpoint not connected yet. Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}