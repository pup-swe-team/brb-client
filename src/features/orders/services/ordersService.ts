import { http, USE_MOCK } from '../../../services/http';
import { Order, OrderRole } from '../../../shared/types';

// PATTERN FOR ALL FEATURES: one function per endpoint; mock first, real call behind the same signature.
//
// SPRINT 3 CONTRACT. Every ticket below has its function(s) declared here with a
// working mock, so screens can be built before the backend exists. Edit ONLY the
// function(s) marked with your ticket. Never change another ticket's signature
// without telling its owner. All real endpoints are unconfirmed (TODO).

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

/* =========================================================
   SHARED READS (owner: Danielo, CP-201). Do not change signatures.
========================================================= */

// All of the signed-in user's orders; pass a role to get only one side.
export async function getMyOrders(role?: OrderRole): Promise<Order[]> {
  if (USE_MOCK) return role ? mockOrders.filter((o) => o.role === role) : mockOrders;
  const { data } = await http.get<Order[]>('/orders/', { params: role ? { role } : undefined }); // TODO: confirm endpoint
  return data;
}

export async function getOrder(orderId: string): Promise<Order> {
  if (USE_MOCK) return mockFind(orderId);
  const { data } = await http.get<Order>(`/orders/${orderId}/`); // TODO: confirm endpoint
  return data;
}


/* =========================================================
   CP-501  Request to borrow a listing        (owner: Member B)
========================================================= */

export interface BorrowRequestInput {
  listingId: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  message?: string;
}

// Rejections the UI must show (HTML 42/43/44): dates unavailable, borrowing
// limit reached, your own listing. Throw an Error whose message is user-ready.
export async function createBorrowRequest(input: BorrowRequestInput): Promise<Order> {
  if (USE_MOCK) {
    const order: Order = {
      id: `o${mockOrders.length + 1}`, orderNumber: `BRB-${String(200 + mockOrders.length)}`, role: 'Borrower',
      listingTitle: 'Requested listing', status: 'Requested', startDate: input.startDate, endDate: input.endDate,
      counterpart: 'Lender', pickupLocation: 'PUP Main Gate',
    };
    mockOrders = [...mockOrders, order];
    return order;
  }
  const { data } = await http.post<Order>('/orders/', input); // TODO: confirm endpoint
  return data;
}


/* =========================================================
   CP-502  Accept or decline a borrow request  (owner: Member B)
========================================================= */

export async function respondToRequest(orderId: string, decision: 'accept' | 'decline'): Promise<Order> {
  if (USE_MOCK) return mockSetStatus(orderId, decision === 'accept' ? 'Confirmed' : 'Declined');
  const { data } = await http.post<Order>(`/orders/${orderId}/respond/`, { decision }); // TODO: confirm endpoint
  return data;
}


/* =========================================================
   CP-503  Cancel a Requested or Confirmed order  (owner: Danielo)
========================================================= */

// Both parties can cancel before pickup. `reason` is required, `details` optional (HTML 41).
export async function cancelOrder(orderId: string, reason: string, details?: string): Promise<Order> {
  if (USE_MOCK) return mockSetStatus(orderId, 'Cancelled');
  const { data } = await http.post<Order>(`/orders/${orderId}/cancel/`, { reason, details }); // TODO: confirm endpoint
  return data;
}


/* =========================================================
   CP-504  Generate and validate handover code  (owner: Member B)
   Lender shows the code, Borrower enters it. Codes are single-use, expire after 3 hours,
   and lock after repeated wrong tries (HTML 26/27/28/38).
========================================================= */

export interface OrderCode { code: string; expiresAt: string } // ISO timestamp

export type OrderCodeErrorKind = 'incorrect' | 'expired' | 'used' | 'locked';
export class OrderCodeError extends Error {
  kind: OrderCodeErrorKind;
  constructor(kind: OrderCodeErrorKind) {
    super(`Code ${kind}.`);
    this.name = 'OrderCodeError';
    this.kind = kind;
    Object.setPrototypeOf(this, OrderCodeError.prototype);
  }
}

const MOCK_CODE = '630528';
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export async function generateHandoverCode(orderId: string): Promise<OrderCode> {
  if (USE_MOCK) return { code: MOCK_CODE, expiresAt: new Date(Date.now() + THREE_HOURS_MS).toISOString() };
  const { data } = await http.post<OrderCode>(`/orders/${orderId}/handover-code/`); // TODO: confirm endpoint
  return data;
}

// Throws OrderCodeError. On success the order becomes Active.
export async function confirmHandover(orderId: string, code: string): Promise<Order> {
  if (USE_MOCK) {
    if (code !== MOCK_CODE) throw new OrderCodeError('incorrect');
    return mockSetStatus(orderId, 'Active');
  }
  const { data } = await http.post<Order>(`/orders/${orderId}/handover-confirm/`, { code }); // TODO: confirm endpoint
  return data;
}


/* =========================================================
   CP-505  Generate and validate return code  (owner: Member B)
   Borrower shows the code, Lender enters it. `damaged` turns on the damage flag:
   the order becomes Disputed and the lender continues to the report form (HTML 40/63).
========================================================= */

export async function generateReturnCode(orderId: string): Promise<OrderCode> {
  if (USE_MOCK) return { code: '531846', expiresAt: new Date(Date.now() + THREE_HOURS_MS).toISOString() };
  const { data } = await http.post<OrderCode>(`/orders/${orderId}/return-code/`); // TODO: confirm endpoint
  return data;
}

export async function confirmReturn(orderId: string, code: string, options: { damaged: boolean }): Promise<Order> {
  if (USE_MOCK) {
    if (code !== '531846') throw new OrderCodeError('incorrect');
    return mockSetStatus(orderId, options.damaged ? 'Disputed' : 'Completed');
  }
  const { data } = await http.post<Order>(`/orders/${orderId}/return-confirm/`, { code, damaged: options.damaged }); // TODO: confirm endpoint
  return data;
}
