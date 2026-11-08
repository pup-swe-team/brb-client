import { extractApiError, http, USE_MOCK } from '../../../services/http';

// OWNER: Izzy. CP-601 Rate and review counterparty after order completion.
// Sprint 4 scaffold. Real paths are ASSUMPTIONS until the backend documents them.
// Existing review display types live in features/profile/services/lenderTypes.ts (LenderReview).

export interface ReviewInput {
  orderId: string;
  rating: number;   // 1-5
  comment: string;
}

export interface SubmittedReview {
  id: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Module-level so the mock "already reviewed" state survives navigation.
const mockReviews = new Map<string, SubmittedReview>();

// Null when this order has not been reviewed yet (the review form is then offered).
export async function getOrderReview(orderId: string): Promise<SubmittedReview | null> {
  if (USE_MOCK) return mockReviews.get(orderId) ?? null;
  try {
    const { data } = await http.get<any>(`/orders/${orderId}/review/`);
    return data?.id
      ? {
          id: String(data.id),
          orderId,
          rating: Number(data.rating),
          comment: String(data.comment ?? ''),
          createdAt: String(data.created_at ?? ''),
        }
      : null;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw new Error(extractApiError(error));
  }
}

export async function submitReview(input: ReviewInput): Promise<SubmittedReview> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const review: SubmittedReview = {
      id: `r${mockReviews.size + 1}`,
      orderId: input.orderId,
      rating: input.rating,
      comment: input.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    mockReviews.set(input.orderId, review);
    return review;
  }
  try {
    const { data } = await http.post<any>('/reviews/', {
      order_id: Number(input.orderId) || input.orderId,
      rating: input.rating,
      comment: input.comment.trim(),
    });
    return {
      id: String(data?.id ?? ''),
      orderId: input.orderId,
      rating: Number(data?.rating ?? input.rating),
      comment: String(data?.comment ?? input.comment),
      createdAt: String(data?.created_at ?? new Date().toISOString()),
    };
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}
