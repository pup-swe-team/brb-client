# Backend Team Bug Resolution Guide (Sprint 4)

This document outlines the bugs and requirements identified during Sprint 4 QA testing that require Backend / Admin Portal implementation or coordination.

---

## 1. Tickets Strictly for the Backend / Admin Portal Team

### **FE-BUG-4004: Admin Portal Reports & Flags Management Page Disabled**
- **Target Area:** Django Admin Portal (`brb-server` at `/portal/`)
- **Issue:**
  The "Reports & Flags" tab/navigation item in the Admin Portal is disabled and inaccessible, preventing administrators from triaging and resolving submitted reports against listings, users, reviews, or messages.
- **Backend Requirement:**
  1. Enable the route/view in `portal/urls.py` and navigation template for "Reports & Flags".
  2. Implement the table view displaying open reports from the `Report` model (`target_type`, `target_id`, `category`, `description`, `reporter`, `created_at`, `status`).
  3. Provide triage actions (e.g., "Dismiss Report", "Take Down Listing", "Warn User", "Ban User").

---

### **FE-BUG-4006: Admin Portal Retains Reinstate Action Button on Banned User Accounts**
- **Target Area:** Django Admin Portal (`brb-server` at `/portal/`) — Users & Roles View
- **Issue:**
  In the Admin Portal Users & Roles view, user accounts that have been permanently banned still display an active "Reinstate" action button.
- **Backend Requirement:**
  1. In the user management template and action handlers, check the user's ban status (e.g., `user.is_banned` / `user.ban_type == 'permanent'`).
  2. Hide or disable the "Reinstate" action button for permanently banned user accounts to enforce permanent ban policy.
  3. Ensure the backend view/endpoint rejects reinstatement requests for accounts flagged with permanent ban status (HTTP 400/403).

---

### **FE-BUG-4003 (Admin Portal Part): Admin Dashboard Page Time Display**
- **Target Area:** Django Admin Portal (`brb-server` at `/portal/`) — Admin Dashboard
- **Issue:**
  On the Admin Dashboard, displayed timestamps (e.g. system activity, case logs) are not reflecting correctly on modern web browsers (tested on Brave browser).
- **Backend Requirement:**
  1. Ensure timestamps formatted in templates use the application's local timezone (e.g., `Asia/Manila` / UTC+8) using Django's `timezone.localtime()`.
  2. Format timestamps cleanly using ISO 8601 or standard localized format (e.g. `M d, Y h:i A`).

---

## 2. Tickets with Backend Requirements / Coordination

### **FE-BUG-4001: Missing Auto-Decline Reason upon Lender Revocation**
- **Target Area:** `/auth/revoke-lender/` (or equivalent revocation endpoint) & `/orders/`
- **Issue:**
  When a lender revokes their status (with no active/confirmed orders), pending/requested borrow requests on their listings should be auto-declined. The borrower's order view needs a clear reason explaining why the order was declined.
- **Backend Requirement:**
  1. When processing lender role revocation, find all orders in `Requested` status for this lender.
  2. Update their status to `Declined` and set `decline_reason = "Lender status revoked"` (or `reason = "Lender status revoked"`).
  3. Ensure `/orders/{id}/` returns `decline_reason` in the response payload.

---

### **FE-BUG-4005: Accepted Report Category Choices on `/reports/`**
- **Target Area:** `POST /reports/` endpoint & `Report` model
- **Issue:**
  Selecting "Spam or scam" in the frontend report modal resulted in an unaccepted category choice error (HTTP 400: `category is not a valid choice`).
- **Backend Requirement:**
  1. In the `Report` model choices / serializer validation, ensure both `'spam'` and `'scam'` (or `'fraud'`) are accepted as valid category choices.
  2. Recommended choices for CP-901:
     - `'spam'`
     - `'scam'`
     - `'fraud'`
     - `'inappropriate'`
     - `'harassment'`
     - `'prohibited_item'`
     - `'other'`

---

