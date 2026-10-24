import { http, USE_MOCK, clearAuthTokens } from '../../../services/http';

// Endpoint paths below match the shipped backend (`apps/users/urls.py`):
//   /auth/me/  /auth/password-change/  /auth/email-change/  /auth/deactivate/
// Still-mocked gaps (no endpoint yet): notification preferences (CP-802) and
// the profile-photo upload. Mock switch: EXPO_PUBLIC_MOCK_NO_BLOCKERS=true.

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
    // The backend stores a structured address; expose the free-text street part.
    homeAddress: data.street_address ?? '',
    bio: data.bio ?? '',
    email: data.email ?? '',
  };
}

export type ProfileUpdate = { fullName: string; contactNumber: string; homeAddress: string; bio: string; photoUri: string | null; photoChanged: boolean; photoFile?: File | { uri: string; name?: string; type?: string } | null };

export async function updateProfile(p: ProfileUpdate): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockProfile = { ...mockProfile, fullName: p.fullName, contactNumber: p.contactNumber, homeAddress: p.homeAddress, bio: p.bio, photoUri: p.photoUri };
    return;
  }

  if (p.photoChanged && p.photoFile) {
    const form = new FormData();
    form.append('full_name', p.fullName);
    form.append('contact_number', p.contactNumber);
    form.append('bio', p.bio);
    form.append('street_address', p.homeAddress);
    form.append('photo', p.photoFile as unknown as Blob);
    await http.patch('/auth/me/', form);
    return;
  }

  await http.patch('/auth/me/', {
    full_name: p.fullName,
    contact_number: p.contactNumber,
    bio: p.bio,
    street_address: p.homeAddress,
  });
}

export async function changePassword(current: string, next: string, confirm: string): Promise<void> {
  if (USE_MOCK) {
    await delay();
    if (current === 'wrong') throw new Error('Your current password is incorrect.');
    return;
  }
  await http.post('/auth/password-change/', { current_password: current, new_password: next, new_password_confirm: confirm });
}

export async function requestEmailChange(newEmail: string, _password: string): Promise<void> {
  if (USE_MOCK) {
    await delay();
    return;
  }
  // CP-1002 proves the change with a link mailed to the new address; the
  // current password is not part of the request payload.
  await http.post('/auth/email-change/', { new_email: newEmail });
}

export async function resendEmailChangeVerification(_newEmail: string): Promise<void> {
  if (USE_MOCK) {
    await delay(250);
    return;
  }
  // No resend endpoint: the CP-1002 confirmation is a single mailed link.
  throw new Error('Resending the email-change link is not available yet.');
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  if (USE_MOCK) {
    await delay(250);
    return JSON.parse(JSON.stringify(mockPrefs));
  }
  // Notification preferences belong to CP-802 (Sprint 5); no endpoint yet.
  throw new Error('Notification preferences are not connected yet (CP-802). Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  if (USE_MOCK) {
    await delay();
    mockPrefs = JSON.parse(JSON.stringify(prefs));
    return;
  }
  // Notification preferences belong to CP-802 (Sprint 5); no endpoint yet.
  throw new Error('Notification preferences are not connected yet (CP-802). Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}

// Open orders or requests that stop an account from being deactivated.
// The backend has no dedicated "check" endpoint: blockers are returned as
// counts in the 400 body of the deactivation POST itself.
export async function getDeactivationBlockers(): Promise<string[]> {
  if (USE_MOCK) {
    await delay(250);
    if (process.env.EXPO_PUBLIC_MOCK_NO_BLOCKERS === 'true') return [];
    return ['You are still borrowing 1 item (T-Square). Return it first.', 'You have 1 overdue item (Concepts of Programming Languages).'];
  }
  // Nothing to pre-check server-side; let the deactivation call report them.
  return [];
}

function blockersFromCounts(openOrders: unknown, openCases: unknown): string[] {
  const out: string[] = [];
  const orders = typeof openOrders === 'number' ? openOrders : 0;
  const cases = typeof openCases === 'number' ? openCases : 0;
  if (orders > 0) out.push(`You have ${orders} open order${orders === 1 ? '' : 's'}. Finish or cancel ${orders === 1 ? 'it' : 'them'} first.`);
  if (cases > 0) out.push(`You have ${cases} unresolved unreturned-item case${cases === 1 ? '' : 's'}.`);
  return out;
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
    // BE-BUG-2004: the endpoint proves the password before closing the account.
    await http.post('/auth/deactivate/', { password });
  } catch (e: any) {
    const data = e?.response?.data;
    if (e?.response?.status === 400 && data && (data.open_orders != null || data.open_unreturned_cases != null)) {
      throw new DeactivationBlockedError(blockersFromCounts(data.open_orders, data.open_unreturned_cases));
    }
    throw e;
  }
  await clearAuthTokens();
}
