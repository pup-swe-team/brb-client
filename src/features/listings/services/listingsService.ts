import { http, USE_MOCK, extractApiError } from '../../../services/http';
import { absoluteMediaUrl, toISODate } from '../../../services/api';
import {
  getCategoryId,
  getPickupLocationIdForListing,
  rememberPickupLocation,
} from '../constants';

// NOTE: `getMyListings()` still has no backend endpoint. The owner-scoped
// listings feed belongs to CP-203 (Lender Dashboard, Sprint 3); GET /listings/
// is search-only and excludes deactivated rows. See docs.
// Create/edit/deactivate/reactivate/delete are wired (CP-401/402).

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
    id: 'm3', title: 'T-Square', category: 'School Supplies', courseCode: '', description: 'Plastic T-Square, 30 cm.', condition: 'Fair',
    lendingType: 'Free Lending', price: '', duration: '3 days', availability: 'Available now', fromDate: '2026-10-01', untilDate: '',
    pickup: 'PUP CEA Building', photos: [], status: 'inactive', activeOrders: 0,
  },
];

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// --- response mapping -------------------------------------------------------

type ApiListing = {
  id: number;
  title: string;
  description: string;
  condition: string;
  rate_per_day: string | null;
  category: { id: number; name: string };
  pickup_location: { id: number; name: string };
  status: { id: number; name: string };
  photos: { id: number; file_reference: string; uploaded_at: string }[];
  availability_windows: { id: number; start_date: string; end_date: string }[];
  created_at: string;
};

function mapListing(row: ApiListing): ManagedListing {
  const window = row.availability_windows?.[0];
  const fromDate = toISODate(window?.start_date);
  const untilDate = toISODate(window?.end_date);
  const rate = row.rate_per_day;

  // Remember archived pickup locations so an existing listing stays editable
  // even when the location no longer appears in the dropdown.
  const pickup = row.pickup_location?.name ?? '';
  if (row.pickup_location?.id && pickup) rememberPickupLocation(pickup, row.pickup_location.id);

  return {
    id: String(row.id),
    title: row.title,
    category: row.category?.name ?? '',
    // The backend has no course-code field; the form keeps it client-side only.
    courseCode: '',
    description: row.description ?? '',
    condition: row.condition ?? '',
    lendingType: rate ? 'For Rent' : 'Free Lending',
    price: rate ? `₱${trimDecimal(rate)}` : '',
    // No lend-duration field server-side; the availability window is the period.
    duration: '',
    availability: 'Available from',
    fromDate,
    untilDate,
    pickup,
    photos: (row.photos ?? []).map((p) => absoluteMediaUrl(p.file_reference) ?? p.file_reference),
    status: row.status?.name === 'active' ? 'active' : 'inactive',
    // Orders live in a later sprint; no counter exists yet.
    activeOrders: 0,
  };
}

function trimDecimal(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

// --- CP-303 listing detail --------------------------------------------------

export type ListingDetailReview = {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
};

export type ListingDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  price: string;
  isFree: boolean;
  photos: string[];
  lenderId: string;
  lenderName: string;
  lenderVerified: boolean;
  affiliation: string;
  availableFrom: string;
  availableTo: string;
  blockedDates: { startDate: string; endDate: string; reason: string }[];
  reviews: ListingDetailReview[];
};

type ApiListingDetail = ApiListing & {
  lender: { id: number; full_name: string; photo: string | null; affiliation: string };
  reviews: { id: number; rating: number; comment: string; created_at: string; reviewer: { id: number; full_name: string } }[];
  blocked_dates: { id: number; start_date: string; end_date: string; reason: string }[];
};

export async function getListingDetail(id: string): Promise<ListingDetail> {
  if (USE_MOCK) {
    throw new Error('Listing detail is not available in mock mode; open an item from search instead.');
  }
  const { data } = await http.get<ApiListingDetail>(`/listings/${id}/`);
  const core = mapListing(data);
  return {
    id: core.id,
    title: core.title,
    description: core.description,
    category: core.category,
    condition: core.condition,
    location: core.pickup,
    price: core.price || 'FREE',
    isFree: core.lendingType === 'Free Lending',
    photos: core.photos,
    lenderId: data.lender?.id != null ? String(data.lender.id) : '',
    lenderName: data.lender?.full_name ?? '',
    lenderVerified: true,
    affiliation: data.lender?.affiliation ?? '',
    availableFrom: core.fromDate,
    availableTo: core.untilDate,
    blockedDates: (data.blocked_dates ?? []).map((b) => ({
      startDate: toISODate(b.start_date),
      endDate: toISODate(b.end_date),
      reason: b.reason ?? '',
    })),
    reviews: (data.reviews ?? []).map((r) => ({
      id: String(r.id),
      rating: r.rating,
      comment: r.comment ?? '',
      reviewerName: r.reviewer?.full_name ?? '',
      createdAt: toISODate(r.created_at),
    })),
  };
}

