import { isAxiosError } from 'axios';
import { Platform } from 'react-native';
import { extractApiError, http, USE_MOCK } from '../../../services/http';
import { Order, OrderLockout, OrderRole, OrderStatus } from '../../../shared/types';

// PATTERN FOR ALL FEATURES: one function per endpoint; mock first, real call behind the same signature.

/* =========================================================
   MOCK DATA (shared). Mirrors the dashboards in the HTML screens.
   Open one with navigation.navigate('OrderDetail', { orderId: 'o2' }).
   o1 Requested (borrower)   o2 Confirmed (borrower)   o3 Active (borrower)
   o4 Overdue (borrower)     o5 Completed (borrower)   o6 Declined (borrower)
   o7 Requested (lender)     o8 Confirmed (lender)     o9 Active (lender)
========================================================= */
let mockOrders: Order[] = [
  { id: 'o1', orderNumber: 'BRB-0142', role: 'Borrower', listingTitle: 'Basic Calculator', status: 'Requested', startDate: '2026-02-02', endDate: '2026-02-05', counterpart: 'Danielo Kim R. Ang', pickupLocation: 'PUP Library Lobby', pricePerDay: 10 },
  { id: 'o2', orderNumber: 'BRB-0158', role: 'Borrower', listingTitle: 'Lab Coat (MEDIUM)', status: 'Confirmed', startDate: '2026-01-28', endDate: '2026-01-31', counterpart: 'Neo Ervine Y. Geroda', pickupLocation: 'PUP Main Gate', pricePerDay: 0 },
  { id: 'o3', orderNumber: 'BRB-0131', role: 'Borrower', listingTitle: 'T-Square', status: 'Active', startDate: '2026-01-27', endDate: '2026-01-30', counterpart: 'Aaron Bien De Guzman', pickupLocation: 'PUP Library Lobby', pricePerDay: 10 },
  { id: 'o4', orderNumber: 'BRB-0119', role: 'Borrower', listingTitle: 'Concepts of Programming Languages', status: 'Overdue', startDate: '2026-01-17', endDate: '2026-01-24', counterpart: 'John Ezekiel Lacap', pickupLocation: 'PUP Main Gate', pricePerDay: 15 },
  { id: 'o5', orderNumber: 'BRB-0139', role: 'Borrower', listingTitle: 'Basic Calculator', status: 'Completed', startDate: '2026-01-06', endDate: '2026-01-10', counterpart: 'Princess Izzy Dancal', pickupLocation: 'PUP Library Lobby', pricePerDay: 10 },
  { id: 'o6', orderNumber: 'BRB-0127', role: 'Borrower', listingTitle: 'T-Square', status: 'Declined', startDate: '2026-01-18', endDate: '2026-01-21', counterpart: 'Felicity Faith Villeta', pickupLocation: 'PUP Library Lobby', pricePerDay: 10 },
  { id: 'o7', orderNumber: 'BRB-0151', role: 'Lender', listingTitle: 'T-Square', status: 'Requested', startDate: '2026-02-02', endDate: '2026-02-05', counterpart: 'Felicity Faith Villeta', pickupLocation: 'PUP Library Lobby', pricePerDay: 10 },
  { id: 'o8', orderNumber: 'BRB-0158', role: 'Lender', listingTitle: 'Lab Coat (MEDIUM)', status: 'Confirmed', startDate: '2026-01-28', endDate: '2026-01-31', counterpart: 'Danielo Kim R. Ang', pickupLocation: 'PUP Main Gate', pricePerDay: 0 },
  { id: 'o9', orderNumber: 'BRB-0146', role: 'Lender', listingTitle: 'Lab Coat (MEDIUM)', status: 'Active', startDate: '2026-01-27', endDate: '2026-01-30', counterpart: 'John Ezekiel Lacap', pickupLocation: 'PUP Main Gate', pricePerDay: 0 },
];

function mockFind(id: string): Order {
  const order = mockOrders.find((o) => o.id === id);
  if (!order) throw new Error('Order not found.');
  return order;
}

function mockSetStatus(id: string, status: Order['status']): Order {
  const next = { ...mockFind(id), status };
  mockOrders = mockOrders.map((o) => (o.id === id ? next : o));
  return next;
}

