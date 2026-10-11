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
- Backend also **requires** `id_number` and `name_on_document`. The current
  `VerifyIdentityScreen` does **not** collect them, so a real submission will
  be rejected with a validation error until the screen adds those two inputs.

### ORDERS / LISTINGS — `apps/orders`

- **No `urls.py` and no endpoints exist on the backend yet.**
- `src/features/orders/services/ordersService.ts` has a placeholder real call
  (`GET /orders/`) that will 404 until the backend team ships the module.
- Backend `OrderStatus` strings must be confirmed before wiring real list UIs.

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
3. **Identity document fields.** `VerifyIdentityScreen` needs `id_number` and
   `name_on_document` inputs before real submissions can succeed (this branch
   deliberately kept the screen's design unchanged, so it is still
   mock-gated).
4. **Orders / listings.** Entire backend module pending. Keep
   `ordersService.ts` mock-first until endpoints land.
5. **CORS for Expo Web.** The backend has no `django-cors-headers`; testing via
   `expo start --web` will need CORS enabled on the Django side and
   `extraHeaders`/credentials config on this end. Native (iOS/Android) is not
   affected.
6. **Home / Search / Chat / AddItem screens** still use static local data in
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

Sign-up → verification → login is fully wired. Identity submission is
contract-correct but blocked on missing screen inputs (see #3).