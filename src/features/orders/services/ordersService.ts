import { http, USE_MOCK } from '../../../services/http';
import { Order } from '../../../shared/types';

// PATTERN FOR ALL FEATURES: one function per endpoint; mock first, real call behind the same signature.
const MOCK: Order[] = [
  { id: '1', listingTitle: 'Sample Textbook', status: 'Requested', startDate: '2026-01-20', endDate: '2026-01-27', counterpart: 'Sample Lender' },
  { id: '2', listingTitle: 'Sample Lab Coat', status: 'Active', startDate: '2026-01-10', endDate: '2026-01-30', counterpart: 'Sample Lender' },
];
export async function getMyOrders(): Promise<Order[]> {
  if (USE_MOCK) return MOCK;
  const { data } = await http.get<Order[]>('/orders/'); // TODO: confirm endpoint
  return data;
}
