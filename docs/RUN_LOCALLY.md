# Run BRB (Frontend + Backend)

Default setup for testers: run the backend **on your own PC** and point it at the
**shared Render Postgres** (`copup_db`). This gives the phone a backend on your
LAN with no cold starts, while everyone still shares the same data. The support
step is opening the Render dashboard to copy the connection string.

`brb-client` (Expo Go on your phone) → `brb-server` (your PC) → Render Postgres.

---

## TL;DR

1. Render dashboard → **Databases** → `copup_db` → **Connections** → copy the
   **External Database URL**.
2. In `brb-server/.env`: set `DATABASE_URL` to that URL and add your PC's LAN IP
   to `ALLOWED_HOSTS`.
3. `uv sync` → `uv run python manage.py migrate` →
   `uv run python manage.py runserver 0.0.0.0:8000`.
4. In `brb-client/.env`:
   ```bash
   EXPO_PUBLIC_API_URL=http://<YOUR-PC-LAN-IP>:8000/api/v1
   EXPO_PUBLIC_USE_MOCK=false
   ```
5. `npx expo start` → scan the QR with Expo Go.

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

## 1. Get the Render Postgres connection string

1. Log in to the Render dashboard (credentials required).
2. Go to **Databases** → the shared `copup_db` instance.
3. Open **Connections** and copy the **External Database URL**
   (`postgresql://USER:PASSWORD@HOST:5432/DBNAME`).
   - Copy the **External** string, not the Internal one — the Internal host only
     resolves from inside Render's network and will fail from your PC.
4. This URL contains a live password. Put it only in `brb-server/.env` (which is
   gitignored) and never in a commit, PR, or chat.

SSL is automatic: `settings.py` sets `ssl_require=True` for any `postgres` URL,
so no extra flags are needed.

---

## 2. Backend (`brb-server`) on your PC, using `copup_db`

```bash
cd brb-server
Copy-Item .env.example .env        # PowerShell
```

Edit `.env`:

```bash
# External Database URL copied in step 1
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

# Add your PC's LAN IP (see below) so the phone is not rejected
ALLOWED_HOSTS=localhost,127.0.0.1,<YOUR-PC-LAN-IP>
```

Then install, migrate, and run:

```bash
uv sync                             # install deps into .venv
uv run python manage.py migrate     # FULL migration, no app labels (D-14)
uv run python manage.py runserver 0.0.0.0:8000
```

- `0.0.0.0` lets phones on the same Wi-Fi reach the server; `localhost:8000`
  only works on the machine itself.
- Emails print to the terminal (`EMAIL_BACKEND=console`), so the verification
  link is in the runserver window when you register.
- **Find your PC's LAN IP** for `ALLOWED_HOSTS` and the phone — see
  *Find your PC's LAN IP* below.
- **Shared database warning:** you are writing to `copup_db`, which the whole
  team sees. Do **not** run the test suite against it — tests create/drop a
  `test_copup_db`. For tests, override to SQLite for that command only:
  ```powershell
  $env:DATABASE_URL="sqlite:///db.sqlite3"; uv run python manage.py test
  Remove-Item Env:\DATABASE_URL
  ```

### Find your PC's LAN IP

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

## 3. Frontend (`brb-client`)

```bash
cd brb-client
npm install
Copy-Item .env.example .env        # PowerShell
```

Edit `.env` before starting:

```bash
# .env
EXPO_PUBLIC_API_URL=http://<YOUR-PC-LAN-IP>:8000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```

Then start the dev server and scan the QR with Expo Go:

```bash
npx expo start
```

**On a physical phone running Expo Go, `localhost` is the phone itself, not your
PC.** If you leave the default `http://localhost:8000/api/v1` (the value in
`.env.example`), the app can never reach the backend: every call fails with
`Something went wrong. Please try again.`, and **nothing appears in the backend
log** because the request never arrives.

- `EXPO_PUBLIC_USE_MOCK=false` calls the real backend; keep it `true` to run the
  app without any server.
- After editing `.env`, restart `expo start` (env vars are read on boot).

---

## 4. Phone + Expo Go: exact steps

1. Find your PC's LAN IP (see *Find your PC's LAN IP* in §2), then add it to
   `ALLOWED_HOSTS` in `brb-server/.env`.
2. In `brb-client/.env`, set `EXPO_PUBLIC_API_URL` to that same IP:
   ```bash
   EXPO_PUBLIC_API_URL=http://<YOUR-PC-LAN-IP>:8000/api/v1
   EXPO_PUBLIC_USE_MOCK=false
   ```
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
   the phone can reach the backend (see §5 if it does not load).
7. Register / log in. Your account is stored in the shared `copup_db`, so the
   team can see it.

CORS does not apply to Expo Go; it only affects `expo start --web`.

---

## 5. "Something went wrong. Please try again."

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

## 6. Alternative: call the deployed Render backend instead

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

## 7. End-to-end smoke test

1. Backend up → open `http://localhost:8000/api/v1/auth/login/` on the PC and
   confirm it responds.
2. Frontend up (mock off) → Register with a PUP webmail.
3. Verify via the printed link in the backend terminal.
4. Log in → you should land on the app's Home tab.
5. If it still mocks, double-check `.env` and restart `expo start`.

See `docs/BACKEND_CONNECTION.md` for the endpoint contract, payloads, and the
placeholders that still need work (identity fields, order endpoints, deep link,
refresh handling).