// Backend status strings -> UI labels (see BACKEND_API_COORDINATION_GUIDE, section 2.1).
// handover_pending is still "Confirmed" for the UI (the handover action is shown);
// return_pending is still "Active" (the return action is shown).
const STATUS_MAP: Record<string, OrderStatus> = {
  requested: 'Requested',
  pending: 'Requested',
  confirmed: 'Confirmed',
  handover_pending: 'Confirmed',
  in_possession: 'Active',
  active: 'Active',
  return_pending: 'Active',
  overdue: 'Overdue',
  unreturned: 'Unreturned',
  returned: 'Returned',
  completed: 'Completed',
  disputed: 'Disputed',
  declined: 'Declined',
  rejected: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
};

export function mapBackendStatus(raw: unknown): OrderStatus {
  const value = typeof raw === 'string' ? raw : (raw as any)?.name;
  if (!value || typeof value !== 'string') return 'Requested';
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return STATUS_MAP[key] ?? 'Requested';
}

// Server message for axios failures, own message for local errors (e.g. a malformed code payload).
function errorMessage(error: unknown): string {
  if (isAxiosError(error)) return extractApiError(error);
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

// Lockout fields shared by GET /orders/{id}/ and GET /codes/verify-*/?order_id=.
export function parseLockout(raw: any): OrderLockout | undefined {
  if (!raw || (raw.is_locked_out === undefined && raw.remaining_lockout_seconds === undefined && raw.locked_until === undefined)) {
    return undefined;
  }
  const remaining = Number(raw.remaining_lockout_seconds ?? raw.remaining_seconds ?? 0);
  const remainingLockoutSeconds = Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : 0;
  return {
    isLockedOut: Boolean(raw.is_locked_out) || remainingLockoutSeconds > 0,
    lockedUntil: typeof raw.locked_until === 'string' ? raw.locked_until : undefined,
    remainingLockoutSeconds,
    failedAttempts: Number(raw.failed_attempts ?? 0) || 0,
  };
}

export function normalizeOrder(raw: any, defaultRole?: OrderRole): Order {
  if (!raw) return raw;
  const id = String(raw.id ?? raw.order_id ?? '');
  const listingId =
    raw.listingId != null
      ? String(raw.listingId)
      : raw.listing_id != null
      ? String(raw.listing_id)
      : raw.listing?.id != null
      ? String(raw.listing.id)
      : undefined;
  const listingTitle = raw.listingTitle || raw.listing_title || raw.listing?.title || 'Listing';
  const status = mapBackendStatus(raw.status);
  const startDate = raw.startDate || raw.start_date || '';
  const endDate = raw.endDate || raw.end_date || '';

  // The backend exposes borrower/lender explicitly (FE-BUG-3002). Never infer one from the other.
  const borrowerName =
    raw.borrower_name || raw.borrower?.full_name || raw.borrower_full_name || '';
  const lenderName =
    raw.lender_name ||
    raw.lender?.full_name ||
    raw.listing?.lender?.full_name ||
    raw.lender_full_name ||
    '';

  // With a known viewer role, always derive the counterpart from the explicit names.
  // `raw.counterpart` is only a fallback because it is relative to whoever made the request.
  let counterpart = '';
  if (defaultRole === 'Borrower') {
    counterpart = lenderName || raw.counterpart || 'Lender';
  } else if (defaultRole === 'Lender') {
    counterpart = borrowerName || raw.counterpart || 'Borrower';
  } else {
    counterpart = raw.counterpart || lenderName || borrowerName || 'Counterpart';
  }

  const role: OrderRole = defaultRole || (raw.role as OrderRole) || 'Borrower';
  const orderNumber = raw.orderNumber || (id ? `BRB-${String(id).padStart(4, '0')}` : undefined);
  const pickupLocation = raw.pickupLocation || raw.pickup_location?.name || raw.pickup_location || raw.listing?.pickup_location?.name || '';
  const rawPrice = raw.pricePerDay ?? raw.price_per_day ?? raw.rate_per_day ?? raw.listing?.rate_per_day ?? raw.listing?.price_per_day;
  const pricePerDay = rawPrice != null ? Number(rawPrice) : undefined;

  return {
    id,
    listingId,
    listingTitle,
    status,
    startDate,
    endDate,
    counterpart,
    role,
    orderNumber,
    pickupLocation: typeof pickupLocation === 'string' ? pickupLocation : '',
    pricePerDay,
    borrowerName: borrowerName || undefined,
    lenderName: lenderName || undefined,
    lockout: parseLockout(raw),
  };
}

// Dashboard payloads group orders in several arrays (active_borrows, pending_requests, ...).
// Collect every order-like object (has an id and a status) and de-duplicate by id.
function collectDashboardOrders(data: any, role: OrderRole): Order[] {
  const byId = new Map<string, Order>();
  const walk = (node: any, depth: number) => {
    if (!node || depth > 3) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === 'object' && item.id != null && item.status != null) {
          const order = normalizeOrder(item, role);
          byId.set(order.id, order);
        }
      }
    } else if (typeof node === 'object') {
      for (const value of Object.values(node)) walk(value, depth + 1);
    }
  };
  walk(data, 0);
  return Array.from(byId.values());
}

