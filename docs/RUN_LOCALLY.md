# Running CoPUP Locally (Frontend + Backend)

A streamlined guide for running, developing, and performing manual QA testing on CoPUP across the backend (`brb-server`) and frontend (`brb-client`).

---

## 1. Quick Setup (First-Time or Fresh Clone)

### A. Backend (`brb-server`)
```powershell
cd brb-server

# 1. Install dependencies with uv
uv sync

# 2. Create your local .env configuration
Copy-Item .env.example .env

# 3. Run database migrations
uv run python manage.py migrate

# 4. Populate test catalogue (Categories, Locations, 12 Demo Lenders & 35+ Listings)
uv run python manage.py seed_demo_data --demo
```

### B. Frontend (`brb-client`)
```powershell
cd brb-client

# 1. Install Node dependencies
npm install

# 2. Create your local .env configuration
Copy-Item .env.example .env
```

---

## 2. Environment Configuration (`.env`)

Configure the `.env` files based on your testing setup:

### Frontend (`brb-client/.env`)
```ini
# Option 1: Local Backend (Web Browser QA)
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1

# Option 2: Local Backend (Android Emulator)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1

# Option 3: Local Backend (Physical Phone over Wi-Fi)
# EXPO_PUBLIC_API_URL=http://<YOUR-PC-LAN-IP>:8000/api/v1

# Option 4: Deployed Render Backend (No local backend needed!)
# EXPO_PUBLIC_API_URL=https://brb-server.onrender.com/api/v1

EXPO_PUBLIC_USE_MOCK=false
```
> **Tip for Physical Phones:** Find your PC's IP using `ipconfig` (IPv4 Address, e.g., `192.168.100.194`). Your phone and PC must be on the **same Wi-Fi network**.

### Backend (`brb-server/.env`)
```ini
DEBUG=True

# Option A: Local SQLite (Fastest for isolated dev)
DATABASE_URL=sqlite:///db.sqlite3

# Option B: Shared Render Cloud PostgreSQL (Syncs live with team)
# DATABASE_URL=postgresql://copup_db_v2_user:4RbN7r2JbdYT6kn2AsKlUf8GDCkXAlNM@dpg-dbm7meec6qcc7387nqs0-a.singapore-postgres.render.com/copup_db_v2

ALLOWED_HOSTS=localhost,127.0.0.1,<YOUR-PC-LAN-IP>,.onrender.com
JWT_SECRET=your-jwt-secret-key-at-least-32-bytes-long
```

---

## 3. Daily Run Commands

### Terminal 1: Backend (`brb-server`)
```powershell
cd brb-server
uv run python manage.py runserver 0.0.0.0:8000
```
- API Base URL: `http://localhost:8000/api/v1`
- **Email Verification:** Outgoing registration and password reset emails print directly into this terminal window.

### Terminal 2: Frontend (`brb-client`)
```powershell
cd brb-client
npx expo start
```
- **Web Browser QA:** Press `w` in terminal to open `http://localhost:8081`.
- **Android Emulator QA:** Press `a` in terminal with an emulator running.
- **Physical Device QA (Expo Go):** Scan the terminal QR code with the Expo Go app (Android) or Camera (iOS).

*(Alternative: You can test the frontend entirely against the live Render backend by setting `EXPO_PUBLIC_API_URL=https://brb-server.onrender.com/api/v1`, skipping Terminal 1).*

---

## 4. QA Test Accounts & Credentials

### A. Demo Lenders & Listings
Populated automatically via `uv run python manage.py seed_demo_data --demo`:
- **Emails:** `demo.lender01@iskolarngbayan.pup.edu.ph` to `demo.lender12@iskolarngbayan.pup.edu.ph`
- **Password:** `DemoLender123!`
- *(To reset demo data cleanly: `uv run python manage.py seed_demo_data --demo --reset`)*

