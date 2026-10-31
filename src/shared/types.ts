export type OrderStatus = 'Requested' | 'Confirmed' | 'Active' | 'Overdue' | 'Unreturned' | 'Returned'
  | 'Completed' | 'Disputed' | 'Declined' | 'Expired' | 'Cancelled';
// TODO: confirm exact strings with the backend team.
export type OrderRole = 'Borrower' | 'Lender';

export interface Order {
  id: string; listingTitle: string; status: OrderStatus; startDate: string; endDate: string; counterpart: string;
  // Sprint 3 additions. Optional, so Sprint 1/2 code keeps compiling.
  role?: OrderRole;        // which side of the order the signed-in user is on
  orderNumber?: string;    // e.g. "BRB-0142"
  pickupLocation?: string;
  pricePerDay?: number;    // PHP, 0 = FREE (payment happens outside the app)
  listingId?: string;
}
