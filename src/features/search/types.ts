export type SortOption = 'relevance' | 'newest' | 'rating';

export type ListingCategory = 'Books' | 'Equipment' | 'Clothing' | 'Electronics' | 'Lab Gear';

export type Listing = {
  id: string;
  title: string;
  category: ListingCategory;
  location: string;
  ownerName: string;
  ownerVerified: boolean; // CP-107: only a flag, never the document
  rating: number;
  reviewCount: number;
  availableFrom: string; // YYYY-MM-DD
  availableTo: string; // YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
};

export type SearchFilters = {
  category: ListingCategory | null;
  location: string | null;
  minRating: number | null;
  availableFrom: string; // '' = not set
  availableTo: string; // '' = not set
};

export type SearchParams = {
  keyword: string;
  filters: SearchFilters;
  sort: SortOption;
  page: number;
  pageSize: number;
};

export type SearchResult = {
  items: Listing[];
  page: number;
  totalPages: number;
  total: number;
};

export const EMPTY_FILTERS: SearchFilters = {
  category: null,
  location: null,
  minRating: null,
  availableFrom: '',
  availableTo: '',
};

export const CATEGORIES: ListingCategory[] = ['Books', 'Equipment', 'Clothing', 'Electronics', 'Lab Gear'];

// TODO: replace with the real campus locations from the backend.
export const LOCATIONS = ['Main Campus', 'Engineering Bldg', 'Library', 'Dorm Area'];

export const RATING_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '3.0+', value: 3 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Newest', value: 'newest' },
  { label: 'Rating', value: 'rating' },
];

export const PAGE_SIZE = 6;

export function countActiveFilters(f: SearchFilters): number {
  return (
    (f.category ? 1 : 0) +
    (f.location ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.availableFrom || f.availableTo ? 1 : 0)
  );
}