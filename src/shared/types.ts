export type OrderStatus = 'Requested' | 'Confirmed' | 'Active' | 'Overdue' | 'Unreturned' | 'Returned'
  | 'Completed' | 'Disputed' | 'Declined' | 'Expired' | 'Cancelled';
// TODO: confirm exact strings with the backend team.
export interface Order { id: string; listingTitle: string; status: OrderStatus; startDate: string; endDate: string; counterpart: string; }
