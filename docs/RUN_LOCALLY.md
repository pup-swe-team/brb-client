# Run BRB (Frontend + Backend)

Default setup for testers: run the backend **on your own PC** and point it at the
**shared Render Postgres** (`copup_db`). This gives the phone a backend on your
LAN with no cold starts, while everyone still shares the same data.

`brb-client` (Expo Go on your phone) → `brb-server` (your PC) → Render Postgres.

---

## TL;DR

1. Put the shared `copup_db` **External Database URL** in `brb-server/.env` — **Step 1/2a**.
2. Copy both `.env.example` files and fill them in — **Step 2**.
3. Backend: `uv sync` → `migrate` → `runserver 0.0.0.0:8000` — **Step 3**.
4. Frontend: `npx expo start`, then scan the QR — **Step 4/5**.
5. Optional: review identity documents in the **Admin Portal** — **Step 6**.

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

## Step 1 — Prepare the database (Render Postgres `copup_db`)

The shared External URL is already saved in `brb-server/docs/CREDENTIALS.local`
(untracked). Copy its `postgresql://...` line into `brb-server/.env` as
`DATABASE_URL` (Step 2a). If that file is missing, get it from the Render
dashboard: **Databases** → `copup_db` → **Connections** → **External** URL.

- Use the **External** URL, never the **Internal** one — the Internal host only
  resolves inside Render's network and will fail from your PC.
- A suspended free Postgres takes a few seconds to accept its first connection;
  running `migrate` in Step 3 wakes it.

**Never run the test suite against `copup_db`** — the whole team shares it, and
tests create/drop a whole `test_copup_db`. Override to SQLite for that command
only:

```powershell
$env:DATABASE_URL="sqlite:///db.sqlite3"; uv run python manage.py test
Remove-Item Env:\DATABASE_URL
```

---

## Step 2 — Configure the `.env` files

Do this before starting anything. Both apps read `.env` on boot, so a wrong value
here means the phone silently fails to reach the backend.

### 2a. Backend — `brb-server/.env`

```bash
cd brb-server
Copy-Item .env.example .env        # PowerShell
```

Fill it in:

```bash
# From Step 1 (Render → copup_db → External Database URL)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

# Your PC's LAN IP (see "Appendix — Find your PC's LAN IP") so the phone is not rejected
ALLOWED_HOSTS=localhost,127.0.0.1,<YOUR-PC-LAN-IP>
```

- This file is gitignored. Keep the live password out of commits, PRs, and chat.
- SSL is automatic: `settings.py` sets `ssl_require=True` for any `postgres` URL.
- Emails print to the terminal (`EMAIL_BACKEND=console`), so the verification link
  shows up in the runserver window when you register.

**Identity-document encryption key (`IDENTITY_DOCUMENT_ENCRYPTION_KEY`) — usually skip:**

You only need this when running in **production mode** (`DEBUG=False`); in normal
dev (`DEBUG=True`) leave it empty and ID photos are saved as-is. In production a
missing key deliberately fails ID uploads/review closed rather than storing an
unencrypted photo. The key is **not** stored anywhere — you generate one:

```powershell
uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**The one rule:** the **same** key must be used everywhere that reads the **same**
database. If a key is already set (e.g. Render → `brb-server` → **Environment**),
copy that exact value; a different key makes existing photos unreadable
(`InvalidToken`). If none exists, generate one and share it with the team.

### 2b. Frontend — `brb-client/.env`

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
- From a **phone**, use your PC's LAN IP, never `localhost` (Appendix).
- Restart `expo start` after editing this file (env vars are read on boot).

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

1. Find your PC's LAN IP (Appendix) and put it in `ALLOWED_HOSTS`
   (`brb-server/.env`) and in `EXPO_PUBLIC_API_URL` (`brb-client/.env`,
   `EXPO_PUBLIC_USE_MOCK=false`).
2. Put the phone and PC on the **same Wi-Fi**.
3. Start the backend on all interfaces: `uv run python manage.py runserver 0.0.0.0:8000`
4. Restart the frontend and scan the QR: `npx expo start`
5. Confirm the phone can reach the backend by opening
   `http://<YOUR-PC-LAN-IP>:8000/api/v1/auth/login/` in the phone's browser — a
   `405` / DRF page means it works (see *Troubleshooting* if not).
6. Register / log in. Your account is stored in the shared `copup_db`.

CORS does not apply to Expo Go; it only affects `expo start --web`.

**Camera / photo permission on iOS (BE-BUG-0005):**

- The first time you tap **Take photo**, iOS shows a camera permission prompt —
  tap **Allow**, and only then does the camera open. Android 6+ shows the same
  prompt for the camera.
- If you previously tapped **Don't Allow**, iOS will **not** re-prompt. Enable it
  in the system Settings, then come back and tap the button again:
  - **Standalone app build:** Settings → *BRB* → **Camera** (and **Photos**
    for *Choose photo*).
  - **Expo Go:** Settings → *Expo Go* → **Camera** / **Photos**.
- With no permission, the app now shows a clear message under the upload card
  instead of crashing.
- In Expo Go nothing else is needed — the prompt uses Expo Go's own descriptions.
  The camera/photo strings in `app.json` (the `expo-image-picker` plugin) only
  apply to a **native build** (`npx expo run:ios` / `eas build`): they land in
  Info.plist at build time, so rebuild after editing `app.json`.

