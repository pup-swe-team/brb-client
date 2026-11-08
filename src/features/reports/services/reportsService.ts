import { extractApiError, http, USE_MOCK } from '../../../services/http';

// OWNER: Lance. CP-901 Report a user, listing, review, or message.
// Sprint 4 scaffold. The real path is an ASSUMPTION until the backend documents it.
// 'message' reports wait for the Chat feature (features/chat is still empty).

export type ReportTargetType = 'user' | 'listing' | 'review' | 'message';

export const REPORT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fraud', label: 'Fraud or misleading' },
  { value: 'prohibited_item', label: 'Prohibited item' },
  { value: 'other', label: 'Other' },
];

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  category: string;
  description: string;
}

export async function submitReport(input: ReportInput): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  try {
    await http.post('/reports/', {
      target_type: input.targetType,
      target_id: input.targetId,
      category: input.category,
      description: input.description.trim(),
    });
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}
