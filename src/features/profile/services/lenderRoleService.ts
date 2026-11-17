import { extractApiError, http, USE_MOCK } from '../../../services/http';
import { getMyOrders, mockDeclineRequestedLendOrders } from '../../orders/services/ordersService';

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

/* =========================================================
   CP-205 Revoke own Lender status (HTML 18 confirm, 19 blocked)
   Revoking declines pending requests, deactivates the user's listings and keeps Borrower access.
   It is blocked while the user has a Confirmed or Active lend order.
   The real path and the blocked-response shape are ASSUMPTIONS until the backend documents them.
   Mock: blocked by the mock Lender orders; set EXPO_PUBLIC_MOCK_NO_BLOCKERS=true to let it succeed.
========================================================= */

export class RevokeBlockedError extends Error {
  constructor() {
    super('You have a Confirmed or Active order. Finish it first, then you can revoke your Lender status.');
    this.name = 'RevokeBlockedError';
    Object.setPrototypeOf(this, RevokeBlockedError.prototype);
  }
}

const BLOCKING_LEND_STATUSES = ['Confirmed', 'Active', 'Overdue'];

export async function revokeLenderRole(): Promise<void> {
  // Pre-check for blocking orders so both platforms trigger deterministic warning modal
  try {
    const lends = await getMyOrders('Lender');
    if (lends.some((order) => BLOCKING_LEND_STATUSES.includes(order.status))) {
      throw new RevokeBlockedError();
    }
  } catch (err) {
    if (err instanceof RevokeBlockedError || (err as any)?.name === 'RevokeBlockedError') {
      throw err;
    }
  }

  if (USE_MOCK) {
    await wait(MOCK_DELAY_MS);
    if (process.env.EXPO_PUBLIC_MOCK_NO_BLOCKERS !== 'true') {
      const lends = await getMyOrders('Lender');
      if (lends.some((order) => BLOCKING_LEND_STATUSES.includes(order.status))) {
        throw new RevokeBlockedError();
      }
    }
    mockDeclineRequestedLendOrders();
    mockIsLender = false;
    return;
  }
  try {
    await http.post('/auth/revoke-lender/');
  } catch (error: any) {
    const data = error?.response?.data;
    const code = typeof data?.code === 'string' ? data.code.toLowerCase() : '';
    const detail = typeof data?.detail === 'string' ? data.detail.toLowerCase() : '';
    const message = extractApiError(error).toLowerCase();

    if (
      error?.response?.status === 409 ||
      code.includes('active') ||
      code.includes('order') ||
      code.includes('unsettled') ||
      detail.includes('active') ||
      detail.includes('order') ||
      detail.includes('confirmed') ||
      message.includes('order') ||
      message.includes('active') ||
      message.includes('confirmed')
    ) {
      throw new RevokeBlockedError();
    }
    throw new Error(extractApiError(error));
  }
}