---

## Step 6 — Admin Portal (approve / reject identity documents)

Two admin interfaces exist, and the difference matters:

| Path | What it is | Styling |
|---|---|---|
| **`/portal/`** | **This is the Admin Portal** (BE-BUG-0006) — the team's custom, styled review UI (CoPUPAdmin). Sign-in → dashboard → verification queue → review → approve/reject. | Styled (custom CSS). **Test this one.** |
| **`/admin/`** | Django's **default admin** that ships with the framework — general CRUD (users, lookup tables), still used for maintenance. | Plain default Django styling (this is the "old" look). |

Testers approve/reject the IDs users submit in the **Admin Portal** at `/portal/`.
It is a browser screen, so testers open it on a PC or phone browser — there is
no admin UI inside the app.

1. **Create an admin account** (once). The username field is **email**, not a
   handle:
   ```bash
   cd brb-server
   uv run python manage.py createsuperuser
   # Email: admin@pup.edu.ph   (must end in @pup.edu.ph)
   ```
   `createsuperuser` sets `is_staff=True` automatically — that flag is what the
   admin gates on (D-03), so no extra setup is needed. Admin accounts may **only**
   use `@pup.edu.ph`; anything else (e.g. `@gmail.com`) is refused with an error.

2. **Open the Admin Portal** with the backend running
   (`uv run python manage.py runserver 0.0.0.0:8000`):
   - On your PC: `http://localhost:8000/portal/`
   - From the phone / another device: `http://<YOUR-PC-LAN-IP>:8000/portal/`
     (the same LAN IP you put in `ALLOWED_HOSTS`).

3. **Log in** with the email + password from step 1. You land on the **Dashboard**;
   open **Verification Queue** from the sidebar to see pending submissions.

4. **Review a submission.** Pending tab → open a member's **Review** page → **Approve**
   or **Reject** (a rejection reason is required). The status updates the member's
   profile and the user gets a notification. (The old default Django admin at
   `/admin/` also has a bulk **Identity documents** action — the portal and Admin
   write to the same audit trail.)

**Notes:**

- `createsuperuser` writes to whatever `DATABASE_URL` points at — by default the
  shared `copup_db`, so the admin account is visible to the whole team;
  coordinate before creating more than one. For a throwaway admin, point
  `DATABASE_URL` at SQLite for that session (Step 1) instead.
- Every view/download/approval/rejection writes an `AdminAccessLog` row
  (CP-107 / FR14), visible under **Admin access logs**. The **Download Document**
  link works from your browser session — the endpoint accepts both JWT and Django
  Admin session auth (D-18).

**Key facts:**

- **Same account, same data.** It gates on the same `is_staff` flag, so the
  `createsuperuser` account from Step 6 signs in there too; a regular member is
  refused ("Only administrator accounts can sign in here.").
- **Same flow, same audit trail.** Approving/rejecting calls the same service as
  the `/admin/` action, so the notification, email and `AdminAccessLog` entries
  are identical; merely opening a review page writes a `view` log row.
- The sidebar shows the other admin areas (Users, Reports, Content Moderation,
  System Settings, Audit Log, …) as **planned for a later sprint** — only
  Dashboard and Verification Queue are wired up so far.

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

Instead of running the backend locally, point the phone at the already-deployed
service (same `copup_db`, so data matches):

1. Render dashboard → the `brb-server` Web Service → copy its URL.
2. In `brb-client/.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api/v1
   EXPO_PUBLIC_USE_MOCK=false
   ```
3. Restart `npx expo start` and scan the QR.
4. The free service **sleeps when idle**: the first request can take 30–60 s, but
   the app's HTTP timeout is **15 s** (`src/services/http.ts`). Wake it first by
   opening `https://<service>.onrender.com/api/v1/auth/login/` in a browser (or
   clicking **Restart** on the service) and waiting for a response.

**Note:** a *suspended* service answers every request with `503`. Check the
`x-render-routing` response header — `suspend-by-user` means someone suspended it
in the dashboard; resume it there. (A suspended Postgres is a different instance
and only affects DB connections, not the web service's HTTP responses.) If ID
uploads fail on the deployed service, its
`IDENTITY_DOCUMENT_ENCRYPTION_KEY` env var is missing — see Step 2a.

---

## Troubleshooting — "Something went wrong. Please try again."

That message is the fallback in `extractApiError` (`src/services/http.ts`) and
means the app got **no response at all** — a network/connection problem, not a
backend rejection. That is why the backend log stays empty.

Checklist:

1. `.env` uses your **PC's LAN IP**, never `localhost` from a phone (Appendix).
2. `expo start` was restarted after editing `.env`.
3. Phone and PC are on the same Wi-Fi.
4. Firewall allows inbound port 8000 on the PC.
5. `ALLOWED_HOSTS` includes the LAN IP you used.
6. Backend is running (`runserver 0.0.0.0:8000` still open in a terminal).
7. Phone browser can open `http://<YOUR-PC-LAN-IP>:8000/api/v1/auth/login/`.

If `manage.py migrate` fails to connect, re-check the **External** URL (Step 1);
a suspended Render Postgres also takes a few seconds to accept its first
connection.

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
placeholders that still need work (my-listings feed, order/chat endpoints, deep
links, and the `/auth/me/` bio/address echo gap).
