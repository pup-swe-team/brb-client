import { create, isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';
export const http = create({ baseURL: process.env.EXPO_PUBLIC_API_URL, timeout: 15000 });
export const TOKEN_KEY = 'brb_access_token';
export const REFRESH_TOKEN_KEY = 'brb_refresh_token';

const PUBLIC_ENDPOINTS = [
  '/auth/register/',
  '/auth/login/',
  '/auth/verify-email/',
  '/auth/token/refresh/',
];

http.interceptors.request.use(async (cfg) => {
  if (!PUBLIC_ENDPOINTS.some((p) => cfg.url?.includes(p))) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setAuthTokens(access: string, refresh?: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  if (refresh) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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