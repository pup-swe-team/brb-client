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

### **FE-BUG-4009: Reviews Received by Borrowers**
- **Target Area:** `GET /reviews/` endpoint
- **Issue:**
  Reviews submitted by lenders for borrowers should be queryable by user ID and role.
- **Backend Requirement:**
  1. Support filtering reviews by target user: `GET /reviews/?target_user={user_id}&role=borrower`.
  2. Return the review object including `reviewer` (lender name, verification status), `rating`, `comment`, `order` details, and `created_at`.
