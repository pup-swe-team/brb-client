import { Platform } from 'react-native';
import { http, USE_MOCK, clearAuthTokens } from '../../../services/http';

// Deactivation uses the documented endpoint POST /users/me/deactivate/ (BACKEND_API_COORDINATION_GUIDE 3.3).
// The other paths below are still assumptions until the backend documents them.
// Mock switches: EXPO_PUBLIC_MOCK_NO_BLOCKERS=true lets deactivation succeed in mock mode.

export type AccountProfile = {
  fullName: string;
  photoUri: string | null;
  contactNumber: string;
  homeAddress: string;
  bio: string;
  email: string;
};

export type NotificationPrefs = Record<string, { push: boolean; email: boolean }>;

export const NOTIFICATION_CATEGORIES: { key: string; label: string; description: string; locked?: boolean }[] = [
  { key: 'requests', label: 'Request updates', description: 'Requests sent, confirmed or declined.' },
  { key: 'handover', label: 'Handover and return', description: 'Pickup codes and return reminders.' },
  { key: 'overdue', label: 'Overdue alerts', description: 'Items that are late or unreturned.' },
  { key: 'messages', label: 'Chat messages', description: 'New messages from other users.' },
  { key: 'reviews', label: 'Reviews', description: 'When someone reviews you.' },
  { key: 'security', label: 'Account and security', description: 'Password, email and sign-in changes.', locked: true },
];

export class DeactivationBlockedError extends Error {
  blockers: string[];
  constructor(blockers: string[]) {
    super('Your account cannot be deactivated right now.');
    this.name = 'DeactivationBlockedError';
    this.blockers = blockers;
    Object.setPrototypeOf(this, DeactivationBlockedError.prototype);
  }
}

let mockProfile: AccountProfile = {
  fullName: 'Danielo Ang',
  photoUri: null,
  contactNumber: '09171234567',
  homeAddress: '',
  bio: '',
  email: 'danielo.ang@iskolarngbayan.pup.edu.ph',
};

let mockPrefs: NotificationPrefs = Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((c) => [c.key, { push: true, email: c.key !== 'messages' }]),
);

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export async function getAccountProfile(): Promise<AccountProfile> {
  if (USE_MOCK) {
    await delay(250);
    return mockProfile;
  }
  const { data } = await http.get('/auth/me/');
  return {
    fullName: data.full_name ?? '',
    photoUri: data.photo_url ?? data.photo ?? null,
    contactNumber: data.contact_number ?? '',
    homeAddress: data.street_address ?? data.home_address ?? '',
    bio: data.bio ?? '',
    email: data.email ?? '',
  };
}

export type ProfileUpdate = {
  fullName: string;
  contactNumber: string;
  homeAddress: string;
  bio: string;
  photoUri: string | null;
  photoChanged: boolean;
  photoFile?: File;
  photoFileName?: string;
  photoMimeType?: string;
};

export async function updateProfile(p: ProfileUpdate): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockProfile = { ...mockProfile, fullName: p.fullName, contactNumber: p.contactNumber, homeAddress: p.homeAddress, bio: p.bio, photoUri: p.photoUri };
    return;
  }
  const form = new FormData();
  form.append('full_name', p.fullName);
  form.append('contact_number', p.contactNumber);
  form.append('street_address', p.homeAddress);
  form.append('home_address', p.homeAddress);
  form.append('bio', p.bio);
  if (p.photoChanged && p.photoUri) {
    if (Platform.OS === 'web') {
      if (p.photoFile) {
        form.append('photo', p.photoFile);
      } else {
        try {
          const res = await fetch(p.photoUri);
          const blob = await res.blob();
          const fileName = p.photoFileName || 'profile.jpg';
          const file = new File([blob], fileName, {
            type: p.photoMimeType || blob.type || 'image/jpeg',
          });
          form.append('photo', file);
        } catch {
          const res = await fetch(p.photoUri);
          const blob = await res.blob();
          form.append('photo', blob, p.photoFileName || 'profile.jpg');
        }
      }
    } else {
      form.append('photo', {
        uri: p.photoUri,
        name: p.photoFileName || 'profile.jpg',
        type: p.photoMimeType || 'image/jpeg',
      } as any);
    }
  }
  await http.patch('/auth/me/', form);
}

export async function changePassword(current: string, next: string, confirm: string): Promise<void> {
  if (USE_MOCK) {
    await delay();
    if (current === 'wrong') throw new Error('Your current password is incorrect.');
    return;
  }
  await http.post('/auth/change-password/', { current_password: current, new_password: next, new_password_confirm: confirm });
}

export async function requestEmailChange(newEmail: string, password: string): Promise<void> {
  if (USE_MOCK) {
    await delay();
    return;
  }
  await http.post('/auth/email-change/', { new_email: newEmail, password });
}

export async function resendEmailChangeVerification(newEmail: string): Promise<void> {
  if (USE_MOCK) {
    await delay(250);
    return;
  }
  await http.post('/auth/email-change/', { new_email: newEmail });
}

export async function confirmEmailChange(uid: string, token: string): Promise<void> {
  if (USE_MOCK) {
    await delay(250);
    return;
  }
  await http.post('/auth/email-change/confirm/', { uid, token });
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  if (USE_MOCK) {
    await delay(250);
    return JSON.parse(JSON.stringify(mockPrefs));
  }
  const { data } = await http.get<NotificationPrefs>('/auth/notification-preferences/');
  return data;
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockPrefs = JSON.parse(JSON.stringify(prefs));
    return;
  }
  await http.put('/auth/notification-preferences/', prefs);
}

// Open orders or requests that stop an account from being deactivated.
// The backend has no separate "check" endpoint: POST /users/me/deactivate/ itself answers
// 400 { code: 'has_unsettled_orders', detail, open_orders, open_unreturned_cases }.
// So the real pre-check is empty and the block is discovered on submit (see deactivateAccount).
export async function getDeactivationBlockers(): Promise<string[]> {
  if (USE_MOCK) {
    await delay(250);
    if (process.env.EXPO_PUBLIC_MOCK_NO_BLOCKERS === 'true') return [];
    return ['You are still borrowing 1 item (T-Square). Return it first.', 'You have 1 overdue item (Concepts of Programming Languages).'];
  }
  return [];
}

function blockersFromResponse(data: any): string[] {
  const list: string[] = [];
  const open = Number(data?.open_orders ?? 0);
  const cases = Number(data?.open_unreturned_cases ?? 0);
  if (open > 0) list.push(`You have ${open} active or pending order${open === 1 ? '' : 's'} that must be returned, completed or cancelled first.`);
  if (cases > 0) list.push(`You have ${cases} unreturned item case${cases === 1 ? '' : 's'} that must be resolved first.`);
  if (list.length === 0 && typeof data?.detail === 'string') list.push(data.detail);
  return list;
}

export async function deactivateAccount(password: string): Promise<void> {
  if (USE_MOCK) {
    const blockers = await getDeactivationBlockers();
    if (blockers.length > 0) throw new DeactivationBlockedError(blockers);
    await delay();
    await clearAuthTokens();
    return;
  }
  try {
    await http.post('/users/me/deactivate/', { password, confirm: true });
  } catch (e: any) {
    const data = e?.response?.data;
    if (data?.code === 'has_unsettled_orders') {
      throw new DeactivationBlockedError(blockersFromResponse(data));
    }
    throw e;
  }
  await clearAuthTokens();
}
