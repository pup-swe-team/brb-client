import { Ionicons } from '@expo/vector-icons';
import { http, USE_MOCK } from '../../services/http';

// Fallback seed data. The live lists are fetched from the backend (categories
// from `GET /listings/categories/`, pickup points from `GET /pickup-locations/`)
// and replace these at runtime; the constants here keep the UI working offline
// and while the request is in flight.
export const DEFAULT_CATEGORIES = ['Textbooks', 'Electronics', 'Lab Equipment', 'Notes', 'School Supplies', 'Others'] as const;

// Categories are admin-managed DB rows, so the live set can (and does) differ
// from the seed list. Keep the type open: any backend category name is valid.
export type ListingCategory = string;

export const CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor'] as const;

export type PickupLocationOption = { id?: number; name: string; detail: string };

const DEFAULT_PICKUP_LOCATIONS: PickupLocationOption[] = [
  { name: 'PUP Main Gate', detail: 'Vicente Sil, Sta. Mesa' },
  { name: 'PUP CEA Building', detail: 'Main Building' },
  { name: 'PUP Lagoon', detail: 'College of Computer and Information Sciences' },
  { name: 'PUP Library', detail: 'PUP Sta. Mesa Campus' },
];

// Mutable module state, seeded with the fallbacks above.
export let CATEGORIES: ListingCategory[] = [...DEFAULT_CATEGORIES];
export let PICKUP_LOCATIONS: PickupLocationOption[] = [...DEFAULT_PICKUP_LOCATIONS];
export let LOCATIONS: string[] = PICKUP_LOCATIONS.map((l) => l.name);

type ApiNamedRef = { id: number; name: string };
type ApiPickupLocation = { id: number; name: string; description?: string | null };

let categoriesById = new Map<number, string>();
let categoryIdsByName = new Map<string, number>();
let locationIdsByName = new Map<string, number>();
let locationIdByListingName = new Map<string, number>();

function rebuildLocationIndex() {
  LOCATIONS = PICKUP_LOCATIONS.map((l) => l.name);
}

export function getCategoryId(name: string | null | undefined): number | undefined {
  if (!name) return undefined;
  return categoryIdsByName.get(name);
}

export function getPickupLocationId(name: string | null | undefined): number | undefined {
  if (!name) return undefined;
  return locationIdsByName.get(name);
}

// Some backend listings carry a pickup-location name that isn't in the current
// dropdown list (e.g. a location that was later archived). Remember it so the
// id can still be resolved and the item stays editable.
export function rememberPickupLocation(name: string, id: number) {
  locationIdByListingName.set(name, id);
  locationIdsByName.set(name, id);
}

export function getPickupLocationIdForListing(name: string | null | undefined): number | undefined {
  if (!name) return undefined;
  return locationIdsByName.get(name) ?? locationIdByListingName.get(name);
}

export function getCategoryName(id: number | null | undefined): string | undefined {
  if (id == null) return undefined;
  return categoriesById.get(id);
}

// Pull the live category + pickup-location lists. Safe to call repeatedly; on
// any failure the fallbacks stay in place. Never throws.
export async function loadListingOptions(): Promise<void> {
  if (USE_MOCK) return;

  const [categoriesRes, locationsRes] = await Promise.allSettled([
    http.get<ApiNamedRef[]>('/listings/categories/'),
    http.get<ApiPickupLocation[] | { results: ApiPickupLocation[] }>('/pickup-locations/'),
  ]);

  if (categoriesRes.status === 'fulfilled') {
    const rows = Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : [];
    if (rows.length > 0) {
      categoriesById = new Map(rows.map((c) => [c.id, c.name]));
      categoryIdsByName = new Map(rows.map((c) => [c.name, c.id]));
      CATEGORIES = rows.map((c) => c.name);
    }
  }

  if (locationsRes.status === 'fulfilled') {
    const payload = locationsRes.value.data;
    const rows = Array.isArray(payload) ? payload : (payload?.results ?? []);
    if (rows.length > 0) {
      PICKUP_LOCATIONS = rows.map((l) => ({ id: l.id, name: l.name, detail: l.description ?? '' }));
      locationIdsByName = new Map(rows.map((l) => [l.name, l.id]));
      rebuildLocationIndex();
    }
  }
}

export const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Textbooks: 'book-outline',
  Electronics: 'hardware-chip-outline',
  'Lab Equipment': 'flask-outline',
  Notes: 'document-text-outline',
  'School Supplies': 'create-outline',
  Others: 'cube-outline',
  Calculators: 'calculator-outline',
};

// Category icons are cosmetic; unknown (admin-added) categories fall back.
export function categoryIcon(category: string | null | undefined): keyof typeof Ionicons.glyphMap {
  return (category && CATEGORY_ICON[category]) || 'cube-outline';
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDate(v: string) {
  if (!DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
