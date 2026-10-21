import { USE_MOCK } from '../../../services/http';

// NOTE: the listings backend module does not exist yet (docs/BACKEND_CONNECTION.md).
// Real branches throw until endpoints land, matching searchListings.

export type ManagedListing = {
  id: string;
  title: string;
  category: string;
  courseCode: string;
  description: string;
  condition: string;
  lendingType: 'Free Lending' | 'For Rent';
  price: string;
  duration: string;
  availability: 'Available now' | 'Available from';
  fromDate: string; // YYYY-MM-DD
  untilDate: string; // YYYY-MM-DD, '' = open ended
  pickup: string;
  photos: string[];
  status: 'active' | 'inactive';
  activeOrders: number; // Requested, Confirmed or Active orders on this listing
};

export type ListingInput = Omit<ManagedListing, 'id' | 'status' | 'activeOrders'>;

export class ListingDeleteBlockedError extends Error {
  constructor() {
    super("This listing can't be deleted while it has pending, confirmed or active orders.");
    this.name = 'ListingDeleteBlockedError';
    Object.setPrototypeOf(this, ListingDeleteBlockedError.prototype);
  }
}

export const DELETE_BLOCKED_MESSAGE =
  "This listing can't be deleted while it has pending, confirmed or active orders. Wait until they finish, or deactivate the listing so nobody can request it.";

let mockListings: ManagedListing[] = [
  {
    id: 'm1', title: 'Basic Calculator', category: 'Electronics', courseCode: '', description: 'Casio fx-82, works fine.', condition: 'Good',
    lendingType: 'Free Lending', price: '', duration: '5 days', availability: 'Available from', fromDate: '2026-10-01', untilDate: '2026-12-31',
    pickup: 'PUP Main Gate', photos: [], status: 'active', activeOrders: 1,
  },
  {
    id: 'm2', title: 'Discrete Math Reviewer', category: 'Notes', courseCode: 'MATH 101', description: 'Printed reviewer with solved problems.', condition: 'Like New',
    lendingType: 'For Rent', price: '₱10', duration: '7 days', availability: 'Available from', fromDate: '2026-10-10', untilDate: '2026-12-10',
    pickup: 'PUP Library', photos: [], status: 'active', activeOrders: 0,
  },
  {
    id: 'm3', title: 'T-Square', category: 'School Supplies', courseCode: '', description: '', condition: 'Fair',
    lendingType: 'Free Lending', price: '', duration: '3 days', availability: 'Available now', fromDate: '2026-10-01', untilDate: '',
    pickup: 'PUP CEA Building', photos: [], status: 'inactive', activeOrders: 0,
  },
];

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const notConnected = () => new Error('Listings endpoint not connected yet. Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');

export async function getMyListings(): Promise<ManagedListing[]> {
  if (!USE_MOCK) throw notConnected();
  await delay();
  return mockListings.map((l) => ({ ...l }));
}

export async function createListing(input: ListingInput): Promise<ManagedListing> {
  if (!USE_MOCK) throw notConnected();
  await delay();
  const created: ManagedListing = { ...input, id: `m${Date.now()}`, status: 'active', activeOrders: 0 };
  mockListings = [created, ...mockListings];
  return created;
}

export async function updateListing(id: string, input: ListingInput): Promise<void> {
  if (!USE_MOCK) throw notConnected();
  await delay();
  mockListings = mockListings.map((l) => (l.id === id ? { ...l, ...input } : l));
}

export async function setListingActive(id: string, active: boolean): Promise<void> {
  if (!USE_MOCK) throw notConnected();
  await delay();
  mockListings = mockListings.map((l) => (l.id === id ? { ...l, status: active ? 'active' : 'inactive' } : l));
}

export async function deleteListing(id: string): Promise<void> {
  if (!USE_MOCK) throw notConnected();
  await delay();
  const target = mockListings.find((l) => l.id === id);
  if (target && target.activeOrders > 0) throw new ListingDeleteBlockedError();
  mockListings = mockListings.filter((l) => l.id !== id);
}
