# Backend Connection Reference (brb-client)

How the app talks to the BRB backend, and where the connections are **not**
finished yet. Use this as the source of truth when adding features so the
payload shapes here match the backend's real contract.

Base URL: `EXPO_PUBLIC_API_URL` in `.env` (see below).

---

## Base URL

```bash
# .env / .env.example
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```

- The version prefix `/api/v1` is **required** — older values in this repo
  pointed at `/api` and silently 404'd every request.
- Android emulator: use `http://10.0.2.2:8000/api/v1` (`10.0.2.2` = the host
  machine).
- Physical device: replace `localhost` with your machine's LAN IP, and make
  sure the phone and computer are on the same network.
- `USE_MOCK` (`true`/`false`) gates every service behind a mock branch so the
  app still runs without the backend running.

Auth tokens are stored via `expo-secure-store` (`src/services/http.ts`):
- `brb_access_token` (JWT access, 15 min) — sent as `Authorization: Bearer`
  by the axios request interceptor.
- `brb_refresh_token` (JWT refresh, 7 days).

---

## Endpoints (backend contract)

### AUTH — `apps/users` (`src/features/auth/services/authService.ts`)

| Method | Path | Body (JSON) | Success response |
|---|---|---|---|
| POST | `/auth/register/` | `email, password, password_confirm, full_name, contact_number, affiliation` | `{ message, user }` (201) |
| POST | `/auth/verify-email/` | `uid, token` (from emailed link) | `{ detail }` |
| POST | `/auth/login/` | `email, password` | `{ user, tokens: { access, refresh } }` |
| GET | `/auth/me/` | — (auth) | current `user` (profile card data) |
| POST | `/auth/token/refresh/` | `refresh` | `{ access }` |
| POST | `/auth/logout/` | `refresh` | 204 (blacklists token) |

**Constraints to honor on every screen wiring:**
- Registration **does not** accept extra fields (no `home_address`, no
  `confirmPassword` — the backend field is `password_confirm`). Unknown keys
  cause 400s. `RegisterScreen` keeps collecting `homeAddress` in the UI but it
  must **not** be sent to the API.
- `affiliation` values: `Student | Faculty | Staff`.
- `contact_number` must match the PH mobile format (e.g. `0917...`).
- `email` must be `@pup.edu.ph` or `@iskolarngbayan.pup.edu.ph` and match the
  affiliation domain rules.
- Login errors come back as `401 { detail, code }`. Codes to branch on:
  `invalid_credentials`, `locked_out`, `suspended`, `banned`, `inactive`,
  `unverified_email`. `extractApiError` (in `http.ts`) turns these into the
  human-readable `detail`.

### IDENTITY — `apps/users` (`src/features/profile/services/verification.ts`)

| Method | Path | Body | Success response |
|---|---|---|---|
| POST | `/identity/documents/` | multipart form: `document_type, id_number, name_on_document, document_file, consent_given` | `{ message }` (201) |
| GET | `/identity/documents/` | — (auth) | my documents |
| GET | `/identity/documents/<pk>/` | — | single document (+ base64 image) |
| GET | `/identity/documents/review/<pk>/` | — | review view w/ document details |
| GET | `/identity/documents/owner-info/<pk>/` | — | contact info for a lost item |

- `document_type` takes a **lookup name** (`pup_id`, `government_id`), not a
  number. The screen's display values (`PUP ID`, `Government ID`) must be
  mapped via `DOC_TYPE_LOOKUP` in `verification.ts`.
- The screen must collect `id_number` and `name_on_document`:
  `VerifyIdentityScreen` provides those inputs, and `verification.ts` sends
  them; the backend rejects submissions that omit them.
- The multipart body is built platform-aware in `verification.ts`: on web the
  picked image's real `File` is appended directly, on native the
  `{ uri, name, type }` object; `Content-Type` is left unset so each platform's
  serialiser adds the boundary.

### ORDERS / LISTINGS / CODES / DISPUTES — branch `merging/sprint-3`

Source: `BACKEND_API_COORDINATION_GUIDE` (Nov 4, 2026). All endpoints below are live.
Backend `status` strings are mapped to UI labels by `mapBackendStatus` in `ordersService.ts`
(`handover_pending` -> Confirmed, `in_possession` / `return_pending` -> Active, others 1:1).

