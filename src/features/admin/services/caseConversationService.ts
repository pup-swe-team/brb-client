import { http, USE_MOCK } from '../../../services/http';

export type CaseMessage = {
  id: string;
  sender: 'borrower' | 'lender';
  text: string;
  sentAt: string;
};

const MOCK_MESSAGES: CaseMessage[] = [
  { id: 'm1', sender: 'lender', text: 'Hi! Reminding you that the item is due back on Friday.', sentAt: '2026-11-03T09:10:00Z' },
  { id: 'm2', sender: 'borrower', text: 'Noted, I will return it at the PUP Main Gate after my 1 PM class.', sentAt: '2026-11-03T09:14:00Z' },
  { id: 'm3', sender: 'lender', text: 'Thanks for returning it. I noticed a tear on the left sleeve that was not there before.', sentAt: '2026-11-05T14:02:00Z' },
  { id: 'm4', sender: 'borrower', text: 'It was already like that when I picked it up. I can send the photos from the handover.', sentAt: '2026-11-05T14:20:00Z' },
];

export async function getCaseConversation(caseId: string): Promise<CaseMessage[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_MESSAGES;
  }

  // This endpoint is not in the backend guide yet. Confirm the path and message fields with the backend team.
  const { data } = await http.get<CaseMessage[]>(`/disputes/${caseId}/conversation/`);
  return data;
}