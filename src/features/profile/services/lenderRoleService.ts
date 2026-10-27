import { http, USE_MOCK } from '../../../services/http';

// CP-1003 Apply for Lender role from profile. Mock first, real call behind the same signature.
// All real endpoints are unconfirmed (TODO).

// Module-level flag so the mock state survives navigation (screens unmount and remount).
let mockIsLender = false;

const MOCK_DELAY_MS = 600;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getLenderRoleStatus(): Promise<{ isLender: boolean }> {
  if (USE_MOCK) return { isLender: mockIsLender };
  const { data } = await http.get<{ isLender: boolean }>('/users/me/lender-role/'); // TODO: confirm endpoint and response shape
  return data;
}

export async function applyForLenderRole(): Promise<void> {
  if (USE_MOCK) {
    await wait(MOCK_DELAY_MS);
    mockIsLender = true;
    return;
  }
  await http.post('/users/me/lender-role/apply/'); // TODO: confirm endpoint
}
