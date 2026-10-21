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
| POST | `/auth/password-reset/` | `email` | generic `{ message }` (never says whether the address exists) |
| POST | `/auth/password-reset/validate/` | `uid, token` | `{ valid: true }`; dead link → **400** `{ detail }` |
| POST | `/auth/password-reset/confirm/` | `uid, token, password, password_confirm` | `{ message }` |

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
- **Reset links are single-use and time-limited.** The token hash covers the
  password hash, so a link stops working the moment the password changes.
  `NewPasswordScreen` therefore calls `/auth/password-reset/validate/` on mount
  and refuses to show the form for a link that is forged, expired, or already
  spent — otherwise a reused link would still reach the "new password" screen
  and only fail on submit.

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

### ORDERS — `apps/orders`

- **No `urls.py` and no endpoints exist on the backend yet.**
- `src/features/orders/services/ordersService.ts` has a placeholder real call
  (`GET /orders/`) that will 404 until the backend team ships the module.
- Backend `OrderStatus` strings must be confirmed before wiring real list UIs.

### LISTINGS — `apps/listings` (`src/features/listings/services/listingsService.ts`, `src/features/search/services/searchListings.ts`)

Verified against the running backend (see the verification note at the bottom).

| Method | Path | Params / Body | Success response |
|---|---|---|---|
| GET | `/listings/` | query: `page, q, category, pickup_location, available_from, available_to, sort` | `{ count, next, previous, results[] }` |
| GET | `/listings/<id>/` | — | full `ListingSerializer` (below) |
| POST | `/listings/` | multipart (see below) | 201 listing |
| PATCH | `/listings/<id>/` | multipart, partial | 200 listing |
| DELETE | `/listings/<id>/` | — | 204 |
| POST | `/listings/<id>/deactivate/` | — | 200 (status → `deactivated`) |
| POST | `/listings/<id>/reactivate/` | — | 200 (status → `active`) |
| GET | `/listings/categories/` | — | `[{ id, name }]` (unpaginated) |
| GET | `/pickup-locations/` | — | `[{ id, name, description }]` (unpaginated) |

**Search row (`results[]`) shape** — `id, title, description, condition,
rate_per_day, is_ownership_confirmed, lender{id, full_name, photo},
category{id, name}, pickup_location{id, name, description}, status{id, name},
photos[{id, file_reference, uploaded_at}], created_at, updated_at`.

- **`lender` in a search row carries no rating** — only `{id, full_name, photo}`.
  Rating is a lender-level aggregate (`rating_average`/`total_reviews`) present
  only on the **detail** and **lender profile** responses. Search cards
  therefore show "No ratings yet".
- **`photos[].file_reference` is an absolute URL** to the media file (local:
  `http://127.0.0.1:8000/media/...`); `absoluteMediaUrl` passes it through.
- **`rate_per_day` is `null` for a free listing**, else a decimal **string**
  (`"15.00"`). The client derives `isFree`/`price` from this — there is no
  `is_free` field.
- Pagination is DRF `PageNumberPagination`, `PAGE_SIZE=20`. **The `page_size`
  query param is ignored**; the client sends `page` only and derives
  `totalPages` from `count`.
- `sort` accepts `created_at | -created_at | rate_per_day | -rate_per_day |
  title | -title`. `relevance`/`rating` have no server equivalent and are not sent.

**Detail (`ListingSerializer`) adds** `availability_windows[{id, start_date,
end_date}]`, `reviews[{id, rating, comment, created_at, reviewer{id, full_name,
photo}}]`, `blocked_dates[{id, start_date, end_date, reason, created_at}]`, and a
fuller `lender{id, full_name, photo, affiliation, bio, rating_average,
total_reviews}`.

**Create/edit multipart fields:** `title, description, condition, category` (id),
`pickup_location` (id), `is_ownership_confirmed` (`"true"`), `rate_per_day`
(omit for free), `availability_windows` (JSON string, e.g.
`[{"start_date":"2030-01-01","end_date":"2030-12-31"}]`), `photos` (≥1 file,
JPEG/PNG/WEBP, magic-byte checked). Create requires an **identity-verified active
lender**; the window needs `start >= today` and `end >= start`.

- **Every field above is mandatory** and a missing one comes back as a bare
  `400 {"<field>": ["This field is required."]}`. In particular:
  - `description` may not be blank (`Listing.description` is non-blank), so the
    form treats it as a required field;
  - `category` and `pickup_location` are **foreign-key ids**, not names. A name
    that cannot be resolved to an id must never be sent as an empty field --
    the client resolves the id from `GET /listings/categories/` and
    `GET /pickup-locations/` and refuses to submit otherwise.
  - The two list endpoints are the single source of truth for the dropdowns.
    The hardcoded seed names in `constants.ts` are display-only placeholders
    with no id behind them, so `loadListingOptions()` replaces them with the
    live list (even when it is empty) and reports whether the lists are usable.

- **`getMyListings()` is intentionally unsupported.** There is no owner-scoped
  listings feed; `GET /listings/` is search-only and returns `status=active` rows
  only, so a lender's deactivated listings are unreachable. This belongs to
  CP-203 (Lender Dashboard, Sprint 3). The function throws a documented message.

### LENDERS — `apps/users` (`src/features/profile/services/lenderProfile.ts`, `src/features/search/services/searchLenders.ts`)

