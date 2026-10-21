import { Platform } from 'react-native';

// Shared helpers for translating backend DRF payloads into the client's
// view-model shapes. The backend is the source of truth; keep every
// field-name reshape in one place so services stay thin.

export type ApiPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiNamedRef = { id: number; name: string };

export function isPaginated<T>(value: unknown): value is ApiPaginated<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as ApiPaginated<T>).results)
  );
}

// Unwrap a DRF paginated envelope, or pass through a plain array.
export function unwrapList<T>(data: unknown): { items: T[]; total: number; page: number; totalPages: number } {
  if (isPaginated<T>(data)) {
    const count = data.count ?? data.results.length;
    return {
      items: data.results,
      total: count,
      page: 1,
      totalPages: 1,
    };
  }
  const items = Array.isArray(data) ? (data as T[]) : [];
  return { items, total: items.length, page: 1, totalPages: 1 };
}

// Backend may serve absolute or root-relative media paths; make them absolute
// so <Image source={{ uri }}> works on device and web alike.
export function absoluteMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.EXPO_PUBLIC_API_URL ?? '';
  if (!base) return url;
  const origin = base.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

// DRF serializes DateTime/Date; the client wants a plain YYYY-MM-DD.
export function toISODate(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function orDash(value: unknown): string {
  return value === null || value === undefined || value === '' ? '' : String(value);
}

export const isWeb = Platform.OS === 'web';
