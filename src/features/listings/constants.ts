import { Ionicons } from '@expo/vector-icons';

export const CATEGORIES = ['Textbooks', 'Electronics', 'Lab Equipment', 'Notes', 'School Supplies', 'Others'] as const;
export type ListingCategory = (typeof CATEGORIES)[number];

export const CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor'] as const;

// Admin-defined fixed set of pickup points. Users can only choose from this list.
// TODO: load from the backend once the Admin pickup-location endpoint exists.
export const PICKUP_LOCATIONS: { name: string; detail: string }[] = [
  { name: 'PUP Main Gate', detail: 'Vicente Sil, Sta. Mesa' },
  { name: 'PUP CEA Building', detail: 'Main Building' },
  { name: 'PUP Lagoon', detail: 'College of Computer and Information Sciences' },
  { name: 'PUP Library', detail: 'PUP Sta. Mesa Campus' },
];
export const LOCATIONS = PICKUP_LOCATIONS.map((l) => l.name);

export const CATEGORY_ICON: Record<ListingCategory, keyof typeof Ionicons.glyphMap> = {
  Textbooks: 'book-outline',
  Electronics: 'hardware-chip-outline',
  'Lab Equipment': 'flask-outline',
  Notes: 'document-text-outline',
  'School Supplies': 'create-outline',
  Others: 'cube-outline',
};

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
