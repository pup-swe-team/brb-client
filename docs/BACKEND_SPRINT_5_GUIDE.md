# Backend Team Integration & Alignment Guide (Sprint 5)

This document outlines every feature and bug fix implemented on the `sprint-5` frontend branch, the **exact API endpoints, request payloads, and response shapes** the mobile app calls, and what the backend team (`brb-server`) needs to expose or align so each ticket reflects properly when `EXPO_PUBLIC_USE_MOCK=false`.

All endpoints below are relative to `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:8000/api/v1`).

---

## Summary Checklist for Backend Team

| Ticket / Bug | Frontend Service / Screen | Backend Endpoints Expected |
|---|---|---|
| **CP-701** One-to-one Chat | `chatService.ts`, `ChatListScreen`, `ChatThreadScreen` | `GET /chats/`, `POST /chats/`, `GET /chats/{id}/messages/`, `POST /chats/{id}/messages/`, `POST /chats/{id}/read/` |
| **CP-702** Block User in Chat | `chatService.ts`, `ChatThreadScreen`, `BlockUserModal` | `GET /users/{id}/block/`, `POST /users/{id}/block/`, `POST /users/{id}/unblock/` |
| **CP-703** Retained Chat in Disputes | `caseConversationService.ts`, `AdminCaseScreen` | `GET /disputes/{caseId}/conversation/` + Django Admin retention |
| **CP-802** Notification Preferences | `accountService.ts`, `NotificationPreferencesScreen` | `GET /auth/notification-preferences/`, `PUT /auth/notification-preferences/` |
| **CP-903** Dispute Response & Evidence | `ordersService.ts`, `ReportDamageScreen`, `DisputeResponseScreen` | `POST /orders/{id}/damage-report/`, `POST /orders/{id}/dispute-response/` |
| **Home Page / FE-BUG-5002** | `HomeScreen.tsx`, `searchListings.ts` | `GET /listings/?sort=-created_at&page=1` |
| **FE-BUG-5001** Max Borrowing Days | `listingsService.ts`, `searchListings.ts`, `ItemDetailScreen` | `max_duration_days` persisted & returned on `/listings/` & `/listings/{id}/`, validated on `POST /orders/` |
| **FE-BUG-4009** Borrower Reviews Received | `reviewsService.ts`, `ReviewsSection.tsx` | `GET /reviews/?target_user={id}&role=borrower`, `GET /users/me/borrower-dashboard/`, `GET /orders/{id}/review/` |

---

## 1. Sprint 5 Feature Tickets

### **CP-701: One-to-One Chat Between Borrower and Lender**
- **What Frontend Did:**
  - Built `ChatListScreen` (inbox with unread badges, search, and blocked indicator) and `ChatThreadScreen` (message bubbles, quick replies, message composer, read tracking).
  - Wired "Chat" entry points from `ItemDetailScreen` (passes `recipientId`, `recipientName`, `listingId`, `listingTitle`) and `OrderDetailScreen` via `OpenChatAction` (passes `orderId`, `recipientName`, `listingTitle`).
  - When `ChatThreadScreen` opens without an existing `conversationId`, it automatically calls `POST /chats/` to create or retrieve the conversation.
- **What Backend Needs to Implement / Align:**
  1. **`GET /chats/`** — List conversations for the authenticated user (array or `{ results: [...] }`):
     ```json
     [
       {
         "id": 12,
         "participant_id": 5,
         "participant_name": "Princess Izzy Dancal",
         "participant_avatar": "/media/avatars/5.jpg",
         "last_message": { "text": "See you at PUP Main Gate!", "created_at": "2026-11-27T10:15:00Z" },
         "unread_count": 2,
         "listing_id": 8,
         "listing_title": "Basic Calculator",
         "order_id": 42,
         "is_blocked": false,
         "blocked_by_me": false
       }
     ]
     ```
  2. **`POST /chats/`** — Get-or-create a conversation between the current user and counterparty:
     - **Request JSON:** `{ "participant_id": "5", "listing_id": "8", "order_id": "42", "initial_message": "..." }` (all optional except `participant_id` or `order_id`; if `order_id` is passed without `participant_id`, infer the counterparty from the order).
     - **Response JSON:** Same conversation object shape as `GET /chats/` (must include `id` and `participant_id`).
  3. **`GET /chats/{conversationId}/messages/`** — List messages in chronological order (array or `{ results: [...] }`):
     ```json
     [
       {
         "id": 101,
         "conversation_id": 12,
         "sender_id": 5,
         "sender_name": "Princess Izzy Dancal",
         "text": "Is this still available?",
         "created_at": "2026-11-27T10:10:00Z",
         "is_read": true
       }
     ]
     ```
     > **Important:** Return the current user's `sender_id` consistently (or ensure `ChatThreadScreen` can match `sender_id` / `sender_name`).
  4. **`POST /chats/{conversationId}/messages/`** — Send a message:
     - **Request JSON:** `{ "text": "Yes, available tomorrow!" }`
     - **Response JSON (201):** Message object `{ id, conversation_id, sender_id, sender_name, text, created_at }`.
     - Reject with HTTP `403` if either participant has blocked the other.
  5. **`POST /chats/{conversationId}/read/`** — Mark all unread messages from the counterparty in this conversation as read.

