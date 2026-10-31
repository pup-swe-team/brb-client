import { Platform } from 'react-native';
import { http, USE_MOCK } from '../../../services/http';

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

function getMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

function mapBackendToManaged(item: any): ManagedListing {
  const isRent = item.rate_per_day && Number(item.rate_per_day) > 0;
  const price = isRent ? `₱${Math.round(Number(item.rate_per_day))}` : '';
  const hasWindow = item.availability_windows && item.availability_windows.length > 0;
  const firstWindow = hasWindow ? item.availability_windows[0] : null;

  const fromDate = firstWindow?.start_date
    ? firstWindow.start_date
    : item.created_at
    ? item.created_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const untilDate = firstWindow?.end_date ? firstWindow.end_date : '';

  const photos: string[] = (item.photos ?? [])
    .map((p: any) => getMediaUrl(p.file_reference ?? p.photo ?? p.url))
    .filter((uri: any): uri is string => Boolean(uri));

  const statusStr = typeof item.status === 'string' ? item.status : item.status?.name;
  const status: 'active' | 'inactive' = statusStr === 'active' ? 'active' : 'inactive';

  return {
    id: String(item.id),
    title: item.title ?? '',
    category: item.category?.name ?? (typeof item.category === 'string' ? item.category : ''),
    courseCode: item.course_code ?? '',
    description: item.description ?? '',
    condition: item.condition ?? 'Good',
    lendingType: isRent ? 'For Rent' : 'Free Lending',
    price,
    duration: '5 days',
    availability: hasWindow ? 'Available from' : 'Available now',
    fromDate,
    untilDate,
    pickup: item.pickup_location?.name ?? (typeof item.pickup_location === 'string' ? item.pickup_location : ''),
    photos,
    status,
    activeOrders: item.active_orders ?? 0,
  };
}

export async function getMyListings(): Promise<ManagedListing[]> {
  if (USE_MOCK) {
    await delay();
    return mockListings.map((l) => ({ ...l }));
  }

  try {
    const { data } = await http.get('/listings/mine/');
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list.map(mapBackendToManaged);
  } catch {
    const { data } = await http.get('/listings/', { params: { mine: 'true' } });
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list.map(mapBackendToManaged);
  }
}

async function buildListingData(input: ListingInput, isCreate = false): Promise<FormData | Record<string, any>> {
  const hasLocalPhotos = (input.photos || []).some(
    (uri) => uri && (uri.startsWith('blob:') || uri.startsWith('file:') || uri.startsWith('data:')),
  );

  if (!hasLocalPhotos) {
    const payload: Record<string, any> = {
      title: input.title,
      description: input.description,
      condition: input.condition,
      category: input.category,
      pickup_location: input.pickup,
      rate_per_day: input.lendingType === 'For Rent' ? input.price.replace(/[^\d.]/g, '') || null : null,
    };
    if (isCreate) {
      payload.is_ownership_confirmed = true;
    }
    if (input.fromDate) {
      payload.start_date = input.fromDate;
      payload.available_from = input.fromDate;
    }
    if (input.untilDate) {
      payload.end_date = input.untilDate;
      payload.available_to = input.untilDate;
    }
    return payload;
  }

  const form = new FormData();
  form.append('title', input.title);
  form.append('description', input.description);
  form.append('condition', input.condition);
  form.append('category', input.category);
  form.append('pickup_location', input.pickup);
  if (input.lendingType === 'For Rent') {
    const p = input.price.replace(/[^\d.]/g, '');
    if (p) form.append('rate_per_day', p);
  }
  if (isCreate) {
    form.append('is_ownership_confirmed', 'true');
  }
  if (input.fromDate) {
    form.append('start_date', input.fromDate);
    form.append('available_from', input.fromDate);
  }
  if (input.untilDate) {
    form.append('end_date', input.untilDate);
    form.append('available_to', input.untilDate);
  }

  for (const uri of input.photos) {
    if (!uri) continue;
    if (Platform.OS === 'web') {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
        form.append('photos', file);
      } catch {
        // skip if not fetchable
      }
    } else {
      form.append('photos', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }
  }

  return form;
}

export async function createListing(input: ListingInput): Promise<ManagedListing> {
  if (USE_MOCK) {
    await delay();
    const created: ManagedListing = { ...input, id: `m${Date.now()}`, status: 'active', activeOrders: 0 };
    mockListings = [created, ...mockListings];
    return created;
  }

  const dataOrForm = await buildListingData(input, true);
  const isForm = typeof FormData !== 'undefined' && dataOrForm instanceof FormData;
  const config = isForm && Platform.OS !== 'web' ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

  const { data } = await http.post('/listings/', dataOrForm, config);
  return mapBackendToManaged(data);
}

export async function updateListing(id: string, input: ListingInput): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockListings = mockListings.map((l) => (l.id === id ? { ...l, ...input } : l));
    return;
  }

  const dataOrForm = await buildListingData(input, false);
  const isForm = typeof FormData !== 'undefined' && dataOrForm instanceof FormData;
  const config = isForm && Platform.OS !== 'web' ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

  await http.patch(`/listings/${id}/`, dataOrForm, config);
}

export async function setListingActive(id: string, active: boolean): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockListings = mockListings.map((l) => (l.id === id ? { ...l, status: active ? 'active' : 'inactive' } : l));
    return;
  }

  const endpoint = active ? `/listings/${id}/reactivate/` : `/listings/${id}/deactivate/`;
  await http.post(endpoint);
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
  } catch (e: any) {
    const msg = String(e?.response?.data?.detail || JSON.stringify(e?.response?.data || '')).toLowerCase();
    if (msg.includes('ongoing orders') || msg.includes('cannot delete') || e?.response?.status === 400) {
      throw new ListingDeleteBlockedError();
    }
    throw e;
  }
}
