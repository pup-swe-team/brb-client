import { http, USE_MOCK, clearAuthTokens, extractApiError, getRefreshToken, setAuthTokens } from '../../../services/http';

export type Affiliation = 'Student' | 'Faculty' | 'Staff';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  contact_number: string;
  affiliation: Affiliation;
  account_status: string;
  lender_status: string;
  email_verified_at: string | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  contact_number: string;
  affiliation: Affiliation;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

const MOCK_USER: AuthUser = {
  id: 1,
  email: 'danielo.ang@iskolarngbayan.pup.edu.ph',
  full_name: 'Danielo Ang',
  contact_number: '09171234567',
  affiliation: 'Student',
  account_status: 'active',
  lender_status: 'verified',
  email_verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const MOCK_TOKENS: AuthTokens = { access: 'mock-access', refresh: 'mock-refresh' };

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  if (USE_MOCK) return MOCK_USER;
  const { data } = await http.post<{ message: string; user: AuthUser }>('/auth/register/', payload);
  return data.user;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (USE_MOCK) {
    await setAuthTokens(MOCK_TOKENS.access, MOCK_TOKENS.refresh);
    return { user: MOCK_USER, tokens: MOCK_TOKENS };
  }
  const { data } = await http.post<LoginResponse>('/auth/login/', { email, password });
  await setAuthTokens(data.tokens.access, data.tokens.refresh);
  return data;
}

export async function verifyEmail(uid: string, token: string): Promise<string> {
  if (USE_MOCK) return 'Email verified successfully.';
  const { data } = await http.post<{ message: string }>('/auth/verify-email/', { uid, token });
  return data.message;
}

export async function logout(): Promise<void> {
  const refresh = await getRefreshToken();
  try {
    if (!USE_MOCK && refresh) {
      await http.post('/auth/logout/', { refresh });
    }
  } finally {
    await clearAuthTokens();
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  const { data } = await http.post<{ access: string }>('/auth/token/refresh/', { refresh });
  await setAuthTokens(data.access);
  return data.access;
}

export { extractApiError };