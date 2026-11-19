
import { extractApiError, http, USE_MOCK } from '../../../services/http';
import { LenderReview } from '../../profile/services/lenderTypes';
import { getMyOrders } from '../../orders/services/ordersService';

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
  reviewerName?: string;
  itemTitle?: string;
}

// Keeps mock reviews available while navigating between screens.
const mockReviews = new Map<string, SubmittedReview>();

const mockBorrowerReviews: LenderReview[] = [
  {
    id: 'br-1',
    reviewerName: 'Princess Izzy Dancal',
    reviewerVerified: true,
    rating: 5,
    comment: 'Great borrower! Handled the calculator carefully and returned it right on time.',
    itemTitle: 'Basic Calculator',
    date: '2026-11-05',
  },
  {
    id: 'br-2',
    reviewerName: 'Aaron Bien De Guzman',
    reviewerVerified: true,
    rating: 5,
    comment: 'Punctual and very easy to communicate with during pickup and return.',
    itemTitle: 'T-Square',
    date: '2026-11-01',
  },
];

async function getReviewsFromCompletedOrders(
  role: 'Borrower' | 'Lender',
  userId?: string
): Promise<LenderReview[]> {
  try {
    const orders = await getMyOrders(role);
    const completed = orders.filter(
      (o) => o.status === 'Completed' || o.status === 'Returned'
    );
    if (completed.length === 0) return [];

    const reviews: LenderReview[] = [];
    for (const order of completed) {
      // 1. Check if the order payload already has embedded review data
      const embedded = (order as any).review || (order as any).reviews?.[0];
      if (embedded && embedded.rating != null) {
        reviews.push({
          id: String(embedded.id || `order-${order.id}`),
          reviewerName:
            embedded.reviewer?.full_name ||
            embedded.reviewer_name ||
            (role === 'Borrower'
              ? order.lenderName || order.counterpart || 'Lender'
              : order.borrowerName || order.counterpart || 'Borrower'),
          reviewerVerified: Boolean(embedded.reviewer?.is_verified ?? true),
          rating: Number(embedded.rating || 5),
          comment: String(embedded.comment || ''),
          itemTitle: order.listingTitle || 'Borrowed Item',
          date: String(embedded.created_at || order.endDate || '').slice(0, 10),
        });
        continue;
      }

      // 2. Fetch the review via GET /orders/{id}/review/
      try {
        const orderReview = await getOrderReview(order.id);
        if (orderReview) {
          reviews.push({
            id: String(orderReview.id || `order-${order.id}`),
            reviewerName:
              orderReview.reviewerName ||
              (role === 'Borrower'
                ? order.lenderName || order.counterpart || 'Lender'
                : order.borrowerName || order.counterpart || 'Borrower'),
            reviewerVerified: true,
            rating: Number(orderReview.rating || 5),
            comment: String(orderReview.comment || ''),
            itemTitle: order.listingTitle || orderReview.itemTitle || 'Borrowed Item',
            date: String(orderReview.createdAt || order.endDate || '').slice(0, 10),
          });
        }
      } catch {
        // Individual order failure is non-fatal
      }
    }
    return reviews;
  } catch {
    return [];
  }
}

export async function getReceivedReviews(
  role: 'Borrower' | 'Lender' = 'Borrower',
  userId?: string
): Promise<LenderReview[]> {
  if (USE_MOCK) {
    const orderReviews = await getReviewsFromCompletedOrders(role, userId);
    if (orderReviews.length > 0) {
      return [...orderReviews, ...mockBorrowerReviews];
    }
    return role === 'Borrower' ? mockBorrowerReviews : [];
  }

  // 1. Try GET /reviews/ with target_user and role query parameters
  try {
    const { data } = await http.get<any>('/reviews/', {
      params: { target_user: userId, role: role.toLowerCase() },
    });
    const list = Array.isArray(data) ? data : (data?.results ?? []);
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any) => ({
        id: String(item.id),
        reviewerName: item.reviewer?.full_name || item.reviewer_name || (role === 'Borrower' ? 'Lender' : 'Borrower'),
        reviewerVerified: Boolean(item.reviewer?.is_verified ?? true),
        rating: Number(item.rating || 5),
        comment: String(item.comment || ''),
        itemTitle: item.order?.listing_title || item.listing_title || item.item_title || 'Borrowed Item',
        date: String(item.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      }));
    }
  } catch {
    // Continue to dashboard and order review fallbacks
  }

  // 2. Try dashboard endpoint (/users/me/borrower-dashboard/ or /users/me/lender-dashboard/)
  try {
    const dashPath = role === 'Borrower' ? '/users/me/borrower-dashboard/' : '/users/me/lender-dashboard/';
    const { data } = await http.get<any>(dashPath);
    const rawList = data?.reviews || data?.reviews_received || data?.received_reviews;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((item: any) => ({
        id: String(item.id),
        reviewerName: item.reviewer?.full_name || item.reviewer_name || (role === 'Borrower' ? 'Lender' : 'Borrower'),
        reviewerVerified: Boolean(item.reviewer?.is_verified ?? true),
        rating: Number(item.rating || 5),
        comment: String(item.comment || ''),
        itemTitle: item.order?.listing_title || item.listing_title || item.item_title || 'Borrowed Item',
        date: String(item.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      }));
    }
  } catch {
    // Continue to completed orders fallback
  }

  // 3. Fallback: Query reviews from completed orders via GET /orders/{id}/review/
  const completedReviews = await getReviewsFromCompletedOrders(role, userId);
  return completedReviews;
}

export async function getOrderReview(
  orderId: string
): Promise<SubmittedReview | null> {
  if (USE_MOCK) {
    return mockReviews.get(orderId) ?? null;
  }

  try {
    const { data } = await http.get<any>(`/orders/${orderId}/review/`);
    const raw = Array.isArray(data) ? data[0] : (data?.review ?? data);

    return raw?.id || raw?.rating != null
      ? {
          id: String(raw.id ?? orderId),
          orderId,
          rating: Number(raw.rating),
          comment: String(raw.comment ?? ''),
          createdAt: String(raw.created_at ?? ''),
          reviewerName: raw.reviewer?.full_name || raw.reviewer_name || raw.reviewer,
          itemTitle: raw.order?.listing_title || raw.listing_title || raw.item_title,
        }
      : null;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }

    return null;
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
