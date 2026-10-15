import { isAxiosError } from 'axios';
import { http, USE_MOCK, clearAuthTokens, getApiErrorCode } from '../../../services/http';
import { getCurrentUser } from '../../auth/services/authService';
import type { Affiliation, AuthUser } from '../../auth/services/authService';

// Account / settings endpoints (CP-1001 area): profile, password, email,
// notification preferences, deactivation.
// TODO: none of these paths are in docs/BACKEND_CONNECTION.md yet. Confirm every
// path, field name and error code with the backend lead. Mock-first until then.

/* =========================================================
   PROFILE
========================================================= */

export interface ProfileDetails {
  fullName: string;
  email: string;
  affiliation: Affiliation;
  contactNumber: string;
  homeAddress: string;
  bio: string;
  photoUri: string | null;
}

export interface PhotoUpload {
  uri: string;
  fileName?: string;
  mimeType?: string;
  // Web only: expo-image-picker supplies the real File (same as verification.ts).
  file?: File;
}

export interface UpdateProfilePayload {
  fullName: string;
  contactNumber: string;
  homeAddress: string;
  bio: string;
  // undefined = keep the current photo.
  photo?: PhotoUpload;
}

type AccountUser = AuthUser & {
  home_address?: string;
  bio?: string;
  photo?: string | null;
};

function toProfile(user: AccountUser): ProfileDetails {
  return {
    fullName: user.full_name,
    email: user.email,
    affiliation: user.affiliation,
    contactNumber: user.contact_number,
    homeAddress: user.home_address ?? '',
    bio: user.bio ?? '',
    photoUri: user.photo ?? null,
  };
}

let mockProfile: ProfileDetails | null = null;

export async function getProfileDetails(): Promise<ProfileDetails> {
  const user = (await getCurrentUser()) as AccountUser;
  if (USE_MOCK) {
    if (!mockProfile) mockProfile = { ...toProfile(user), homeAddress: 'Sta. Mesa, Manila' };
    return mockProfile;
  }
  return toProfile(user);
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileDetails> {
  if (USE_MOCK) {
    const current = await getProfileDetails();
    mockProfile = {
      ...current,
      fullName: payload.fullName,
      contactNumber: payload.contactNumber,
      homeAddress: payload.homeAddress,
      bio: payload.bio,
      photoUri: payload.photo ? payload.photo.uri : current.photoUri,
    };
    return mockProfile;
  }

  if (payload.photo) {
    const form = new FormData();
    form.append('full_name', payload.fullName);
    form.append('contact_number', payload.contactNumber);
    form.append('home_address', payload.homeAddress);
    form.append('bio', payload.bio);
    if (payload.photo.file) {
      form.append('photo', payload.photo.file);
    } else {
      form.append('photo', {
        uri: payload.photo.uri,
        name: payload.photo.fileName ?? 'profile-photo.jpg',
        type: payload.photo.mimeType ?? 'image/jpeg',
      } as any);
    }
    // No manual Content-Type: axios adds the multipart boundary per platform.
    const { data } = await http.patch<AccountUser>('/auth/me/', form);
    return toProfile(data);
  }

  const { data } = await http.patch<AccountUser>('/auth/me/', {
    full_name: payload.fullName,
    contact_number: payload.contactNumber,
    home_address: payload.homeAddress,
    bio: payload.bio,
  });
  return toProfile(data);
}

/* =========================================================
   PASSWORD
========================================================= */

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const WRONG_CURRENT_PASSWORD_CODE = 'invalid_current_password';

export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  if (USE_MOCK) return 'Your password has been updated.';
  const { data } = await http.post<{ detail?: string; message?: string }>(
    '/auth/change-password/',
    {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
      new_password_confirm: payload.confirmPassword,
    },
  );
  return data.detail ?? data.message ?? 'Your password has been updated.';
}

/* =========================================================
   EMAIL (change + re-verification)
========================================================= */

export interface PendingEmailChange {
  newEmail: string;
}