| Area | Method + path | Used by |
|---|---|---|
| Calendar | `GET /listings/{id}/` -> `blocked_dates: [{ start_date, end_date, reason }]`, `is_available` | `ItemDetailScreen` |
| Request | `POST /orders/` `{ listing_id, start_date, end_date, notes }` | `createBorrowRequest` |
| Orders | `GET /orders/`, `GET /orders/{id}/` (include `borrower_name`, `lender_name`, lockout fields) | `getMyOrders`, `getOrder` |
| Dashboards | `GET /users/me/borrower-dashboard/`, `/lender-dashboard/` (fallback if `/orders/` fails) | `getMyOrders` |
| Codes | `GET /orders/{id}/handover-code/`, `/return-code/` (read active code + original expiry) | `getOrGenerate*Code` |
| Codes | `POST /codes/generate-handover/`, `/generate-return/` `{ order_id }` | "Request New Code" |
| Lockout | `GET /codes/verify-handover/?order_id=`, `/verify-return/?order_id=` | `useCodeLockout` |
| Verify | `POST /codes/verify-handover/` `{ order_id, code }`; `POST /codes/verify-return/` `{ order_id, code, flagged }` | `confirmHandover`, `confirmReturn` |
| Damage | `POST /orders/{id}/damage-report/` multipart `description` + `evidence` (repeatable) | `submitDamageReport` |
| Admin | `GET /disputes/`, `GET /disputes/{id}/`, `POST /disputes/{id}/resolve/`, `/escalate/` | `adminCaseService` |
| Account | `POST /users/me/deactivate/` `{ password, confirm: true }` | `accountService` |

Error `code` values the UI branches on: `borrowing_limit_reached`, `date_conflict`
(`conflicting_range`), `own_listing`, `listing_unavailable`, `has_unsettled_orders`
(`open_orders`, `open_unreturned_cases`), `lockout_active` (HTTP 429: `locked_until`,
`remaining_seconds`), `invalid_code`.

Behavior notes:
- Overdue / Expired are set by the backend whenever orders or dashboards are read. The app only reads `status`.
- A return flagged for damage makes the order `Disputed` on purpose, until an admin resolves it.
- The borrowing limit (3) counts active **and pending** requests (Requested, Confirmed, Active, Overdue).
- There is no deactivation pre-check endpoint; the block comes back from the deactivate POST.

---

## What still needs work (placeholders for future sprints)

1. **Email verification deep link.** The backend sends a verification email
   with a link containing `uid` + `token` aimed at a browser/web page. There is
   **no mobile deep-link config** (no `linking` in `app.json`), so the flow
   stops at `VerifyEmailScreen`. Future work: an in-app link handler (or a
   "paste link" input) that calls `/auth/verify-email/` with `{ uid, token }`.
2. **Refresh-token handling.** `authService.refreshAccessToken()` exists but
   the axios interceptor does not yet retry a request once with a fresh access
   token on 401. `http.ts` has a `// TODO` for this.
3. **Accept / decline / cancel.** `POST /orders/{id}/accept|decline|cancel/` are not in the
   Sprint 3 guide; confirm their paths with the backend.
4. **Home / Search / Chat / AddItem screens** still use static local data in
   the UI — no service layer yet. Wire them the same way
   `authService.ts`/`verification.ts` were wired: mock-first, then swap the
   mock branch for a real `http.*` call behind `EXPO_PUBLIC_USE_MOCK`.

---

## Testing the connection

1. Run the backend locally (Django dev server on `:8000`).
2. In this repo, set `EXPO_PUBLIC_API_URL` and keep `EXPO_PUBLIC_USE_MOCK=false`.
3. `npx expo start`, open on a device/emulator, register → check the emailed
   verification link → login.
4. Both screens surface backend errors through the existing error UI
   (no design changes were made on this branch).

Sign-up → verification → login → profile data (`/auth/me/`) are fully wired.
Identity submission is wired end-to-end (real `id_number`, `name_on_document`,
photo) and works on both native and web.