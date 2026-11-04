import { http, USE_MOCK } from '../../../services/http';

// ---------- Types (TODO: verify every field against the backend guide) ----------
export type EvidenceType = 'photo' | 'video';
export interface Evidence {
  id: string;
  type: EvidenceType; // TODO: verify field name/values
  url: string;
}
export type CaseStatus = 'open' | 'resolved' | 'escalated'; // TODO: verify
export type Resolution = 'favor_lender' | 'favor_borrower' | 'partial'; // TODO: verify allowed values

export interface Party {
  id: string;
  full_name: string;
}
export interface AdminCaseDossier {
  case: {
    id: string;
    status: CaseStatus;
    description: string;
    evidence: Evidence[];
    resolution?: Resolution | null;
    notes?: string | null;
    created_at: string;
  };
  order: { id: string; start_date: string; end_date: string };
  listing: { id: string; title: string };
  borrower: Party;
  lender: Party;
}

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  favor_lender: 'In favor of lender',
  favor_borrower: 'In favor of borrower',
  partial: 'Partial / split',
};

// ---------- Mock (same shape as the real dossier) ----------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mock: AdminCaseDossier = {
  case: {
    id: 'c1',
    status: 'open',
    description: 'Screen has a crack across the top-right corner after return.',
    evidence: [
      { id: 'e1', type: 'photo', url: 'https://picsum.photos/400/300' },
      { id: 'e2', type: 'video', url: 'https://example.com/evidence.mp4' },
    ],
    resolution: null,
    notes: null,
    created_at: '2026-01-24',
  },
  order: { id: 'o1', start_date: '2026-01-17', end_date: '2026-01-24' },
  listing: { id: 'l1', title: 'Concepts of Programming Languages' },
  borrower: { id: 'u1', full_name: 'Felicity Faith Villeta' },
  lender: { id: 'u2', full_name: 'Anthea Lyn Czeisler Espiritu' },
};

// ---------- API ----------
// TODO: verify paths (assuming DRF-style trailing slashes like /auth/login/)
export async function getAdminCase(caseId: string): Promise<AdminCaseDossier> {
  if (USE_MOCK) {
    await delay(400);
    return JSON.parse(JSON.stringify(mock));
  }
  const res = await http.get<AdminCaseDossier>(`/admin/disputes/${caseId}/`);
  return res.data;
}

export async function resolveCase(
  caseId: string,
  body: { resolution: Resolution; notes: string },
): Promise<AdminCaseDossier> {
  if (USE_MOCK) {
    await delay(400);
    mock.case.status = 'resolved';
    mock.case.resolution = body.resolution;
    mock.case.notes = body.notes;
    return JSON.parse(JSON.stringify(mock));
  }
  await http.post(`/admin/disputes/${caseId}/resolve/`, body);
  return getAdminCase(caseId); // re-fetch in case the response isn't the dossier
}

export async function escalateCase(caseId: string, body: { notes: string }): Promise<AdminCaseDossier> {
  if (USE_MOCK) {
    await delay(400);
    mock.case.status = 'escalated';
    mock.case.notes = body.notes;
    return JSON.parse(JSON.stringify(mock));
  }
  await http.post(`/admin/disputes/${caseId}/escalate/`, body);
  return getAdminCase(caseId);
}