async function getDashboardOrders(role: OrderRole): Promise<Order[]> {
  const path = role === 'Borrower' ? '/users/me/borrower-dashboard/' : '/users/me/lender-dashboard/';
  const { data } = await http.get<any>(path);
  return collectDashboardOrders(data, role);
}

/* =========================================================
   SHARED READS (owner: Danielo, CP-201). Do not change signatures.
   The backend now moves orders to Overdue / Expired whenever these endpoints are read
   (FE-BUG-3007), so the UI only reads `status`; no client-side timestamp checks.
========================================================= */

// Max number of active or pending borrow requests a borrower may hold at once.
export const BORROWING_LIMIT = 3;

// All of the signed-in user's orders; pass a role to get only one side.
export async function getMyOrders(role?: OrderRole): Promise<Order[]> {
  if (USE_MOCK) return role ? mockOrders.filter((o) => o.role === role) : mockOrders;
  try {
    const { data } = await http.get<any>('/orders/', { params: role ? { role: role.toLowerCase() } : undefined });
    const list = Array.isArray(data) ? data : (data?.results ?? []);
    if (Array.isArray(list)) {
      return list.map((item) => normalizeOrder(item, role));
    }
  } catch {
    // Fall back to the dashboard endpoints, which also trigger the automatic status updates.
    if (role) return getDashboardOrders(role);
    const [borrowed, lent] = await Promise.all([getDashboardOrders('Borrower'), getDashboardOrders('Lender')]);
    return [...borrowed, ...lent];
  }
  return [];
}

export async function getOrder(orderId: string, role?: OrderRole): Promise<Order> {
  if (USE_MOCK) return mockFind(orderId);
  try {
    const { data } = await http.get<any>(`/orders/${orderId}/`);
    return normalizeOrder(data, role);
  } catch (err: any) {
    if (mockOrders.some((o) => o.id === orderId)) {
      return mockFind(orderId);
    }
    const message = extractApiError(err);
    throw new Error(message);
  }
}

/* =========================================================
   CP-501 Request to borrow a listing (owner: Member B)
========================================================= */

export interface BorrowRequestInput {
  listingId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

// Machine-readable codes returned by POST /orders/ (HTTP 400). Branch on `error.code`.
export type BorrowRequestErrorCode =
  | 'borrowing_limit_reached'
  | 'date_conflict'
  | 'own_listing'
  | 'listing_unavailable'
  | 'unknown';

export class BorrowRequestError extends Error {
  code: BorrowRequestErrorCode;
  conflictingRange?: { startDate: string; endDate: string };