// --- request body builders --------------------------------------------------

type PhotoPart = { uri: string; name: string; type: string };

function photoParts(uris: string[]): PhotoPart[] {
  return uris.map((uri, i) => {
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { uri, name: uri.split('/').pop() || `photo-${i}.${ext}`, type };
  });
}

// Backend wants a `[start, end]` window with start >= today and end >= start.
// "Available now" opens immediately; an empty untilDate becomes a 1-year window
// because the server requires an end date.
function availabilityWindow(input: ListingInput): { start_date: string; end_date: string } {
  const start = input.fromDate || todayISO();
  let end = input.untilDate;
  if (!end) {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    end = d.toISOString().slice(0, 10);
  }
  return { start_date: start, end_date: end };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildForm(input: ListingInput, opts: { includePhotos: boolean }): FormData {
  const form = new FormData();
  form.append('title', input.title);
  form.append('description', input.description);
  form.append('condition', input.condition);

  // The API wants the foreign-key id, not the name. A name that has no id
  // behind it (the lists did not load, or the row was renamed) must not be
  // dropped on the floor -- that would reach the server as a missing field
  // and come back as a bare "This field is required."
  const categoryId = getCategoryId(input.category);
  if (categoryId == null) {
    throw new Error(
      input.category
        ? 'That category is no longer available. Reload the page and pick another one.'
        : 'Choose a category before posting your item.',
    );
  }
  form.append('category', String(categoryId));

  const pickupId = getPickupLocationIdForListing(input.pickup);
  if (pickupId == null) {
    throw new Error(
      input.pickup
        ? 'That pickup location is no longer available. Reload the page and pick another one.'
        : 'Choose a pickup location before posting your item.',
    );
  }
  form.append('pickup_location', String(pickupId));

  form.append('is_ownership_confirmed', 'true');

  if (input.lendingType === 'For Rent') {
    const amount = Number(input.price.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(amount) && amount > 0) form.append('rate_per_day', String(amount));
  }

  form.append('availability_windows', JSON.stringify([availabilityWindow(input)]));

  if (opts.includePhotos) {
    for (const part of photoParts(input.photos)) {
      // React Native sends file parts as { uri, name, type }.
      form.append('photos', part as unknown as Blob);
    }
  }
  return form;
}

// --- mock -------------------------------------------------------------------

export async function getMyListings(): Promise<ManagedListing[]> {
  if (!USE_MOCK) {
    throw new Error(
      'Your-listings feed is not connected yet (pending the Lender Dashboard, CP-203). Set EXPO_PUBLIC_USE_MOCK=true to use mock data.',
    );
  }
  await delay();
  return mockListings.map((l) => ({ ...l }));
}

export async function createListing(input: ListingInput): Promise<ManagedListing> {
  if (USE_MOCK) {
    await delay();
    const created: ManagedListing = { ...input, id: `m${Date.now()}`, status: 'active', activeOrders: 0 };
    mockListings = [created, ...mockListings];
    return created;
  }

  const form = buildForm(input, { includePhotos: true });
  const { data } = await http.post<ApiListing>('/listings/', form);
  return mapListing(data);
}

export async function updateListing(id: string, input: ListingInput): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockListings = mockListings.map((l) => (l.id === id ? { ...l, ...input } : l));
    return;
  }

  // PATCH replaces photos only when new ones are supplied; the edit form always
  // carries the current photo set, so send them together.
  const form = buildForm(input, { includePhotos: input.photos.length > 0 });
  await http.patch<ApiListing>(`/listings/${id}/`, form);
}

export async function setListingActive(id: string, active: boolean): Promise<void> {  if (USE_MOCK) {
    await delay();
    mockListings = mockListings.map((l) => (l.id === id ? { ...l, status: active ? 'active' : 'inactive' } : l));
    return;
  }
  await http.post(`/listings/${id}/${active ? 'reactivate' : 'deactivate'}/`);
}

export async function deleteListing(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay();
    const target = mockListings.find((l) => l.id === id);
    if (target && target.activeOrders > 0) throw new ListingDeleteBlockedError();
    mockListings = mockListings.filter((l) => l.id !== id);
    return;
  }
  try {
    await http.delete(`/listings/${id}/`);
  } catch (e) {
    const message = extractApiError(e);
    if (/ongoing orders/i.test(message)) throw new ListingDeleteBlockedError();
    throw e;
  }
}