---

### **CP-702: Block / Unblock Another User in Chat**
- **What Frontend Did:**
  - Added header options menu in `ChatThreadScreen` with **Block User** / **Unblock User** actions and `BlockUserModal` confirmation dialog.
  - Disables message input and shows a blocked banner when the user is blocked.
- **What Backend Needs to Implement / Align:**
  1. **`GET /users/{userId}/block/`** — Check block status between authenticated user and `userId`:
     ```json
     { "is_blocked": true, "blocked_by_me": true }
     ```
  2. **`POST /users/{userId}/block/`** — Block `userId`. Must prevent both users from sending new messages in shared conversations (HTTP `403` on `POST /chats/{id}/messages/`).
  3. **`POST /users/{userId}/unblock/`** — Remove the block created by the authenticated user.
  4. Include `is_blocked` and `blocked_by_me` booleans on each conversation in `GET /chats/`.

---

### **CP-703: Retain Conversations Linked to Reports or Disputes**
- **What Frontend Did:**
  - Built `CaseConversation` component inside `AdminCaseScreen` displaying a read-only audit trail of messages between Borrower and Lender for a disputed/reported case.
- **What Backend Needs to Implement / Align:**
  1. **`GET /disputes/{caseId}/conversation/`** — Return retained chat messages for the dispute/report case (admin/staff only):
     ```json
     [
       {
         "id": "m1",
         "sender": "lender",
         "text": "Hi! Reminding you that the item is due back on Friday.",
         "sentAt": "2026-11-03T09:10:00Z"
       },
       {
         "id": "m2",
         "sender": "borrower",
         "text": "Noted, I will return it at PUP Main Gate.",
         "sentAt": "2026-11-03T09:14:00Z"
       }
     ]
     ```
     - Note: Frontend currently reads exact keys `id`, `sender` (`"borrower"` | `"lender"`), `text`, and `sentAt` (ISO 8601).
  2. **Retention Policy & Django Admin (`/portal/`):**
     - Prevent deletion/purging of chat conversations and messages linked to an open or resolved report/dispute (even if a user blocks the other party or deactivates their account).
     - Display the retained conversation in Django Admin under the corresponding Report / Dispute case view.

---

### **CP-802: Configure Email & Push Notification Preferences**
- **What Frontend Did:**
  - Updated `NotificationPreferencesScreen` with toggles grouped into 4 sections:
    - **Order Updates**: `requests`, `handover`, `overdue`
    - **Messages**: `messages`
    - **Reviews**: `reviews`
    - **Account & Verification**: `security` (locked ON for security)
  - Each category has independent `push` and `email` booleans.
- **What Backend Needs to Implement / Align:**
  1. **`GET /auth/notification-preferences/`** — Return preference map for authenticated user:
     ```json
     {
       "requests": { "push": true, "email": true },
       "handover": { "push": true, "email": true },
       "overdue": { "push": true, "email": true },
       "messages": { "push": true, "email": false },
       "reviews": { "push": true, "email": true },
       "security": { "push": true, "email": true }
     }
     ```
  2. **`PUT /auth/notification-preferences/`** — Accept the same JSON object, persist preferences, and enforce `security` always remaining `{ "push": true, "email": true }`.
  3. Respect these saved preferences when dispatching transactional emails and push notifications.

---

### **CP-903: Document & Resolve Item Damage / Missing-Item Disputes**
- **What Frontend Did:**
  - Lender damage reporting at return (`ReportDamageScreen`) calls `POST /orders/{orderId}/damage-report/` (multipart).
  - Borrower dispute response (`DisputeResponseScreen`, launched from `OrderDetailScreen` when order status is `Disputed`) allows submitting a written explanation plus photo/video evidence via `POST /orders/{orderId}/dispute-response/`.