  constructor(
    code: BorrowRequestErrorCode,
    message: string,
    conflictingRange?: { startDate: string; endDate: string },
  ) {
    super(message);
    this.name = 'BorrowRequestError';
    this.code = code;
    this.conflictingRange = conflictingRange;
    Object.setPrototypeOf(this, BorrowRequestError.prototype);
  }
}

const BORROW_ERROR_CODES: BorrowRequestErrorCode[] = [
  'borrowing_limit_reached',
  'date_conflict',
  'own_listing',
  'listing_unavailable',
];

export async function createBorrowRequest(
  input: BorrowRequestInput
): Promise<Order> {
  // Validate listing ID before making an API request.
  const listingId = Number(input.listingId);

  if (!Number.isInteger(listingId) || listingId <= 0) {
    throw new Error('Invalid listing ID. Please try again.');
  }

  // Validate date inputs.
  if (!input.startDate || !input.endDate) {
    throw new Error('Please select your borrowing dates.');
  }

  if (input.startDate > input.endDate) {
    throw new Error('The return date cannot be earlier than the start date.');
  }

  // Mock behavior.
  if (USE_MOCK) {
    const order: Order = {
      id: `o${mockOrders.length + 1}`,
      orderNumber: `BRB-${String(200 + mockOrders.length)}`,
      role: 'Borrower',
      listingTitle: 'Requested listing',
      status: 'Requested',
      startDate: input.startDate,
      endDate: input.endDate,
      counterpart: 'Lender',
      pickupLocation: 'PUP Main Gate',
    };

    mockOrders = [...mockOrders, order];
    return order;
  }

  const payload = {
    listing_id: listingId,
    start_date: input.startDate,
    end_date: input.endDate,
    ...(input.message?.trim()
      ? { notes: input.message.trim() }
      : {}),
  };

  try {
    const { data } = await http.post<any>('/orders/', payload);

    return normalizeOrder(data, 'Borrower');
  } catch (error: any) {
    const response = error?.response?.data ?? {};
    const rawCode = String(response.code ?? '').toLowerCase();
    const detail = extractApiError(error);

    const code: BorrowRequestErrorCode = (BORROW_ERROR_CODES as string[]).includes(rawCode)
      ? (rawCode as BorrowRequestErrorCode)
      : 'unknown';

    const range = response.conflicting_range;
    const conflictingRange =
      range?.start_date && range?.end_date
        ? { startDate: String(range.start_date), endDate: String(range.end_date) }
        : undefined;

    throw new BorrowRequestError(code, detail, conflictingRange);
  }
}

/* =========================================================
   CP-502  Accept or decline a borrow request  (owner: Member B)
========================================================= */

export async function respondToRequest(orderId: string, decision: 'accept' | 'decline'): Promise<Order> {
  if (USE_MOCK) return mockSetStatus(orderId, decision === 'accept' ? 'Confirmed' : 'Declined');
  try {
    const { data } = await http.post<any>(`/orders/${orderId}/${decision}/`);
    return normalizeOrder(data, 'Lender');
  } catch (error: any) {
    const message = extractApiError(error);
    throw new Error(message);
  }
}

/* =========================================================
   CP-503  Cancel a Requested or Confirmed order  (owner: Danielo)
========================================================= */

// Both parties can cancel before pickup. `reason` is required, `details` optional (HTML 41).
export async function cancelOrder(orderId: string, reason: string, details?: string): Promise<Order> {
  if (USE_MOCK) return mockSetStatus(orderId, 'Cancelled');
  const fullReason = details && details.trim() ? `${reason}: ${details.trim()}` : reason;
  try {
    const { data } = await http.post<any>(`/orders/${orderId}/cancel/`, { reason: fullReason });
    return normalizeOrder(data);
  } catch (error: any) {
    const message = extractApiError(error);
    throw new Error(message);
  }
}

/* =========================================================
   CP-504 / CP-505  Handover and return codes  (owner: Member B)
   Lender shows the handover code, Borrower enters it; Borrower shows the return code,
   Lender enters it. Codes are single-use, expire, and lock after repeated wrong tries.
   The SERVER owns the expiry and lockout clocks, so screens always re-read them on mount
   (FE-BUG-3003 / FE-BUG-3004). Nothing important lives only in app memory.

   GET  /orders/{id}/handover-code/            active code + original expiry (never regenerates)
   POST /codes/generate-handover/              issue / renew a code      { order_id }
   GET  /codes/verify-handover/?order_id=      lockout status, no guess sent
   POST /codes/verify-handover/                submit a code             { order_id, code }
   (same four for `return`; verify-return also takes `flagged`)
========================================================= */

export type CodeKind = 'handover' | 'return';

export interface OrderCode {
  code: string;
  expiresAt: string; // ISO timestamp from the server
  remainingSeconds?: number;
  isExpired?: boolean;
}

export type OrderCodeErrorKind = 'incorrect' | 'expired' | 'used' | 'locked';
export class OrderCodeError extends Error {
  kind: OrderCodeErrorKind;
  lockedUntil?: string;
  remainingSeconds?: number;
  failedAttempts?: number;

