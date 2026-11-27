
import { extractApiError, http, USE_MOCK } from '../../../services/http';
import { Order } from '../../../shared/types';
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
  reviewerId?: string;
  revieweeId?: string;
  targetRole?: 'borrower' | 'lender';
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

function extractId(val: any): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Avoid treating a full name like "John Doe" as an ID
    if (!trimmed || /\s/.test(trimmed)) return undefined;
    return trimmed;
  }
  if (typeof val === 'object' && val.id != null) {
    return String(val.id);
  }
  return undefined;
}

function extractReviewerId(raw: any): string | undefined {
  return (
    extractId(raw?.reviewer_id) ??
    extractId(raw?.reviewer?.id) ??
    extractId(raw?.author_id) ??
    extractId(raw?.author?.id) ??
    extractId(raw?.from_user_id) ??
    extractId(raw?.from_user?.id) ??
    extractId(raw?.reviewer)
  );
}

function extractRevieweeId(raw: any): string | undefined {
  return (
    extractId(raw?.reviewee_id) ??
    extractId(raw?.reviewee?.id) ??
    extractId(raw?.target_user_id) ??
    extractId(raw?.target_user?.id) ??
    extractId(raw?.reviewed_user_id) ??
    extractId(raw?.reviewed_user?.id) ??
    extractId(raw?.recipient_id) ??
    extractId(raw?.recipient?.id) ??
    extractId(raw?.to_user_id) ??
    extractId(raw?.to_user?.id) ??
    extractId(raw?.subject_id) ??
    extractId(raw?.subject?.id) ??
    extractId(raw?.reviewee) ??
    extractId(raw?.target_user)
  );
}

function extractOrderId(raw: any): string | undefined {
  return (
    extractId(raw?.order_id) ??
    extractId(raw?.order?.id) ??
    extractId(raw?.order)
  );
}

function extractTargetRole(raw: any): 'borrower' | 'lender' | undefined {
  const candidates = [
    raw?.target_role,
    raw?.reviewee_role,
    raw?.reviewed_role,
    raw?.role,
    raw?.review_type,
    raw?.direction,
    raw?.type,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const val = String(candidate).trim().toLowerCase();
    if (
      val === 'borrower' ||
      val === 'lender_to_borrower' ||
      val === 'for_borrower' ||
      val === 'borrower_review'
    ) {
      return 'borrower';
    }
    if (
      val === 'lender' ||
      val === 'borrower_to_lender' ||
      val === 'for_lender' ||
      val === 'lender_review'
    ) {
      return 'lender';
    }
  }

  const reviewerRole = String(raw?.reviewer_role || '').trim().toLowerCase();
  if (reviewerRole === 'lender') return 'borrower';
  if (reviewerRole === 'borrower') return 'lender';

  return undefined;
}

function isRawReviewObject(item: any): boolean {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  return item.rating != null || (item.id != null && item.comment != null);
}

function extractReviewsArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(isRawReviewObject);

  const listKeys = [
    'results',
    'reviews',
    'reviews_received',
    'received_reviews',
    'borrower_reviews',
    'lender_reviews',
    'reviews_as_borrower',
    'reviews_as_lender',
    'data',
  ];
  for (const key of listKeys) {
    if (Array.isArray(data[key])) {
      return data[key].filter(isRawReviewObject);
    }
  }

  const singleKeys = [
    'review',
    'received_review',
    'counterpart_review',
    'lender_review',
    'borrower_review',
    'review_from_lender',
    'review_from_borrower',
    'review_for_borrower',
    'review_for_lender',
    'my_review',
  ];
  const collected: any[] = [];
  for (const key of singleKeys) {
    if (isRawReviewObject(data[key])) {
      // Tag directional keys if the backend didn't include target_role
      const entry = { ...data[key] };
      if (!extractTargetRole(entry)) {
        if (key === 'review_from_lender' || key === 'review_for_borrower') {
          entry.target_role = 'borrower';
        } else if (key === 'review_from_borrower' || key === 'review_for_lender') {
          entry.target_role = 'lender';
        }
      }
      collected.push(entry);
    }
  }
  if (collected.length > 0) return collected;

  if (isRawReviewObject(data)) return [data];
  return [];
}

