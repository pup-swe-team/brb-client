import { extractApiError, http, USE_MOCK } from '../../../services/http';

// OWNER: Lance. CP-801 Notify users of key platform events.
// Sprint 4 scaffold: the CONTRACT below is fixed so Danielo's dashboard panel (CP-202) can call
// getNotifications() today. Lance may extend the service, but keep these four signatures and the
// AppNotification fields unchanged. The mock is mock-first; the real paths are ASSUMPTIONS until
// the backend documents them (see docs/SPRINT_4_COORDINATION.md).

export interface AppNotification {
  id: string;
  type: string;        // e.g. 'order_requested', 'order_confirmed', 'return_due', 'review_received'
  title: string;
  body: string;
  createdAt: string;   // ISO 8601
  read: boolean;
  orderId?: string;    // when set, tapping the item opens OrderDetail
  role?: 'Borrower' | 'Lender';
}

// Module-level so mark-as-read survives navigation in mock mode.
let mockNotifications: AppNotification[] = [
  {
    id: 'n1', type: 'order_confirmed', title: 'Request accepted',
    body: 'Your request for T-Square was accepted. Arrange the handover with the lender.',
    createdAt: '2026-11-07T08:30:00Z', read: false, orderId: 'o2', role: 'Borrower',
  },
  {
    id: 'n2', type: 'return_due', title: 'Return due tomorrow',
    body: 'Lab Apron is due back tomorrow.',
    createdAt: '2026-11-06T09:00:00Z', read: false, orderId: 'o3', role: 'Borrower',
  },
  {
    id: 'n3', type: 'order_completed', title: 'Order completed',
    body: 'Your order for Scientific Calculator was completed.',
    createdAt: '2026-11-04T14:10:00Z', read: true, orderId: 'o5', role: 'Borrower',
  },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function normalize(raw: any): AppNotification {
  return {
    id: String(raw.id),
    type: String(raw.type ?? raw.notification_type ?? 'general'),
    title: String(raw.title ?? ''),
    body: String(raw.body ?? raw.message ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    read: Boolean(raw.read ?? raw.is_read ?? false),
    orderId: (raw.orderId ?? raw.order_id) != null ? String(raw.orderId ?? raw.order_id) : undefined,
    role: raw.role === 'Lender' || raw.role === 'Borrower' ? raw.role : undefined,
  };
}

// Newest first. Pass `limit` for the dashboard's recent-notifications panel.
export async function getNotifications(limit?: number): Promise<AppNotification[]> {
  if (USE_MOCK) {
    await wait(250);
    const sorted = [...mockNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return limit ? sorted.slice(0, limit) : sorted;
  }
  try {
    const { data } = await http.get<any>('/notifications/', { params: limit ? { page_size: limit } : undefined });
    const list = Array.isArray(data) ? data : (data?.results ?? []);
    const items = list.map(normalize) as AppNotification[];
    return limit ? items.slice(0, limit) : items;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function getUnreadCount(): Promise<number> {
  const all = await getNotifications();
  return all.filter((n) => !n.read).length;
}

export async function markAsRead(id: string): Promise<void> {
  if (USE_MOCK) {
    mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    return;
  }
  try {
    await http.post(`/notifications/${id}/read/`);
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function markAllAsRead(): Promise<void> {
  if (USE_MOCK) {
    mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
    return;
  }
  try {
    await http.post('/notifications/read-all/');
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}
