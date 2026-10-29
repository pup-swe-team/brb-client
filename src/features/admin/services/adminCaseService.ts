import { MOCK_ADMIN_CASES } from './mockAdminCases';
import { AdminCase, AdminCaseAction, CaseResolution } from './adminCaseTypes';

export * from './adminCaseTypes';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
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
    const c = store[caseId];
    if (!c) throw new Error('Case not found');
    return { ...c, events: [...c.events] };
  }
  // TODO: real endpoint once the backend confirms it, e.g. http.get(`/admin/cases/${caseId}`)
  throw new Error('Admin case endpoint not connected yet. Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}

export async function applyAdminCaseAction(caseId: string, action: AdminCaseAction): Promise<AdminCase> {
  if (USE_MOCK) {
    await delay(400);
    const c = store[caseId];
    if (!c) throw new Error('Case not found');
    const next = NEXT[action];
    c.resolution = next.resolution;
    c.events = [...c.events, { id: `e${Date.now()}`, label: next.event, date: todayIso() }];
    return { ...c, events: [...c.events] };
  }
  // TODO: real endpoint once the backend confirms it, e.g. http.post(`/admin/cases/${caseId}/actions`, { action })
  throw new Error('Admin case endpoint not connected yet. Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}