import { http, USE_MOCK, getApiErrorCode } from '../../../services/http';

// Thrown when the emailed reset link is too old (links work 1 hour) or was
// already used. ResetPasswordScreen switches to its "Link Expired" state.
export class ResetLinkExpiredError extends Error {
  constructor() {
    super('This reset link has expired or was already used.');
    this.name = 'ResetLinkExpiredError';
    Object.setPrototypeOf(this, ResetLinkExpiredError.prototype);
  }
}

// TODO: confirm both endpoint paths and the error codes below with the backend lead.
const EXPIRED_CODES = ['invalid_token', 'token_expired', 'token_used'];

// Step 1: "Forgot Password?" -> ask the backend to email a reset link.
export async function requestPasswordReset(email: string): Promise<string> {
  if (USE_MOCK) return 'We sent a password reset link to your email.';
  const { data } = await http.post<{ detail?: string; message?: string }>(
    '/auth/password-reset/',
    { email },
  );
  return data.detail ?? data.message ?? 'We sent a password reset link to your email.';
}

export interface ConfirmPasswordResetPayload {
  uid: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Step 2: the link opens the app with uid + token; send them with the new password.
export async function confirmPasswordReset(
  payload: ConfirmPasswordResetPayload,
): Promise<string> {
  if (USE_MOCK) {
    // Open the screen with token "expired" to preview the Link Expired state.
    if (payload.token === 'expired') throw new ResetLinkExpiredError();
    return 'Your password has been reset.';
  }
  try {
    const { data } = await http.post<{ detail?: string; message?: string }>(
      '/auth/password-reset/confirm/',
      {
        uid: payload.uid,
        token: payload.token,
        new_password: payload.newPassword,
        new_password_confirm: payload.confirmPassword,
      },
    );
    return data.detail ?? data.message ?? 'Your password has been reset.';
  } catch (err) {
    const code = getApiErrorCode(err);
    if (code && EXPIRED_CODES.includes(code)) throw new ResetLinkExpiredError();
    throw err;
  }
}
