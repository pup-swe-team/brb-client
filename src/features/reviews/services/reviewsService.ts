
import { extractApiError, http, USE_MOCK } from '../../../services/http';

// OWNER: Izzy. CP-601 Rate and review counterparty after order completion.
// API paths remain assumptions until confirmed by the backend.

export interface ReviewInput {
  orderId: string;
  rating: number;
  comment: string;
}

export interface SubmittedReview {
  id: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Keeps mock reviews available while navigating between screens.
const mockReviews = new Map<string, SubmittedReview>();

export async function getOrderReview(
  orderId: string
): Promise<SubmittedReview | null> {
  if (USE_MOCK) {
    return mockReviews.get(orderId) ?? null;
  }

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
    if (error?.response?.status === 404) {
      return null;
    }

    throw new Error(extractApiError(error));
  }
}

export async function submitReview(
  input: ReviewInput
): Promise<SubmittedReview> {
  const trimmedComment = input.comment.trim();

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('Please select a rating from 1 to 5 stars.');
  }

  if (!trimmedComment) {
    throw new Error('Please enter a review comment.');
  }

  if (USE_MOCK) {
    // Prevent duplicate reviews for the same order.
    if (mockReviews.has(input.orderId)) {
      throw new Error('You have already reviewed this order.');
    }

    const review: SubmittedReview = {
      id: `r${mockReviews.size + 1}`,
      orderId: input.orderId,
      rating: input.rating,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    };

    // Save immediately so repeated submissions cannot create duplicates.
    mockReviews.set(input.orderId, review);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return review;
  }

  try {
    const { data } = await http.post<any>('/reviews/', {
      order_id: Number(input.orderId) || input.orderId,
      rating: input.rating,
      comment: trimmedComment,
    });

    return {
      id: String(data?.id ?? ''),
      orderId: input.orderId,
      rating: Number(data?.rating ?? input.rating),
      comment: String(data?.comment ?? trimmedComment),
      createdAt: String(data?.created_at ?? new Date().toISOString()),
    };
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}
