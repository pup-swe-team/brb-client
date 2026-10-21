import { create, isAxiosError } from 'axios';
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