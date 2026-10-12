# Run BRB (Frontend + Backend)

Default setup for testers: run the backend **on your own PC** and point it at the
**shared Render Postgres** (`copup_db`). This gives the phone a backend on your
LAN with no cold starts, while everyone still shares the same data. The support
step is opening the Render dashboard to copy the connection string.

`brb-client` (Expo Go on your phone) → `brb-server` (your PC) → Render Postgres.

**Run order at a glance:** configure the `.env` files → make sure `copup_db` is up
→ start the backend → start the frontend → open it on the phone.

---

## TL;DR

1. Copy both `.env.example` files and fill them in — **Step 1**.
2. Copy the `copup_db` **External Database URL** into `brb-server/.env` — **Step 2**.
3. Backend: `uv sync` → `migrate` → `runserver 0.0.0.0:8000` — **Step 3**.
4. Frontend: `npx expo start`, then scan the QR — **Step 4**, **Step 5**.
5. Optional: review identity documents in **Django Admin** — **Step 6**.

---

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 22+ | `node --version` |
| Python | 3.12+ | `python --version` |
| uv | 0.12+ | `uv --version` |
| Expo Go (phone) | latest | App Store / Play Store |
| Render dashboard access | — | log in at render.com with your account |

No `bun` needed. This client uses `npm`; the backend uses `uv`.

---

## Step 1 — Configure the `.env` files first

Do this before starting anything. Both apps read `.env` on boot, so a wrong value
here means the phone silently fails to reach the backend.

### 1a. Backend — `brb-server/.env`

```bash
cd brb-server
Copy-Item .env.example .env        # PowerShell
```

Fill it in:

```bash
# From Step 2 (Render → copup_db → External Database URL)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

# Your PC's LAN IP (see "Appendix — Find your PC's LAN IP") so the phone is not rejected
ALLOWED_HOSTS=localhost,127.0.0.1,<YOUR-PC-LAN-IP>
```

- This file is gitignored. Keep the live password out of commits, PRs, and chat.
- SSL is automatic: `settings.py` sets `ssl_require=True` for any `postgres` URL.
- Emails print to the terminal (`EMAIL_BACKEND=console`), so the verification link
  shows up in the runserver window when you register.

### 1b. Frontend — `brb-client/.env`

```bash
cd brb-client
Copy-Item .env.example .env        # PowerShell
```

Fill it in:

```bash
EXPO_PUBLIC_API_URL=http://<YOUR-PC-LAN-IP>:8000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```

- `EXPO_PUBLIC_USE_MOCK=false` calls the real backend; keep it `true` to run the
  app with no server at all.
- From a **phone**, `localhost` means the phone itself, not your PC — always use
  your PC's LAN IP.
- Restart `expo start` after editing this file (env vars are read on boot).

---

## Step 2 — Prepare the database (Render Postgres `copup_db`)

1. Log in to the Render dashboard.
2. Go to **Databases** → the shared `copup_db` instance.
3. Open **Connections** and copy the **External Database URL**
   (`postgresql://USER:PASSWORD@HOST:5432/DBNAME`).
   - Copy the **External** string, not the Internal one — the Internal host only
     resolves from inside Render's network and will fail from your PC.
4. Put it in `brb-server/.env` as `DATABASE_URL` (Step 1a).
5. A suspended free Postgres can take a few seconds to accept its first
   connection. Running `migrate` in Step 3 wakes it.

**Shared database warning:** you are writing to `copup_db`, which the whole team
sees. Do **not** run the test suite against it — tests create and drop a whole
`test_copup_db`. For tests, override to SQLite for that command only:

```powershell
$env:DATABASE_URL="sqlite:///db.sqlite3"; uv run python manage.py test
Remove-Item Env:\DATABASE_URL
```

---

## Step 3 — Run the backend (`brb-server`)

```bash
cd brb-server
uv sync                             # install deps into .venv
uv run python manage.py migrate     # FULL migration, no app labels (D-14)
uv run python manage.py runserver 0.0.0.0:8000
```

- `0.0.0.0` lets phones on the same Wi-Fi reach the server; `localhost:8000`
  only works on the machine itself.
- The verification email prints in this terminal, so keep the window open while
  you test.

---

## Step 4 — Run the frontend (`brb-client`)

```bash
cd brb-client
npm install
npx expo start
```

- After editing `.env`, restart `expo start` so it picks up the new values.

---

## Step 5 — Open it on the phone (Expo Go)

1. Find your PC's LAN IP (see *Appendix — Find your PC's LAN IP*), then make sure
   it is in `ALLOWED_HOSTS` in `brb-server/.env`.
2. Confirm `brb-client/.env` uses that same IP in `EXPO_PUBLIC_API_URL`, and
   `EXPO_PUBLIC_USE_MOCK=false`.
3. Put the phone and PC on the **same Wi-Fi network**.
4. Start the backend bound to all interfaces:
   ```bash
   uv run python manage.py runserver 0.0.0.0:8000
   ```
5. Restart the frontend so it picks up `.env`, then scan the QR:
   ```bash
   npx expo start
   ```
6. Verify from the **phone's browser**: open
   `http://<YOUR-PC-LAN-IP>:8000/api/v1/auth/login/`. A `405` / DRF page means
   the phone can reach the backend (see *Troubleshooting* if it does not load).
7. Register / log in. Your account is stored in the shared `copup_db`, so the
   team can see it.

CORS does not apply to Expo Go; it only affects `expo start --web`.

---

## Step 6 — Django Admin (approve / reject identity documents)

