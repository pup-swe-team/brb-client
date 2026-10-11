# Run BRB Locally (Frontend + Backend)

How to run both the backend (`brb-server`) and the mobile app (`brb-client`)
on one machine and connect them.

---

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 22+ | `node --version` |
| Python | 3.12+ | `python --version` |
| uv | 0.12+ | `uv --version` |
| Expo Go (phone) | latest | App Store / Play Store |

No `bun` needed. This client uses `npm`; the backend uses `uv`.

---

## 1. Backend (`brb-server`)

```bash
cd brb-server
Copy-Item .env.example .env        # PowerShell
uv sync                             # install deps into .venv
uv run python manage.py migrate
uv run python manage.py runserver 0.0.0.0:8000
```

- `0.0.0.0` lets phones on the same Wi-Fi reach the server;
  `localhost:8000` only works on the machine itself.
- Emails print to the terminal (`EMAIL_BACKEND=console` in `.env.example`),
  so the verification link is in the runserver window when you register.
- Local dev database: set `DATABASE_URL=sqlite:///db.sqlite3` in `.env` to
  avoid touching the shared Render Postgres.
- API base (after running): `http://localhost:8000/api/v1/`
- `ALLOWED_HOSTS` in `.env` must include your LAN IP or the phone will get a
  `400 Invalid HTTP_HOST`.

---

## 2. Frontend (`brb-client`)

```bash
cd brb-client
npm install
Copy-Item .env.example .env        # PowerShell
npx expo start
```

Scan the QR with Expo Go.

### The `.env` URL is the part that decides connection

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```

- **Android emulator** (same machine): `http://10.0.2.2:8000/api/v1`
  (`10.0.2.2` = the host machine from inside the emulator).
- **Physical device**: replace `localhost` with your machine's LAN IP, e.g.
  `http://192.168.1.25:8000/api/v1`, phone and PC on the **same Wi-Fi**.
- `EXPO_PUBLIC_USE_MOCK=false` calls the real backend; keep it `true` to run
  the app without the server.
- After editing `.env`, restart `expo start` (env vars are read on boot).

**Mobile connection checklist** (when register/login fail with network errors):
1. Firewall allows inbound port 8000.
2. `ALLOWED_HOSTS` includes the IP you used.
3. Phone can open `http://<LAN-IP>:8000/api/v1/` in its browser.

---

## 3. End-to-end smoke test

1. Backend up → open `http://localhost:8000/api/v1/`.
2. Frontend up (mock off) → Register with a PUP webmail.
3. Verify via the printed link in the backend terminal.
4. Log in → you should land on the app's Home tab.
5. If it still mocks, double-check `.env` and restart `expo start`.

See `docs/BACKEND_CONNECTION.md` for endpoint contract, payloads, and the
placeholders that still need work (identity fields, order endpoints, deep link,
refresh handling).