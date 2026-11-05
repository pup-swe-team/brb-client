export type OrderStatus = 'Requested' | 'Confirmed' | 'Active' | 'Overdue' | 'Unreturned' | 'Returned'
  | 'Completed' | 'Disputed' | 'Declined' | 'Expired' | 'Cancelled';
// Backend strings (requested, confirmed, handover_pending, in_possession, return_pending, overdue,
// disputed, completed, cancelled, expired) are mapped to these labels in ordersService.mapBackendStatus.
export type OrderRole = 'Borrower' | 'Lender';

// Server-side code lockout state (GET /orders/{id}/ and GET /codes/verify-*/?order_id=).
export interface OrderLockout {
  isLockedOut: boolean;
  lockedUntil?: string;          // ISO 8601 UTC
  remainingLockoutSeconds: number;
  failedAttempts: number;
}

export interface Order {
  id: string; listingTitle: string; status: OrderStatus; startDate: string; endDate: string; counterpart: string;
  // Sprint 3 additions. Optional, so Sprint 1/2 code keeps compiling.
  role?: OrderRole;        // which side of the order the signed-in user is on
  orderNumber?: string;    // e.g. "BRB-0142"
  pickupLocation?: string;
  pricePerDay?: number;    // PHP, 0 = FREE (payment happens outside the app)
  listingId?: string;
  // Explicit identities from the backend so Borrower/Lender are never swapped (FE-BUG-3002).
  borrowerName?: string;
  lenderName?: string;
  lockout?: OrderLockout;
}