The identity-verification review queue (CP-106) lives in **Django Admin**, not in
the app. Testers use it to approve or reject the IDs users submit.

1. **Create an admin account** (once). The username field is **email**, not a
   handle:
   ```bash
   cd brb-server
   uv run python manage.py createsuperuser
   # Email: admin@pup.edu.ph   (any address you'll remember)
   ```
   `createsuperuser` sets `is_staff=True` automatically — that flag is what the
   admin gates on (D-03), so no extra setup is needed.

2. **Open the admin** with the backend running
   (`uv run python manage.py runserver 0.0.0.0:8000`):
   - On your PC: `http://localhost:8000/admin/`
   - From the phone / another device: `http://<YOUR-PC-LAN-IP>:8000/admin/`
     (the same LAN IP you put in `ALLOWED_HOSTS`).

3. **Log in** with the email + password from step 1. You land on the admin index;
   the groups to use are **Identity documents** (the review queue) and, for
   auditing, **Admin access logs**.

4. **Review a submission.** Open **Identity documents** → tick one or more
   `pending` rows → choose an action from the dropdown → **Go**:
   - **Approve selected identity documents** — unlocks the user's
     `IsIdentityVerified` gate.
   - **Reject selected identity documents** — the next page asks for a
     **rejection reason** (required). Enter it and click **Reject**. The reason is
     sent to the user and they may resubmit.

**Notes:**

- `createsuperuser` writes to whatever `DATABASE_URL` points at. In the default
  setup that is the shared `copup_db`, so the admin account is visible to the
  whole team — coordinate before creating more than one.
- The admin's **Download Document** link opens a **JWT-only** API endpoint, so it
  returns `401` when clicked from a browser session. The admin pages themselves
  work fine; use the API with a Bearer token if you truly need the raw bytes.
- Every view, approval and rejection writes an `AdminAccessLog` row
  (CP-107 / FR14), which you can inspect under **Admin access logs**.
- If you only want a throwaway admin, point `DATABASE_URL` at SQLite for that
  session (see the SQLite override in Step 2) rather than touching `copup_db`.

---

## Step 7 — End-to-end smoke test

1. Backend up → open `http://localhost:8000/api/v1/auth/login/` on the PC and
   confirm it responds.
2. Frontend up (mock off) → register with a PUP webmail.
3. Verify via the printed link in the backend terminal.
4. Log in → you should land on the app's Home tab.
5. If it still mocks, double-check `.env` and restart `expo start`.

---

## Alternative — point the phone at the deployed Render backend

If you would rather not run the backend at all, point the phone directly at the
already-deployed service:

1. Render dashboard → the `brb-server` Web Service → copy its URL.
2. In `brb-client/.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api/v1
   EXPO_PUBLIC_USE_MOCK=false
   ```
3. Restart `npx expo start` and scan the QR.
4. The free service **sleeps when idle** and the first request can take 30–60 s.
   The app's HTTP timeout is **15 s** (`src/services/http.ts`), so requests sent
   before it wakes fail with the same generic message and leave no log. Wake it
   first by opening `https://<service>.onrender.com/api/v1/auth/login/` in a
   browser (or click **Restart** on the service) and wait for a response.

The Render service uses the same `copup_db`, so data matches the default setup.

---

## Troubleshooting — "Something went wrong. Please try again."

That message is the fallback in `extractApiError` (`src/services/http.ts`) and
means the app got **no response at all** — a network/connection problem, not a
backend rejection. That is why the backend log stays empty.

Checklist:

1. `.env` uses your **PC's LAN IP**, never `localhost` from a phone.
2. `expo start` was restarted after editing `.env`.
3. Phone and PC are on the same Wi-Fi.
4. Firewall allows inbound port 8000 on the PC.
5. `ALLOWED_HOSTS` includes the LAN IP you used.
6. Backend is running (`runserver 0.0.0.0:8000` still open in a terminal).
7. Phone browser can open `http://<YOUR-PC-LAN-IP>:8000/api/v1/auth/login/`.

If `manage.py migrate` fails to connect, re-check that you copied the
**External** URL — the Internal host only resolves from inside Render and will
fail from your PC. A suspended Render Postgres can also take a few seconds to
accept its first connection; the connection itself wakes it.

---

## Appendix — Find your PC's LAN IP

The phone reaches your PC by its address on your Wi-Fi network — **never**
`127.0.0.1`/`localhost`, which always means "this device".

**Windows (PowerShell):**
```powershell
ipconfig
```
Read the `IPv4 Address` under `Wireless LAN adapter Wi-Fi` (or `Ethernet`) —
whichever is on the same network as your phone (e.g. `192.168.1.25`). One-line
version:
```powershell
(Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object InterfaceAlias -NotMatch 'Loopback').IPAddress
```

**macOS:** System Settings → Network → Wi-Fi → Details, or:
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

Rules:
- Pick the address on the phone's network — usually `192.168.x.x` or `10.x.x.x`.
- Ignore `127.0.0.1`, `169.254.x.x`, and any WSL/VM/VPN adapter (e.g.
  `vEthernet`, `Docker`, `Tailscale`).
- Verify from the phone's browser: `http://<LAN-IP>:8000/api/v1/auth/login/`
  should respond.
- The IP can change when you reconnect to Wi-Fi — re-check it if the app stops
  connecting.

---

See `docs/BACKEND_CONNECTION.md` for the endpoint contract, payloads, and the
placeholders that still need work (identity fields, order endpoints, deep link,
refresh handling).
