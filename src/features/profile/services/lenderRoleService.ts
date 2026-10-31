import { extractApiError, http, USE_MOCK } from '../../../services/http';

// CP-1003 Apply for Lender role from profile. Mock first, real call behind the same signature.

// Module-level flag so the mock state survives navigation (screens unmount and remount).
let mockIsLender = false;

const MOCK_DELAY_MS = 600;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getLenderRoleStatus(): Promise<{ isLender: boolean }> {
  if (USE_MOCK) return { isLender: mockIsLender };
  try {
    const { data } = await http.get<any>('/auth/me/');
    const lenderStatus = data?.lender_status || data?.lenderStatus;
    if (typeof lenderStatus === 'string') {
      const normalized = lenderStatus.toLowerCase();
      if (normalized === 'approved' || normalized === 'verified' || normalized === 'active') {
        return { isLender: true };
      }
      return { isLender: false };
    }
    if (typeof data?.isLender === 'boolean') {
      return { isLender: data.isLender };
    }
    return { isLender: false };
  } catch {
    return { isLender: false };
  }
}

export async function applyForLenderRole(): Promise<void> {
  if (USE_MOCK) {
    await wait(MOCK_DELAY_MS);
    mockIsLender = true;
    return;
  }
  try {
    await http.post('/auth/apply-lender/');
  } catch (error: any) {
    const message = extractApiError(error);
    throw new Error(message);
  }
}