### B. Admin Portal Account
Required to review identity documents, manage unreturned items, and inspect disputes:
```powershell
cd brb-server
uv run python manage.py createsuperuser
```
> **Rule:** The admin email **must use `@pup.edu.ph`** (e.g., `admin@pup.edu.ph`).
- **Staff Verification Queue:** `http://localhost:8000/portal/`
- **Django Admin Console:** `http://localhost:8000/admin/` (or `https://brb-server.onrender.com/admin/`)

---

## 5. Manual QA Testing Workflows (Sprint 3 Integrated)

### A. Calendar Availability & Blocked Dates (`FE-BUG-3001`)
1. Open any listing as a Borrower.
2. The calendar displays **greyed-out / unavailable dates** for:
   - Dates the lender manually blocked.
   - Dates with confirmed, active, or overdue orders.
3. The app prevents selecting or booking overlapping reserved dates.

### B. Borrow Request & Acceptance (`CP-501`, `CP-502`)
1. As a verified Borrower, submit a borrow request for available dates.
2. **Borrowing Limit Check (`FE-BUG-3005`):** If you attempt to borrow with >3 active orders or on overlapping dates, an explicit modal alerts you.
3. Switch to the Lender account ➔ **Lender Dashboard ➔ Incoming Requests** ➔ tap **"Accept"** (order moves to `Confirmed`) or **"Decline"**.

### C. Handover Flow & Lockout Persistence (`FE-BUG-3003`, `FE-BUG-3004`)
1. Open the Confirmed order.
2. **Lender:** Taps "Handover Code" to generate a 6-digit OTP (valid for 3 hours).
   - **Persistent Timer:** Navigating away or refreshing does **not** reset the timer back to 3 hours.
3. **Borrower:** Taps "Enter Handover Code".
   - **Lockout Test:** Entering wrong codes 3 times locks the user out for 15 minutes with a live countdown (`MM:SS`). Refreshing or leaving the page preserves the lockout.
4. Correct code entry transitions the order to **`Active`**.

### D. Return Flow, Damage Reports & Disputes (`FE-BUG-3005`)
1. When returning an item, open the Active order.
2. **Borrower:** Generates the 6-digit Return OTP.
3. **Lender:** Inputs the return code:
   - **No Damage:** Order transitions to **`Completed`**.
   - **Damage Flagged:** Check "Report damage", enter description, and submit.
   - **Evidence Upload:** Attach photo/video evidence. Order status transitions to **`Disputed`**.
4. **Admin Review:** Log into `AdminCaseScreen` or `GET /api/v1/disputes/` to view the case dossier, photos, borrower/lender details, and resolve or escalate.

### E. Account Deactivation Protection (`FE-BUG-3006`)
1. Navigate to **Profile ➔ Deactivate Account**.
2. If you have active or pending borrow/lend orders, deactivation is blocked with an explicit error alert listing unsettled obligations.

### F. Automatic Order Expiration & Overdue Statuses (`FE-BUG-3007`)
- Requests unanswered after 48 hours automatically display **`Expired`**.
- Items kept past their end date automatically display **`Overdue`**.

---

## 6. Troubleshooting Checklist

| Issue | Solution |
|---|---|
| **"Network Error" / "Something went wrong"** | Check that `brb-server` is running, your phone and PC share the same Wi-Fi, and the IP in `brb-client/.env` matches `ipconfig`. |
| **Verification email not arriving** | Emails are printed to the console. Look at the terminal running `runserver` to copy the verification link. |
| **Android Emulator cannot connect to localhost** | Use `http://10.0.2.2:8000/api/v1` instead of `localhost` in `brb-client/.env`. |
| **Database connection error** | Verify `DATABASE_URL` in `brb-server/.env`. For cloud, ensure `copup_db_v2` is active; for local, use `sqlite:///db.sqlite3`. |
| **Expo cache stale / changes not showing** | Press `r` in the Expo terminal to reload, or restart with `npx expo start -c` to clear the bundler cache. |
| **TypeScript check in client** | Run `node node_modules/typescript/bin/tsc --noEmit` in `brb-client` to verify static typing. |