let mockPendingEmail: PendingEmailChange | null = null;

// null = no change waiting for verification.
export async function getPendingEmailChange(): Promise<PendingEmailChange | null> {
  if (USE_MOCK) return mockPendingEmail;
  try {
    const { data } = await http.get<{ new_email?: string } | null>('/auth/change-email/');
    return data?.new_email ? { newEmail: data.new_email } : null;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

// The current email stays active until the new one is verified.
export async function requestEmailChange(newEmail: string): Promise<PendingEmailChange> {
  if (USE_MOCK) {
    mockPendingEmail = { newEmail };
    return mockPendingEmail;
  }
  await http.post('/auth/change-email/', { new_email: newEmail });
  return { newEmail };
}

export async function resendEmailChangeLink(): Promise<string> {
  if (USE_MOCK) return 'We sent a new verification link.';
  const { data } = await http.post<{ detail?: string; message?: string }>(
    '/auth/change-email/resend/',
  );
  return data?.detail ?? data?.message ?? 'We sent a new verification link.';
}

export async function cancelEmailChange(): Promise<void> {
  if (USE_MOCK) {
    mockPendingEmail = null;
    return;
  }
  await http.delete('/auth/change-email/');
}

/* =========================================================
   NOTIFICATION PREFERENCES
========================================================= */

export interface NotificationPreferences {
  orderUpdates: boolean;
  messages: boolean;
  reviews: boolean;
  accountAndVerification: boolean;
}

let mockPreferences: NotificationPreferences = {
  orderUpdates: true,
  messages: true,
  reviews: true,
  accountAndVerification: true,
};

type PreferencesDto = {
  order_updates: boolean;
  messages: boolean;
  reviews: boolean;
  account_verification: boolean;
};

function fromDto(dto: PreferencesDto): NotificationPreferences {
  return {
    orderUpdates: dto.order_updates,
    messages: dto.messages,
    reviews: dto.reviews,
    accountAndVerification: dto.account_verification,
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (USE_MOCK) return mockPreferences;
  const { data } = await http.get<PreferencesDto>('/notifications/preferences/');
  return fromDto(data);
}

export async function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  if (USE_MOCK) {
    mockPreferences = { ...mockPreferences, ...patch };
    return mockPreferences;
  }
  const body: Partial<PreferencesDto> = {};
  if (patch.orderUpdates !== undefined) body.order_updates = patch.orderUpdates;
  if (patch.messages !== undefined) body.messages = patch.messages;
  if (patch.reviews !== undefined) body.reviews = patch.reviews;
  if (patch.accountAndVerification !== undefined) {
    body.account_verification = patch.accountAndVerification;
  }
  const { data } = await http.patch<PreferencesDto>('/notifications/preferences/', body);
  return fromDto(data);
}

/* =========================================================
   DEACTIVATE ACCOUNT
========================================================= */

// Thrown when the account has an open order or an open Unreturned case.
// SettingsScreen shows the "Can't deactivate yet" message instead of deactivating.
export class DeactivationBlockedError extends Error {
  constructor() {
    super('You have an open order or an open Unreturned case.');
    this.name = 'DeactivationBlockedError';
    Object.setPrototypeOf(this, DeactivationBlockedError.prototype);
  }
}

// DEV ONLY: flip to true to preview the blocked message while USE_MOCK is on.
const MOCK_DEACTIVATION_BLOCKED = false;

export async function deactivateAccount(): Promise<void> {
  if (USE_MOCK) {
    if (MOCK_DEACTIVATION_BLOCKED) throw new DeactivationBlockedError();
    await clearAuthTokens();
    return;
  }
  try {
    await http.post('/auth/deactivate/');
  } catch (err) {
    const blocked =
      getApiErrorCode(err) === 'deactivation_blocked' ||
      (isAxiosError(err) && err.response?.status === 409);
    if (blocked) throw new DeactivationBlockedError();
    throw err;
  }
  // Deactivated: the session is no longer valid.
  await clearAuthTokens();
}
