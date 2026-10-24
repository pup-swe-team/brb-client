import { create, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';
export const http = create({ baseURL: process.env.EXPO_PUBLIC_API_URL, timeout: 15000 });
export const TOKEN_KEY = 'brb_access_token';
export const REFRESH_TOKEN_KEY = 'brb_refresh_token';

// SecureStore has no web native module (its calls throw on web), so tokens fall
// back to localStorage there. Native builds keep using the secure keychain.
interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const webStorage =
  Platform.OS === 'web'
    ? (globalThis as { localStorage?: WebStorage }).localStorage ?? null
    : null;

async function readItem(key: string): Promise<string | null> {
  if (webStorage) {
    try {
      return webStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function writeItem(key: string, value: string): Promise<void> {
  if (webStorage) {
    try {
      webStorage.setItem(key, value);
      return;
    } catch {
      return;
    }
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (webStorage) {
    try {
      webStorage.removeItem(key);
      return;
    } catch {
      return;
    }
  }
  await SecureStore.deleteItemAsync(key);
}

const PUBLIC_ENDPOINTS = [
  '/auth/register/',
  '/auth/login/',
  '/auth/verify-email/',
  '/auth/resend-verification/',
  '/auth/token/refresh/',
  '/auth/password-reset/',
];

http.interceptors.request.use(async (cfg) => {
  if (!PUBLIC_ENDPOINTS.some((p) => cfg.url?.includes(p))) {
    const token = await readItem(TOKEN_KEY);
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// --- automatic access-token refresh -----------------------------------------
//
// The backend issues short-lived access tokens (15 minutes) and rotates the
// refresh token on every use. Without an automatic refresh the app starts
// failing with 401s a quarter of an hour after login -- and because every
// screen also asks the server about the account (identity status, category
// and pickup lists), an expired token makes the app claim the account is not
// verified even when it is.
//
// A 401 therefore triggers exactly one refresh, shared by all requests that
// are waiting, and the original request is then retried with the new token.

const NO_REFRESH_URLS = [...PUBLIC_ENDPOINTS, '/auth/logout/'];

let refreshInFlight: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  const refresh = await readItem(REFRESH_TOKEN_KEY);
  if (!refresh) return null;
  try {
    const { data } = await http.post<{ access: string; refresh?: string }>('/auth/token/refresh/', { refresh });
    // The server rotates refresh tokens: the one we just used is blacklisted
    // the moment it is spent, so the new one has to be stored. Keeping only
    // the access token would break the next refresh (and with it the whole
    // session) 15 minutes later.
    await setAuthTokens(data.access, data.refresh);
    return data.access;
  } catch {
    // The session is over: the refresh token expired or was revoked. Drop the
    // local tokens so the app falls back to the login screen.
    await clearAuthTokens();
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!isAxiosError(error)) throw error;
    const original = error.config as (InternalAxiosRequestConfig & { _brbRetried?: boolean }) | undefined;
    if (!original || error.response?.status !== 401) throw error;
    // Never retry the refresh call itself, a public endpoint, or logout (its
    // body carries the refresh token that the refresh would rotate away).
    if (original._brbRetried) throw error;
    if (NO_REFRESH_URLS.some((p) => (original.url ?? '').includes(p))) throw error;

    original._brbRetried = true;
    const access = await refreshAccessToken();
    if (!access) throw error;
    // The request interceptor re-reads the token from storage, so the retry
    // picks up the new access token by itself.
    return http(original);
  },
);

export async function getAccessToken(): Promise<string | null> {
  return readItem(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return readItem(REFRESH_TOKEN_KEY);
}

export async function setAuthTokens(access: string, refresh?: string): Promise<void> {
  await writeItem(TOKEN_KEY, access);
  if (refresh) await writeItem(REFRESH_TOKEN_KEY, refresh);
}

export async function clearAuthTokens(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(REFRESH_TOKEN_KEY);
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    const code = (error.response?.data as { code?: unknown } | undefined)?.code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

export function extractApiError(error: unknown): string {
  if (isAxiosError(error)) {
    // No response at all: the request never reached the server.
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : "Can't reach the server. Check your internet connection and try again.";
    }

    const data: any = error.response.data;
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string' && data.detail) return data.detail;
      const first = Object.values(data)[0];
      if (Array.isArray(first) && first[0]) return String(first[0]);
      if (typeof first === 'string' && first) return first;
    }
  }
  return 'Something went wrong. Please try again.';
}