- **What Backend Needs to Implement / Align:**
  1. **`POST /orders/{orderId}/damage-report/`** (already live from Sprint 3) — multipart `description` + repeatable `evidence` files. Transitions order to `disputed` and opens a Dispute case.
  2. **`POST /orders/{orderId}/dispute-response/`** — New endpoint for the Borrower to submit their side of the dispute:
     - **Content-Type:** `multipart/form-data`
     - **Fields:**
       - `description` (string, required)
       - `evidence` (repeatable image/video file field, optional or required per policy)
     - **Permissions:** Only the order's **borrower** when the order is in `disputed` status.
     - **Response JSON (200/201):**
       ```json
       { "id": 15, "status": "response_submitted" }
       ```
  3. Surface the borrower's response text and uploaded evidence files in the Django Admin dispute triage view alongside the lender's damage report.

---

## 2. Sprint 5 & Carryover Bug Fixes Requiring Backend Alignment

### **FE-BUG-5001: Maximum Days for Borrowing Set by Lender Not Followed**
- **What Frontend Did:**
  - `AddItemScreen` / `listingsService.ts` sends `max_duration_days` (integer, e.g. `1`, `3`, `5`, `7`, `14`) on both `POST /listings/` and `PATCH /listings/{id}/`.
  - `searchListings.ts` and `ItemDetailScreen.tsx` read `max_duration_days` (plus aliases `max_duration`, `max_borrowing_days`, `max_borrow_days`, `max_rental_days`, `max_days`), display `"Max borrowing period: X days"`, disable return dates past `checkout + (max_duration_days - 1)` in the calendar, and block submission if exceeded.
- **What Backend Needs to Implement / Align:**
  1. Ensure the `Listing` model & serializer **accept and persist `max_duration_days`** (positive integer) on `POST /listings/` and `PATCH /listings/{id}/`.
  2. **Include `max_duration_days` in both `GET /listings/` (list) and `GET /listings/{id}/` (detail) responses!** If this field is missing or `null` in the API response, the frontend cannot know the lender's limit.
  3. **Server-side enforcement in `POST /orders/`:** Validate `(end_date - start_date).days + 1 <= listing.max_duration_days`. If exceeded, return HTTP `400`:
     ```json
     {
       "code": "max_duration_exceeded",
       "detail": "The lender allows up to 3 days per rental. Please choose a shorter date range."
     }
     ```

---

### **FE-BUG-5002: Hardcoded App Dashboard Listings**
- **What Frontend Did:**
  - Completely removed `fallbackListings` from `HomeScreen.tsx`.
  - `HomeScreen` now fetches live listings from `GET /listings/?sort=-created_at&page=1` every time the tab gains focus (`useFocusEffect`), and renders a real empty state or retryable error state instead of hardcoded fake items.
- **What Backend Needs to Implement / Align:**
  1. Ensure `GET /listings/` supports `sort=-created_at` (newest first) and excludes `inactive`, `deleted`, and `unreturned` listings.
  2. Return `photos`, `lender` (`id`, `full_name`, `verified`, `photo`), `pickup_location`, `category`, `rate_per_day`, `rating` / `rating_average`, `review_count`, `available_from`, `available_to`, and `max_duration_days` on each listing item.

---

### **FE-BUG-4009 (Carryover from Sprint 4): Borrower Dashboard "Reviews Received" Missing Reviews**
- **What Frontend Did:**
  - Hardened `reviewsService.ts` (`getReceivedReviews` & `getOrderReview`) to inspect **all** reviews returned for an order (instead of only `reviews[0]`), filter out reviews written *by* the current user (`reviewer_id !== current_user.id`), match `reviewee_id === current_user.id` and `target_role`, and query multiple fallback endpoints.
- **What Backend Needs to Implement / Align:**
  1. **`GET /reviews/?target_user={user_id}&role=borrower`** — Return all reviews where `reviewee_id == user_id` and the user was the **borrower** on that order (i.e. written by the lender).
  2. **`GET /reviews/?target_user={user_id}&role=lender`** — Return all reviews where `reviewee_id == user_id` and the user was the **lender** on that order (i.e. written by the borrower).
  3. Include `reviewer` (`id`, `full_name`, `is_verified`), `reviewee_id` (or `target_user_id`), `target_role` (`"borrower"` | `"lender"`), `order_id`, `listing_title`, `rating`, `comment`, and `created_at` on every review object.
  4. In **`GET /users/me/borrower-dashboard/`**, include `reviews_received` containing only reviews received by the user as a borrower.
  5. In **`GET /orders/{id}/review/`**, if both parties can review an order, return an array of reviews (with `reviewer_id` and `target_role`) or `{ my_review, counterpart_review }` so both "Your Review" on `OrderDetailScreen` and "Reviews Received" on the dashboards can distinguish who wrote each review.
