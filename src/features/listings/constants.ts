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

// Whether the live lists have been fetched. A name that has no id behind it
// cannot be submitted (the API wants the FK id), so the create-listing form
// must not offer one. The seed lists above are display-only placeholders and
// are never submittable.
let categoriesLoaded = false;
let pickupLocationsLoaded = false;

/**
 * True when both live lists are available and every visible name maps to an
 * id. Callers that submit a selection (the create-listing form) check this
 * instead of assuming the seed list resolved.
 */
export function areListingOptionsReady(): boolean {
  return categoriesLoaded && pickupLocationsLoaded;
}

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

// Pull the live category + pickup-location lists. Safe to call repeatedly and
// never throws.
//
// Returns true only when both lists came back and every visible name now has
// an id behind it. An empty list is a legitimate answer (the admins have not
// set any up yet) and still counts as loaded -- the dropdown is then simply
// empty, which is honest. A failed request does not: the seed names would
// have no id, so the caller is told the lists are not ready.
export async function loadListingOptions(): Promise<boolean> {
  if (USE_MOCK) return true;

  const [categoriesRes, locationsRes] = await Promise.allSettled([
    http.get<ApiNamedRef[]>('/listings/categories/'),
    http.get<ApiPickupLocation[] | { results: ApiPickupLocation[] }>('/pickup-locations/'),
  ]);

  if (categoriesRes.status === 'fulfilled') {
    const rows = Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : [];
    categoriesById = new Map(rows.map((c) => [c.id, c.name]));
    categoryIdsByName = new Map(rows.map((c) => [c.name, c.id]));
    // Replace the seed list even when it is empty: a seed name has no id
    // behind it, so offering it would only produce a rejected submission.
    CATEGORIES = rows.map((c) => c.name);
    categoriesLoaded = true;
  } else {
    categoriesLoaded = false;
  }

  if (locationsRes.status === 'fulfilled') {
    const payload = locationsRes.value.data;
    const rows = Array.isArray(payload) ? payload : (payload?.results ?? []);
    locationIdsByName = new Map(rows.map((l) => [l.name, l.id]));
    PICKUP_LOCATIONS = rows.map((l) => ({ id: l.id, name: l.name, detail: l.description ?? '' }));
    rebuildLocationIndex();
    pickupLocationsLoaded = true;
  } else {
    pickupLocationsLoaded = false;
  }

  return areListingOptionsReady();
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