| Method | Path | Params | Success response |
|---|---|---|---|
| GET | `/lenders/` | query: `page, q` | `{ count, next, previous, results[] }` |
| GET | `/lenders/<id>/` | — | `{ id, full_name, affiliation, photo, bio, average_rating, review_count, active_listings[] }` |

- Search rows: `id, full_name, affiliation, photo, bio, active_listing_count`
  (**no rating, no program, no verified flag**).
- Profile: `active_listings[]` uses the search-row shape; **no `memberSince`, no
  embedded reviews** — the client leaves `memberSince: ''` and `reviews: []`,
  and `ItemDetailScreen` filters the profile's listings rather than expecting
  reviews there.

### ACCOUNT — `apps/users` (`src/features/profile/services/accountService.ts`)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/auth/me/` | — | `id, email, full_name, contact_number, affiliation, account_status, lender_status, email_verified_at, created_at` |
| PATCH | `/auth/me/` | `full_name, contact_number, bio, street_address, municipality(FK), province(FK)` | 200 |
| POST | `/auth/password-change/` | `current_password, new_password, new_password_confirm` | wrong current → **401** (D-12); success blacklists refresh tokens |
| POST | `/auth/email-change/` | `new_email` **only** (no password) | the swap happens only after the mailed link is confirmed |
| POST | `/auth/deactivate/` | — | blockers → **400** `{ detail, open_orders, open_unreturned_cases }` (counts); success → 200, `is_active=False` |
| POST | `/auth/apply-lender/` | — | CP-1003: grants `lender_status='active'`; refusal → **400** `{ detail }` |

- **Path is `/auth/password-change/`, not `change-password/`.**
- **`/auth/apply-lender/` (CP-1003) is server-authoritative.** The role lives in
  `lender_status` on the account, so the client reads it from `GET /auth/me/`
  and never toggles it locally. Preconditions enforced server-side: the account
  must be **active** (email verification flips `account_status` from
  `pending_review` to `active`), the identity document must be **approved**,
  and the account must not already be a lender or be **revoked**.
- **There is no `/auth/notification-preferences/`** (CP-802, Sprint 5) and **no
  `/change-email/resend/`**; both throw a documented "not available yet" in real
  mode (mock branches intact).
- **Known backend gap:** `PATCH /auth/me/` accepts `bio`/`street_address` and
  persists them, but `GET /auth/me/` (and the PATCH response) **do not echo them
  back** — `UserResponseSerializer` omits both. So `getAccountProfile` reads
  `homeAddress ← street_address` as empty. Until the backend exposes these, the
  profile UI cannot round-trip bio/address from `/auth/me/`.
- **No profile-photo upload endpoint exists** (CP-1001 leaves it to a future
  multipart endpoint); the client omits photo from the profile PATCH.


---

## What still needs work (placeholders for future sprints)

1. **Email verification / email-change deep links.** The backend sends links
   aimed at a browser/web page. There is **no mobile deep-link config** (no
   `linking` in `app.json`), so the flow stops at `VerifyEmailScreen`. Future
   work: an in-app link handler (or a "paste link" input) that calls
   `/auth/verify-email/` with `{ uid, token }`.
2. **Refresh-token handling.** `authService.refreshAccessToken()` exists but
   the axios interceptor does not yet retry a request once with a fresh access
   token on 401. `http.ts` has a `// TODO` for this.
3. **My Listings.** `getMyListings()` throws — no owner-scoped feed exists on
   the backend (CP-203, Sprint 3).
4. **Notification preferences** (`/auth/notification-preferences/`, CP-802) and
   **profile photo upload** have no endpoints yet; both are documented stubs.
5. **`/auth/me/` does not echo `bio`/`street_address`** (see ACCOUNT above), so
   the profile screen cannot display them from the server.
6. **Orders / chat / reviews / notifications.** Their listings-side read paths
   now work, but orders and chat modules are still pending on the backend.

---

## Verification status

Every service below was exercised **over HTTP against a running local Django
server** (not the test client), with the exact request shapes the client sends:

- ✅ `login`, `/auth/me/` GET + PATCH, `/auth/password-change/` (wrong→401,
  correct→200), `/auth/email-change/` (`{new_email}` only), `/auth/deactivate/`
  (200; login blocked afterwards)
- ✅ `/listings/categories/` (401 without auth, id/name, unpaginated)
- ✅ `/pickup-locations/`
- ✅ `/listings/` search with `page/q/category/pickup_location/available_from/
  available_to/sort=-created_at`, paginated envelope
- ✅ `/listings/` create (multipart, free + paid), detail, patch, deactivate,
  reactivate, delete
- ✅ `/lenders/?q=` and `/lenders/<id>/`

Net-zero: all throwaway listings created during verification were deleted; the
throwaway verified-lender account was removed from local SQLite.

**Render:** not yet verified. The deployed service answered `404` for
`/listings/`, `/listings/categories/`, `/pickup-locations/`, `/lenders/` (only
`/auth/me/` existed), i.e. it is running a **pre-sprint-2 build**. Render needs to
deploy `merging/sprint-2` (or that branch merged to `main`) before the same
checks can pass there. The Render DB also still needs category/pickup-location
seed rows and at least one verified active lender before write-path checks can
run.

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
photo) and works on both native and web. Sprint-2 search, listing detail,
lender search/profile, listing create-edit, and account settings are now wired
to the real endpoints above (mock branches preserved behind
`EXPO_PUBLIC_USE_MOCK`).