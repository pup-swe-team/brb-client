import { http, USE_MOCK, clearAuthTokens, extractApiError, getApiErrorCode, getRefreshToken, refreshAccessToken, setAuthTokens } from '../../../services/http';
import { loadListingOptions } from '../../listings/constants';

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
  photo_url?: string | null;
  photo?: string | null;
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

// Thrown when the credentials are right but the email was never verified.
// The screen sends the user back to the verification prompt instead of in.
export class UnverifiedEmailError extends Error {
  email: string;

  constructor(email: string) {
    super('Please verify your email before logging in.');
    this.name = 'UnverifiedEmailError';
    this.email = email;
    Object.setPrototypeOf(this, UnverifiedEmailError.prototype);
  }
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
  // Never store a session for an unverified account.
  if (!data.user.email_verified_at) throw new UnverifiedEmailError(data.user.email);
  await setAuthTokens(data.tokens.access, data.tokens.refresh);
  // Categories/pickup locations need an authenticated request, so refresh them
  // now that we have a token (boot-time load runs unauthenticated and 401s).
  loadListingOptions();
  return data;
}

export async function verifyEmail(uid: string, token: string): Promise<string> {
  if (USE_MOCK) return 'Email verified successfully.';
  const { data } = await http.post<{ message: string }>('/auth/verify-email/', { uid, token });
  return data.message;
}

export async function getCurrentUser(): Promise<AuthUser> {
  if (USE_MOCK) return MOCK_USER;
  const { data } = await http.get<AuthUser>('/auth/me/');
  return data;
}

export async function applyForLenderRole(): Promise<AuthUser> {
  if (USE_MOCK) {
    return { ...MOCK_USER, lender_status: 'active' };
  }
  const { data } = await http.post<{ message: string; user: AuthUser }>('/auth/apply-lender/', {});
  return data.user;
}

export async function resendVerificationEmail(email: string): Promise<string> {
  if (USE_MOCK) return 'We sent a new verification link to your email.';
  const { data } = await http.post<{ message: string }>('/auth/resend-verification/', { email });
  return data.message;
}

export async function requestPasswordReset(email: string): Promise<string> {
  if (USE_MOCK) return 'If that email is registered, a reset link has been sent.';
  const { data } = await http.post<{ message?: string; detail?: string }>('/auth/password-reset/', { email });
  return data.message ?? data.detail ?? 'If that email is registered, a reset link has been sent.';
}

export async function confirmPasswordReset(uid: string, token: string, password: string, passwordConfirm: string): Promise<string> {
  if (USE_MOCK) return 'Your password has been reset.';
  const { data } = await http.post<{ message?: string; detail?: string }>('/auth/password-reset/confirm/', {
    uid,
    token,
    password,
    password_confirm: passwordConfirm,
  });
  return data.message ?? data.detail ?? 'Your password has been reset.';
}

export async function logout(): Promise<void> {
  try {
    if (!USE_MOCK) {
      // /auth/logout/ needs a valid access token, and it blacklists the
      // refresh token sent in the body. Refresh first so the token we hand
      // over is the current one, otherwise the server-side session would stay
      // alive after the user has left the app.
      await refreshAccessToken();
      const refresh = await getRefreshToken();
      if (refresh) await http.post('/auth/logout/', { refresh });
    }
  } catch {
    // The session may already be gone; the local tokens are cleared below.
  } finally {
    await clearAuthTokens();
  }
}

export { extractApiError, getApiErrorCode, refreshAccessToken };