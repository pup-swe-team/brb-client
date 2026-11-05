import { http, USE_MOCK } from '../../../services/http';

// ---------- Types (from the backend guide, section 3.2) ----------
export interface Evidence {
  id: number;
  file: string; // relative path, e.g. "/media/disputes/12/photo1.jpg"
  media_type: 'photo' | 'video';
  created_at: string;
}
// Guide only shows "submitted". TODO: verify the status values after resolve/escalate.
export type CaseStatus = 'submitted' | 'resolved' | 'escalated' | string;
// Guide only shows "refund_approved". TODO: ask backend for the full list of allowed values.
export type Resolution = 'refund_approved' | 'refund_denied' | string;

export interface Party {
  id: number;
  full_name: string;
  email: string;
}
export interface AdminCaseDossier {
  case: {
    id: number;
    case_id: string; // "DISP-1"
    order_id: number;
    type: string;
    status: CaseStatus;
    description: string;
    evidence: Evidence[];
    created_at: string;
    resolution?: Resolution | null; // TODO: verify if the dossier returns these after resolving
    notes?: string | null;
  };
  order: { id: number; status: string; start_date: string; end_date: string; pickup_location: string };
  listing: { id: number; title: string; price_per_day: string };
  borrower: Party;
  lender: Party;
}

export const RESOLUTION_LABELS: Record<string, string> = {
  refund_approved: 'Refund approved',
  refund_denied: 'Refund denied', // TODO: verify this value exists on the backend
};

// Evidence `file` is a relative path, so prefix the server origin (API URL minus /api/v1).
export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = String(http.defaults.baseURL ?? '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return `${base}${path}`;
}

// ---------- Mock (same shape as the real dossier) ----------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mock: AdminCaseDossier = {
  case: {
    id: 1,
    case_id: 'DISP-1',
    order_id: 12,
    type: 'damage_report',
    status: 'submitted',
    description: 'Torn fabric on left sleeve and stain on collar.',
    evidence: [
      { id: 1, file: 'https://picsum.photos/400/300', media_type: 'photo', created_at: '2026-11-04T05:35:00Z' },
      { id: 2, file: 'https://example.com/video1.mp4', media_type: 'video', created_at: '2026-11-04T05:35:00Z' },
    ],
    created_at: '2026-11-04T05:35:00Z',
  },
  order: { id: 12, status: 'disputed', start_date: '2026-11-01', end_date: '2026-11-03', pickup_location: 'Main Campus - CEA' },
  listing: { id: 10, title: 'Snow White Cosplay', price_per_day: '250.00' },
  borrower: { id: 3, full_name: 'Juan Dela Cruz', email: 'jdelacruz@iskolarngbayan.pup.edu.ph' },
  lender: { id: 7, full_name: 'Maria Santos', email: 'msantos@iskolarngbayan.pup.edu.ph' },
};
const clone = () => JSON.parse(JSON.stringify(mock)) as AdminCaseDossier;

// ---------- API (paths assume EXPO_PUBLIC_API_URL ends with /api/v1) ----------
export async function getAdminCase(caseId: string | number): Promise<AdminCaseDossier> {
  if (USE_MOCK) {
    await delay(400);
    return clone();
  }
  const res = await http.get<AdminCaseDossier>(`/disputes/${caseId}/`);
  return res.data;
}

export async function resolveCase(
  caseId: string | number,
  body: { resolution: Resolution; notes: string },
): Promise<AdminCaseDossier> {
  if (USE_MOCK) {
    await delay(400);
    mock.case.status = 'resolved';
    mock.case.resolution = body.resolution;
    mock.case.notes = body.notes;
    return clone();
  }
  await http.post(`/disputes/${caseId}/resolve/`, body);
  return getAdminCase(caseId); // re-fetch so the screen always shows the dossier shape
}

export async function escalateCase(caseId: string | number, body: { notes: string }): Promise<AdminCaseDossier> {
  if (USE_MOCK) {
    await delay(400);
    mock.case.status = 'escalated';
    mock.case.notes = body.notes;
    return clone();
  }
  await http.post(`/disputes/${caseId}/escalate/`, body);
  return getAdminCase(caseId);
}