function isCommentMismatchedForRole(comment: string, role: 'Borrower' | 'Lender'): boolean {
  const c = comment.toLowerCase();
  if (
    role === 'Lender' &&
    (c.includes('great borrower') ||
      c.includes('careful borrower') ||
      c.includes('punctual borrower') ||
      c.includes('easy to communicate with during pickup and return'))
  ) {
    return true;
  }
  if (
    role === 'Borrower' &&
    (c.includes('reliable lender') ||
      c.includes('great lender') ||
      c.includes('smooth handoff and the calculator was in perfect condition'))
  ) {
    return true;
  }
  return false;
}

function isReviewReceivedForRole(
  raw: any,
  role: 'Borrower' | 'Lender',
  userId?: string,
  roleOrderIds?: Set<string>,
  requireRoleMatch = false
): boolean {
  if (!isRawReviewObject(raw)) return false;

  const reviewerId = extractReviewerId(raw);
  const revieweeId = extractRevieweeId(raw);
  const targetRole = extractTargetRole(raw);
  const orderId = extractOrderId(raw);

  // Never show reviews written BY the current user in "Reviews Received"
  if (userId && reviewerId && reviewerId === userId) {
    return false;
  }

  // If the review specifies a recipient/reviewee, it must be the current user
  if (userId && revieweeId && revieweeId !== userId) {
    return false;
  }

  // Respect explicit role metadata
  if (role === 'Lender' && targetRole === 'borrower') return false;
  if (role === 'Borrower' && targetRole === 'lender') return false;

  // Guard against mock/seed cross-role bleed
  if (isCommentMismatchedForRole(String(raw.comment ?? ''), role)) {
    return false;
  }

  // When pulling from an unfiltered endpoint (e.g. GET /reviews/ or /lenders/{id}/),
  // require positive evidence that this review belongs to the requested role.
  if (requireRoleMatch) {
    const expectedRole = role.toLowerCase();
    const matchesTargetRole = targetRole === expectedRole;
    const matchesOrder = Boolean(orderId && roleOrderIds?.has(orderId));
    if (!matchesTargetRole && !matchesOrder) {
      return false;
    }
  }

  return true;
}

