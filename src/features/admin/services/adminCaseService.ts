import { extractApiError, http, USE_MOCK } from '../../../services/http';
import { MOCK_ADMIN_CASES } from './mockAdminCases';
import { AdminCase, AdminCaseAction, CaseEvent, CaseResolution } from './adminCaseTypes';

export * from './adminCaseTypes';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// In-memory copy so actions in mock mode persist while the app is open.
const store: Record<string, AdminCase> = JSON.parse(JSON.stringify(MOCK_ADMIN_CASES));

const todayIso = () => new Date().toISOString().slice(0, 10);

const NEXT: Record<AdminCaseAction, { resolution: CaseResolution; event: string }> = {
  sendReminder: { resolution: 'Reminder sent', event: 'Reminder sent to borrower' },
  escalate: { resolution: 'Escalated', event: 'Case escalated for follow-up' },
  markReturned: { resolution: 'Resolved', event: 'Marked returned by admin' },
};

export async function getAdminCase(caseId: string): Promise<AdminCase> {
  if (USE_MOCK) {
    await delay(400);
    const c = store[caseId] || store['c1'];
    if (!c) throw new Error('Case not found');
    return { ...c, events: [...c.events] };
  }
  try {
    const { data } = await http.get<any>(`/unreturned-cases/${caseId}/`);
    const c = data.case || data;
    const order = data.order || {};
    const listing = data.listing || {};
    const borrower = data.borrower || {};
    const lender = data.lender || {};

    let daysLate = 0;
    if (order.end_date) {
      const diffMs = Date.now() - new Date(order.end_date).getTime();
      daysLate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const events: CaseEvent[] = [];
    if (c.created_at) {
      events.push({ id: 'e1', label: 'Case opened by system', date: c.created_at.slice(0, 10) });
    }
    if (c.escalated_at) {
      events.push({ id: 'e2', label: 'Escalated to OSS / Campus Security', date: c.escalated_at.slice(0, 10) });
    }
    if (c.resolution_notes) {
      events.push({ id: 'e3', label: `Resolution: ${c.resolution_notes}`, date: (c.updated_at || c.created_at || '').slice(0, 10) });
    }

    let resolution: CaseResolution = 'Open';
    const caseStatus = (c.status?.name || c.status || '').toLowerCase();
    if (caseStatus === 'escalated') resolution = 'Escalated';
    else if (caseStatus === 'returned' || caseStatus === 'unresolved') resolution = 'Resolved';

    return {
      id: String(c.id),
      orderId: String(order.id || c.order_id || ''),
      itemTitle: listing.title || 'Item',
      borrowerName: borrower.full_name || 'Borrower',
      lenderName: lender.full_name || 'Lender',
      status: order.status === 'overdue' ? 'Overdue' : 'Unreturned',
      resolution,
      dueDate: order.end_date || '',
      daysLate,
      depositPhp: 0,
      events: events.length > 0 ? events : [{ id: 'e1', label: 'Case opened', date: todayIso() }],
    };
  } catch (err: any) {
    if (store[caseId]) {
      return { ...store[caseId], events: [...store[caseId].events] };
    }
    const message = extractApiError(err);
    throw new Error(message);
  }
}

export async function applyAdminCaseAction(caseId: string, action: AdminCaseAction): Promise<AdminCase> {
  if (USE_MOCK) {
    await delay(400);
    const c = store[caseId] || store['c1'];
    if (!c) throw new Error('Case not found');
    const next = NEXT[action];
    c.resolution = next.resolution;
    c.events = [...c.events, { id: `e${Date.now()}`, label: next.event, date: todayIso() }];
    return { ...c, events: [...c.events] };
  }
  try {
    if (action === 'escalate') {
      await http.post(`/unreturned-cases/${caseId}/escalate/`, {
        resolution_notes: 'Escalated for administrative follow-up',
      });
    } else if (action === 'markReturned') {
      await http.post(`/unreturned-cases/${caseId}/close/`, {
        status: 'returned',
        resolution_notes: 'Marked returned by admin',
      });
    }
    return await getAdminCase(caseId);
  } catch (err: any) {
    if (store[caseId]) {
      const c = store[caseId];
      const next = NEXT[action];
      c.resolution = next.resolution;
      c.events = [...c.events, { id: `e${Date.now()}`, label: next.event, date: todayIso() }];
      return { ...c, events: [...c.events] };
    }
    const message = extractApiError(err);
    throw new Error(message);
  }
}