### **FE-BUG-4008: Exclude Unreturned Order Listings from Search**
- **Target Area:** `GET /listings/` search endpoint
- **Issue:**
  Listings associated with an `Unreturned` order currently remain visible in search results as "Available".
- **Backend Requirement:**
  1. Filter out listings that are currently involved in an active `Unreturned` order or dispute case from public search results (`GET /listings/?search=...`).
  2. When an order transitions to `Unreturned`, update the listing's availability or exclude it from the active queryset until resolved.

---

### **FE-BUG-4009: Borrower Dashboard "Reviews Received" Section Does Not Display Borrower Reviews**
- **Target Area:** `GET /reviews/` endpoint & `GET /users/me/borrower-dashboard/`
- **Issue:**
  Reviews submitted by lenders for the borrower do not appear in the "Reviews Received" section on the Borrower Dashboard.
- **What We Did on the Frontend:**
  1. Updated `ReviewsSection.tsx` with `useFocusEffect` so reviews auto-refresh on screen focus when returning from completed orders or switching dashboard roles.
  2. Implemented multi-tier fallback querying:
     - First tries `GET /reviews/?target_user={user_id}&role=borrower`.
     - Then checks `GET /users/me/borrower-dashboard/` for any `reviews` or `reviews_received` array.
     - Fallback / direct resolution: queries reviews attached to completed borrower orders via `GET /orders/{id}/review/` or embedded `order.review` objects.
  3. Removed fallback to hardcoded mock reviews when running in live backend mode (`USE_MOCK=false`), ensuring real borrower accounts show their true review list or the "You haven't received any reviews yet." empty state.
- **Backend Requirements for the Backend Team:**
  1. **Option A (Preferred):** Support query filtering on `GET /reviews/`:
     - Filter reviews by `target_user`: `GET /reviews/?target_user={user_id}&role=borrower`.
     - When queried by a borrower, return all reviews where that user was the borrower in the associated order.
  2. **Option B:** In `GET /users/me/borrower-dashboard/`, include a `reviews_received` (or `reviews`) field containing all reviews submitted by lenders for the authenticated borrower.
  3. Ensure the serialized review object includes:
     - `id`: Unique review ID
     - `reviewer`: `{ id, full_name, is_verified }`
     - `rating`: Integer (1–5)
     - `comment`: Text
     - `order`: `{ id, listing_title }` (or `item_title`)
     - `created_at`: ISO timestamp

---

### **FE-BUG-4101: Lender Reviews Showing Up Instead of Just Product Reviews**
- **Target Area:** `GET /listings/{id}/` endpoint & `GET /lenders/{id}/`
- **Issue:**
  On the listing details page (`ItemDetailScreen`), all of the lender’s reviews across all their items were being displayed under "Product Reviews", instead of only showing reviews specifically for that listing.
- **What We Did on the Frontend:**
  1. In `ItemDetailScreen.tsx`, strictly restricted the "Product Reviews" section to reviews matching the specific listing/product.
  2. Removed the fallback to `lender.reviews` when no reviews exist for this item.
  3. When an item has no reviews, the screen now correctly displays the empty state: `"No reviews for this item yet."` (`reviewTotal === 0`), while the lender card above continues to display the lender's overall rating and total review count.
  4. Added support for `detailData.reviews` if the backend embeds listing-specific reviews in the `GET /listings/{id}/` payload.
- **Backend Requirements for the Backend Team:**
  1. In `GET /listings/{id}/`, optionally return a `reviews` array containing only reviews associated with orders for this specific listing:
     ```json
     {
       "id": 1,
       "title": "Basic Calculator",
       "rate_per_day": 10,
       "reviews": [
         {
           "id": 101,
           "rating": 5,
           "comment": "Works great for exams!",
           "reviewer_name": "Princess Izzy",
           "created_at": "2026-11-05T00:00:00Z"
         }
       ]
     }
     ```
  2. Maintain `GET /lenders/{id}/` returning all reviews of that lender for the public lender profile view, but keep listing queries isolated to reviews for that specific listing.