function mapRawToLenderReview(
  raw: any,
  role: 'Borrower' | 'Lender',
  fallbackOrder?: Order
): LenderReview {
  const rawReviewerName =
    raw?.reviewer?.full_name ||
    raw?.reviewer_name ||
    raw?.author?.full_name ||
    raw?.author_name ||
    (typeof raw?.reviewer === 'string' && !/^\d+$/.test(raw.reviewer.trim())
      ? raw.reviewer
      : '');

  const fallbackReviewerName = fallbackOrder
    ? role === 'Borrower'
      ? fallbackOrder.lenderName || fallbackOrder.counterpart
      : fallbackOrder.borrowerName || fallbackOrder.counterpart
    : '';

  const fallbackId = fallbackOrder
    ? `order-${fallbackOrder.id}-${role.toLowerCase()}`
    : `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const targetRole = extractTargetRole(raw);

  return {
    id: String(raw?.id ?? fallbackId),
    reviewerName:
      rawReviewerName ||
      fallbackReviewerName ||
      (role === 'Borrower' ? 'Lender' : 'Borrower'),
    reviewerVerified: Boolean(
      raw?.reviewer?.is_verified ?? raw?.reviewer_verified ?? true
    ),
    rating: Number(raw?.rating ?? 5),
    comment: String(raw?.comment ?? ''),
    itemTitle:
      raw?.order?.listing_title ||
      raw?.order?.listing?.title ||
      raw?.listing_title ||
      raw?.item_title ||
      raw?.item?.title ||
      fallbackOrder?.listingTitle ||
      (role === 'Borrower' ? 'Borrowed Item' : 'Lent Item'),
    date:
      String(raw?.created_at ?? raw?.createdAt ?? raw?.date ?? fallbackOrder?.endDate ?? '').slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    target_role: targetRole,
    role: targetRole,
  };
}

function dedupeReviews(reviews: LenderReview[]): LenderReview[] {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const unique: LenderReview[] = [];

  for (const review of reviews) {
    const idKey = String(review.id);
    const fingerprint = `${review.reviewerName.toLowerCase()}|${review.rating}|${review.comment.trim().toLowerCase()}|${review.date}`;
    if (seenIds.has(idKey) || seenFingerprints.has(fingerprint)) {
      continue;
    }
    seenIds.add(idKey);
    seenFingerprints.add(fingerprint);
    unique.push(review);
  }

  return unique;
}

async function fetchRawOrderReviews(orderId: string): Promise<any[]> {
  const collected: any[] = [];

  // 1. Primary endpoint: GET /orders/{id}/review/
  try {
    const { data } = await http.get<any>(`/orders/${orderId}/review/`);
    collected.push(...extractReviewsArray(data));
  } catch {
    // Non-fatal; try plural or detail fallback below
  }

  // 2. Plural endpoint fallback: GET /orders/{id}/reviews/
  if (collected.length === 0) {
    try {
      const { data } = await http.get<any>(`/orders/${orderId}/reviews/`);
      collected.push(...extractReviewsArray(data));
    } catch {
      // Non-fatal
    }
  }

  // 3. Order detail fallback: GET /orders/{id}/ (detail serializer may include nested reviews)
  if (collected.length === 0) {
    try {
      const { data } = await http.get<any>(`/orders/${orderId}/`);
      collected.push(...extractReviewsArray(data));
    } catch {
      // Non-fatal
    }
  }

  return collected;
}

async function getReviewsFromCompletedOrders(
  role: 'Borrower' | 'Lender',
  userId?: string,
  preloadedOrders?: Order[]
): Promise<LenderReview[]> {
  try {
    const orders = preloadedOrders ?? (await getMyOrders(role));
    const completed = orders.filter(
      (o) =>
        (o.status === 'Completed' || o.status === 'Returned') &&
        (!o.role || o.role === role)
    );
    if (completed.length === 0) return [];

    const roleOrderIds = new Set(completed.map((o) => String(o.id)));
    const reviews: LenderReview[] = [];

    for (const order of completed) {
      // 1. Check ALL embedded reviews on the order payload (not just reviews[0])
      const embeddedCandidates = extractReviewsArray(order);
      const matchingEmbedded = embeddedCandidates.filter((raw) =>
        isReviewReceivedForRole(raw, role, userId, roleOrderIds)
      );

      if (matchingEmbedded.length > 0) {
        for (const raw of matchingEmbedded) {
          reviews.push(mapRawToLenderReview(raw, role, order));
        }
        continue;
      }

      // 2. In mock mode, check local mockReviews map
      if (USE_MOCK) {
        const mockReview = mockReviews.get(order.id);
        if (mockReview && isReviewReceivedForRole(mockReview, role, userId, roleOrderIds)) {
          reviews.push(mapRawToLenderReview(mockReview, role, order));
        }
        continue;
      }

      // 3. Query order review endpoints (/orders/{id}/review/, /orders/{id}/reviews/, /orders/{id}/)
      const fetched = await fetchRawOrderReviews(order.id);
      const matchingFetched = fetched.filter((raw) =>
        isReviewReceivedForRole(raw, role, userId, roleOrderIds)
      );

      for (const raw of matchingFetched) {
        reviews.push(mapRawToLenderReview(raw, role, order));
      }
    }

    return dedupeReviews(reviews);
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
    if (role === 'Lender') {
      // NEVER append mockBorrowerReviews to Lender reviews
      return orderReviews;
    }
    if (orderReviews.length > 0) {
      return dedupeReviews([...orderReviews, ...mockBorrowerReviews]);
    }
    return mockBorrowerReviews;
  }

  // Preload this role's completed orders so we can match order_ids & enrich metadata
  let completedOrders: Order[] = [];
  try {
    const orders = await getMyOrders(role);
    completedOrders = orders.filter(
      (o) =>
        (o.status === 'Completed' || o.status === 'Returned') &&
        (!o.role || o.role === role)
    );
  } catch {
    completedOrders = [];
  }

  const roleOrderIds = new Set(completedOrders.map((o) => String(o.id)));
  const orderById = new Map(completedOrders.map((o) => [String(o.id), o]));

  const mapFiltered = (rawList: any[], requireRoleMatch = false): LenderReview[] => {
    const filtered = rawList.filter((item) =>
      isReviewReceivedForRole(item, role, userId, roleOrderIds, requireRoleMatch)
    );
    return dedupeReviews(
      filtered.map((item) => {
        const orderId = extractOrderId(item);
        return mapRawToLenderReview(item, role, orderId ? orderById.get(orderId) : undefined);
      })
    );
  };

  // 1. Try GET /reviews/ with target_user and role query parameters
  try {
    const { data } = await http.get<any>('/reviews/', {
      params: { target_user: userId, role: role.toLowerCase() },
    });
    const mapped = mapFiltered(extractReviewsArray(data), false);
    if (mapped.length > 0) return mapped;
  } catch {
    // Continue to alternative endpoints
  }

  // 2. Try dashboard endpoint (/users/me/borrower-dashboard/ or /users/me/lender-dashboard/)
  try {
    const dashPath =
      role === 'Borrower'
        ? '/users/me/borrower-dashboard/'
        : '/users/me/lender-dashboard/';
    const { data } = await http.get<any>(dashPath);
    const mapped = mapFiltered(extractReviewsArray(data), false);
    if (mapped.length > 0) return mapped;
  } catch {
    // Continue to alternative endpoints
  }

  // 3. Try alternative review list endpoints (e.g. reviewee filter, /reviews/received/, /users/me/reviews/)
  const altRequests: { url: string; params?: Record<string, any>; requireRoleMatch: boolean }[] = [
    ...(userId
      ? [
          { url: '/reviews/', params: { reviewee: userId, role: role.toLowerCase() }, requireRoleMatch: false },
          { url: '/reviews/', params: { reviewee: userId }, requireRoleMatch: true },
          { url: `/users/${userId}/reviews/`, params: { role: role.toLowerCase() }, requireRoleMatch: false },
        ]
      : []),
    { url: '/reviews/received/', params: { role: role.toLowerCase() }, requireRoleMatch: false },
    { url: '/users/me/reviews/', params: { role: role.toLowerCase() }, requireRoleMatch: false },
    { url: '/reviews/', requireRoleMatch: true },
  ];

  for (const req of altRequests) {
    try {
      const { data } = await http.get<any>(req.url, req.params ? { params: req.params } : undefined);
      const mapped = mapFiltered(extractReviewsArray(data), req.requireRoleMatch);
      if (mapped.length > 0) return mapped;
    } catch {
      // Try next endpoint
    }
  }

  // 4. Fallback: Query reviews from completed orders via /orders/{id}/review/ (and /reviews/, /orders/{id}/)
  const completedReviews = await getReviewsFromCompletedOrders(role, userId, completedOrders);
  if (completedReviews.length > 0) return completedReviews;

  // 5. Last-resort for Borrower: if backend exposes all received reviews on /lenders/{id}/,
  // strictly keep only reviews matching target_role='borrower' or a completed Borrower order.
  if (role === 'Borrower' && userId) {
    try {
      const numeric = userId.replace(/\D/g, '');
      const idToFetch = numeric || userId;
      const { data } = await http.get<any>(`/lenders/${idToFetch}/`);
      const mapped = mapFiltered(extractReviewsArray(data), true);
      if (mapped.length > 0) return mapped;
    } catch {
      // Pure borrowers without a lender profile may return 404 — safe to ignore
    }
  }

  return [];
}

export async function getOrderReview(
  orderId: string,
  reviewerId?: string
): Promise<SubmittedReview | null> {
  if (USE_MOCK) {
    return mockReviews.get(orderId) ?? null;
  }

  try {
    const { data } = await http.get<any>(`/orders/${orderId}/review/`);
    const list = extractReviewsArray(data);
    if (list.length === 0) return null;

    // Prefer the current user's own review when reviewerId is provided (e.g. ReviewAction)
    const raw =
      (reviewerId
        ? list.find((item) => extractReviewerId(item) === reviewerId)
        : undefined) ??
      (isRawReviewObject(data?.my_review) ? data.my_review : undefined) ??
      list[0];

    return raw?.id || raw?.rating != null
      ? {
          id: String(raw.id ?? orderId),
          orderId,
          rating: Number(raw.rating),
          comment: String(raw.comment ?? ''),
          createdAt: String(raw.created_at ?? ''),
          reviewerName: raw.reviewer?.full_name || raw.reviewer_name || raw.reviewer,
          reviewerId: extractReviewerId(raw),
          revieweeId: extractRevieweeId(raw),
          targetRole: extractTargetRole(raw),
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