  constructor(
    kind: OrderCodeErrorKind,
    extra: { lockedUntil?: string; remainingSeconds?: number; failedAttempts?: number; message?: string } = {},
  ) {
    super(extra.message || `Code ${kind}.`);
    this.name = 'OrderCodeError';
    this.kind = kind;
    this.lockedUntil = extra.lockedUntil;
    this.remainingSeconds = extra.remainingSeconds;
    this.failedAttempts = extra.failedAttempts;
    Object.setPrototypeOf(this, OrderCodeError.prototype);
  }
}

export const CODE_LOCKOUT_MAX_ATTEMPTS = 5;
const CODE_LOCKOUT_MOCK_MS = 15 * 60 * 1000;
const MOCK_CODES: Record<CodeKind, string> = { handover: '630528', return: '531846' };
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const orderIdParam = (orderId: string): number | string => {
  const n = Number(orderId);
  return Number.isInteger(n) && n > 0 ? n : orderId;
};

// ---- mock state (only used when EXPO_PUBLIC_USE_MOCK is on) ----
const mockIssuedCodes = new Map<string, OrderCode>();
const mockLockouts = new Map<string, { failed: number; lockedUntil: number | null }>();

function mockLockoutState(kind: CodeKind, orderId: string): OrderLockout {
  const key = `${kind}:${orderId}`;
  const saved = mockLockouts.get(key);
  if (!saved) return { isLockedOut: false, remainingLockoutSeconds: 0, failedAttempts: 0 };
  const remaining = saved.lockedUntil ? Math.max(0, Math.ceil((saved.lockedUntil - Date.now()) / 1000)) : 0;
  if (saved.lockedUntil && remaining === 0) {
    mockLockouts.delete(key);
    return { isLockedOut: false, remainingLockoutSeconds: 0, failedAttempts: 0 };
  }
  return {
    isLockedOut: remaining > 0,
    lockedUntil: saved.lockedUntil ? new Date(saved.lockedUntil).toISOString() : undefined,
    remainingLockoutSeconds: remaining,
    failedAttempts: saved.failed,
  };
}

function mockRegisterFailure(kind: CodeKind, orderId: string): never {
  const key = `${kind}:${orderId}`;
  const failed = (mockLockouts.get(key)?.failed ?? 0) + 1;
  if (failed >= CODE_LOCKOUT_MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + CODE_LOCKOUT_MOCK_MS;
    mockLockouts.set(key, { failed, lockedUntil });
    throw new OrderCodeError('locked', {
      lockedUntil: new Date(lockedUntil).toISOString(),
      remainingSeconds: Math.ceil(CODE_LOCKOUT_MOCK_MS / 1000),
      failedAttempts: failed,
    });
  }
  mockLockouts.set(key, { failed, lockedUntil: null });
  throw new OrderCodeError('incorrect', { failedAttempts: failed });
}

function parseOrderCode(data: any): OrderCode {
  const code = data?.code_value ?? data?.code;
  let expiresAt = data?.expires_at ?? data?.expiresAt;
  const remaining = Number(data?.remaining_seconds);

  if ((!expiresAt || !Number.isFinite(new Date(expiresAt).getTime())) && Number.isFinite(remaining)) {
    expiresAt = new Date(Date.now() + remaining * 1000).toISOString();
  }
  if (!code || !expiresAt || !Number.isFinite(new Date(expiresAt).getTime())) {
    throw new Error('The code API did not return a valid code and expiration timestamp.');
  }
  return {
    code: String(code),
    expiresAt: String(expiresAt),
    remainingSeconds: Number.isFinite(remaining) ? remaining : undefined,
    isExpired: Boolean(data?.is_expired),
  };
}

function isUsable(value: OrderCode | null | undefined): value is OrderCode {
  if (!value || value.isExpired) return false;
  return new Date(value.expiresAt).getTime() > Date.now();
}

// Reads the active code and its ORIGINAL expiry. Never regenerates. Returns null if there is none.
async function fetchActiveCode(kind: CodeKind, orderId: string): Promise<OrderCode | null> {
  if (USE_MOCK) {
    const mock = mockIssuedCodes.get(`${kind}:${orderId}`);
    return isUsable(mock) ? mock : null;
  }
  try {
    const { data } = await http.get<any>(`/orders/${orderId}/${kind}-code/`);
    const parsed = parseOrderCode(data);
    return isUsable(parsed) ? parsed : null;
  } catch (error: any) {
    // 404 / 400 = no active code yet; anything else is a real failure.
    const status = error?.response?.status;
    if (status === 404 || status === 400 || status === 410) return null;
    if (!isAxiosError(error)) return null; // malformed payload: treat as no usable code and regenerate
    throw new Error(extractApiError(error));
  }
}

// Issues a NEW code (or renews an expired one) and a fresh expiry.
async function issueCode(kind: CodeKind, orderId: string): Promise<OrderCode> {
  if (USE_MOCK) {
    const result: OrderCode = {
      code: MOCK_CODES[kind],
      expiresAt: new Date(Date.now() + THREE_HOURS_MS).toISOString(),
    };
    mockIssuedCodes.set(`${kind}:${orderId}`, result);
    return result;
  }
  try {
    const { data } = await http.post<any>(`/codes/generate-${kind}/`, { order_id: orderIdParam(orderId) });
    return parseOrderCode(data);
  } catch (error: any) {
    throw new Error(errorMessage(error));
  }
}

async function getOrIssueCode(kind: CodeKind, orderId: string): Promise<OrderCode> {
  const active = await fetchActiveCode(kind, orderId);
  if (active) return active;
  return issueCode(kind, orderId);
}

// Lockout status without sending a guess.
export async function getCodeLockout(kind: CodeKind, orderId: string): Promise<OrderLockout> {
  if (USE_MOCK) return mockLockoutState(kind, orderId);
  const { data } = await http.get<any>(`/codes/verify-${kind}/`, { params: { order_id: orderIdParam(orderId) } });
  return (
    parseLockout(data) ?? { isLockedOut: false, remainingLockoutSeconds: 0, failedAttempts: 0 }
  );
}

// Maps a failed verify request to an OrderCodeError (or a plain Error with the server message).
function toCodeError(error: any): Error {
  const data = error?.response?.data ?? {};
  const status = error?.response?.status;
  const serverCode = typeof data.code === 'string' ? data.code.toLowerCase() : '';
  const detail = typeof data.detail === 'string' ? data.detail.toLowerCase() : '';
  const failedAttempts = data.failed_attempts != null ? Number(data.failed_attempts) : undefined;

  if (status === 429 || serverCode === 'lockout_active' || detail.includes('locked')) {
    const remaining = Number(data.remaining_seconds ?? data.remaining_lockout_seconds);
    return new OrderCodeError('locked', {
      lockedUntil: typeof data.locked_until === 'string' ? data.locked_until : undefined,
      remainingSeconds: Number.isFinite(remaining) ? remaining : undefined,
      failedAttempts,
    });
  }
  if (serverCode === 'invalid_code' || detail.includes('invalid') || detail.includes('incorrect')) {
    return new OrderCodeError('incorrect', { failedAttempts });
  }
  if (serverCode === 'code_expired' || detail.includes('expire')) {
    return new OrderCodeError('expired');
  }
  if (serverCode === 'code_used' || detail.includes('already been used') || detail.includes('used')) {
    return new OrderCodeError('used');
  }
  return new Error(extractApiError(error));
}

/* ---------- CP-504 handover ---------- */

// Used by the Lender "show code" screen: reuses the active code, generates only when none/expired.
export async function getOrGenerateHandoverCode(orderId: string): Promise<OrderCode> {
  return getOrIssueCode('handover', orderId);
}

// "Request New Code" button.
export async function generateHandoverCode(orderId: string): Promise<OrderCode> {
  return issueCode('handover', orderId);
}

// Kept so existing imports keep compiling; the server is now the source of truth.
export function clearHandoverCodeCache(orderId: string): void {
  mockIssuedCodes.delete(`handover:${orderId}`);
}

export function getHandoverLockout(orderId: string): Promise<OrderLockout> {
  return getCodeLockout('handover', orderId);
}

// Throws OrderCodeError. On success the order becomes Active.
export async function confirmHandover(orderId: string, code: string): Promise<Order> {
  if (USE_MOCK) {
    if (mockLockoutState('handover', orderId).isLockedOut) {
      const l = mockLockoutState('handover', orderId);
      throw new OrderCodeError('locked', { lockedUntil: l.lockedUntil, remainingSeconds: l.remainingLockoutSeconds });
    }
    if (code !== MOCK_CODES.handover) mockRegisterFailure('handover', orderId);
    mockLockouts.delete(`handover:${orderId}`);
    clearHandoverCodeCache(orderId);
    return mockSetStatus(orderId, 'Active');
  }
  try {
    const { data } = await http.post<any>('/codes/verify-handover/', { order_id: orderIdParam(orderId), code });
    return normalizeOrder(data, 'Borrower');
  } catch (error: any) {
    throw toCodeError(error);
  }
}

/* ---------- CP-505 return ---------- */
// `damaged` sends flagged:true; the order becomes Disputed and stays that way until an admin
// resolves it. This is intentional (it blocks "Completed" while a damage claim is open).

export async function getOrGenerateReturnCode(orderId: string): Promise<OrderCode> {
  return getOrIssueCode('return', orderId);
}

export async function generateReturnCode(orderId: string): Promise<OrderCode> {
  return issueCode('return', orderId);
}

export function getReturnLockout(orderId: string): Promise<OrderLockout> {
  return getCodeLockout('return', orderId);
}

export async function confirmReturn(
  orderId: string,
  code: string,
  options: { damaged: boolean; description?: string }
): Promise<Order> {
  if (USE_MOCK) {
    const l = mockLockoutState('return', orderId);
    if (l.isLockedOut) {
      throw new OrderCodeError('locked', { lockedUntil: l.lockedUntil, remainingSeconds: l.remainingLockoutSeconds });
    }
    if (code !== MOCK_CODES.return) mockRegisterFailure('return', orderId);
    mockLockouts.delete(`return:${orderId}`);
    mockIssuedCodes.delete(`return:${orderId}`);
    return mockSetStatus(orderId, options.damaged ? 'Disputed' : 'Completed');
  }
  try {
    const { data } = await http.post<any>('/codes/verify-return/', {
      order_id: orderIdParam(orderId),
      code,
      flagged: options.damaged,
    });
    return normalizeOrder(data, 'Lender');
  } catch (error: any) {
    throw toCodeError(error);
  }
}

/* =========================================================
   Damage report with photo/video evidence (FE-BUG-3005 part 2)
   POST /orders/{id}/damage-report/  multipart: description + evidence (repeatable)
========================================================= */

export interface DamageEvidenceFile {
  uri: string;
  kind: 'photo' | 'video';
  fileName?: string | null;
  mimeType?: string | null;
  file?: File; // web only: the picker's real File when available
}

export interface DamageReportResult {
  id: number | string;
  status: string;
}

async function appendEvidence(form: FormData, item: DamageEvidenceFile): Promise<void> {
  const fallbackName = item.kind === 'photo' ? 'photo.jpg' : 'video.mp4';
  const name = item.fileName || fallbackName;
  const type = item.mimeType || (item.kind === 'photo' ? 'image/jpeg' : 'video/mp4');

  if (Platform.OS === 'web') {
    if (item.file) {
      form.append('evidence', item.file);
      return;
    }
    const res = await fetch(item.uri);
    const blob = await res.blob();
    form.append('evidence', new File([blob], name, { type: blob.type || type }));
    return;
  }
  form.append('evidence', { uri: item.uri, name, type } as any);
}

export async function submitDamageReport(
  orderId: string,
  description: string,
  files: DamageEvidenceFile[],
): Promise<DamageReportResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    mockSetStatus(orderId, 'Disputed');
    return { id: 1, status: 'submitted' };
  }
  try {
    const form = new FormData();
    form.append('description', description.trim());
    for (const item of files) await appendEvidence(form, item);
    // Content-Type is left unset so each platform adds the multipart boundary.
    const { data } = await http.post<any>(`/orders/${orderId}/damage-report/`, form, { timeout: 120000 });
    return { id: data?.id, status: String(data?.status ?? 'submitted') };
  } catch (error: any) {
    throw new Error(errorMessage(error));
  }
}
