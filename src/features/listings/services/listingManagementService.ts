import { isAxiosError } from 'axios';
import { http, USE_MOCK, getApiErrorCode } from '../../../services/http';

// Lender's own listings (the "My Listings" management list).
// The listings backend module does not exist yet (docs/BACKEND_CONNECTION.md),
// so this stays on mock data until LISTINGS_BACKEND_READY is flipped to true.
// TODO: confirm endpoint paths and the 409 error code with the backend lead.
const LISTINGS_BACKEND_READY = false;
const useMock = USE_MOCK || !LISTINGS_BACKEND_READY;

export type ListingStatus = 'Active' | 'Inactive';

export interface ManagedListing {
  id: string;
  title: string;
  // PHP per day. 0 = FREE. Payment happens outside the app (display only).
  pricePerDay: number;
  status: ListingStatus;
}

// Thrown when a listing has a Confirmed or Active order and can't be deleted.
export class ListingDeletionBlockedError extends Error {
  constructor() {
    super('This listing has a Confirmed or Active order.');
    this.name = 'ListingDeletionBlockedError';
    Object.setPrototypeOf(this, ListingDeletionBlockedError.prototype);
  }
}

let mockListings: ManagedListing[] = [
  { id: 'l1', title: 'Concepts of Programming Languages', pricePerDay: 15, status: 'Active' },
  { id: 'l2', title: 'T-Square', pricePerDay: 10, status: 'Active' },
  { id: 'l3', title: 'Lab Coat (MEDIUM)', pricePerDay: 0, status: 'Inactive' },
];
// Mock rule: this listing has an open order, so deleting it is blocked (screen 53).
const MOCK_LISTING_WITH_OPEN_ORDER = 'l1';

export function formatPricePerDay(pricePerDay: number): string {
  return pricePerDay > 0 ? `₱${pricePerDay} / day` : 'FREE';
}

export async function getMyListings(): Promise<ManagedListing[]> {
  if (useMock) return mockListings;
  const { data } = await http.get<ManagedListing[]>('/listings/mine/');
  return data;
}

export async function setListingActive(id: string, active: boolean): Promise<ManagedListing[]> {
  if (useMock) {
    mockListings = mockListings.map((l) =>
      l.id === id ? { ...l, status: active ? 'Active' : 'Inactive' } : l,
    );
    return mockListings;
  }
  await http.post(`/listings/${id}/${active ? 'activate' : 'deactivate'}/`);
  return getMyListings();
}

export async function deleteListing(id: string): Promise<ManagedListing[]> {
  if (useMock) {
    if (id === MOCK_LISTING_WITH_OPEN_ORDER) throw new ListingDeletionBlockedError();
    mockListings = mockListings.filter((l) => l.id !== id);
    return mockListings;
  }
  try {
    await http.delete(`/listings/${id}/`);
  } catch (err) {
    const blocked =
      getApiErrorCode(err) === 'listing_has_open_order' ||
      (isAxiosError(err) && err.response?.status === 409);
    if (blocked) throw new ListingDeletionBlockedError();
    throw err;
  }
  return getMyListings();
}
