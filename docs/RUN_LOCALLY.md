# Running CoPUP Locally (Frontend + Backend)

A streamlined guide for running and performing manual QA testing on CoPUP across the backend (`brb-server`) and frontend (`brb-client`).

---

## 1. First-Time Setup (New QA Testers / Fresh Clones)

If setting up the project for the first time on a machine:

### Backend (`brb-server`)
```powershell
cd brb-server

# 1. Install Python dependencies (using uv)
uv sync

# 2. Create your local .env configuration
Copy-Item .env.example .env

# 3. Apply database migrations
.venv\Scripts\python.exe manage.py migrate
```

### Frontend (`brb-client`)
```powershell
cd brb-client

# 1. Install Node dependencies
npm install

# 2. Create your local .env configuration
Copy-Item .env.example .env
```

---

## 2. Daily Run Commands

Once dependencies are installed, you only need to run the servers:

### Terminal 1: Backend (`brb-server`)
```powershell
cd brb-server
.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```
*(Or with `uv`: `uv run python manage.py runserver 0.0.0.0:8000`)*

- The server runs at `http://localhost:8000` (or `http://<YOUR-LAN-IP>:8000`).
- Verification emails print directly into this terminal window.

### Terminal 2: Frontend (`brb-client`)
```powershell
cd brb-client
npx expo start
```

- **Web Browser QA:** Press `w` in the terminal to open the web client at `http://localhost:8081`.
- **Mobile Device QA (Expo Go):** Make sure your phone and PC are connected to the **same Wi-Fi network**, then scan the QR code with the Expo Go app (Android) or Camera app (iOS).

---

## 3. Environment Configuration (.env)

Each tester must configure their local `.env` files:

### Backend (`brb-server/.env`)
```ini
DEBUG=True
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME  # Shared Render Postgres or sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1,<YOUR-PC-LAN-IP>
JWT_SECRET=your-jwt-secret-key-at-least-32-bytes
```

### Frontend (`brb-client/.env`)
```ini
EXPO_PUBLIC_API_URL=http://<YOUR-PC-LAN-IP>:8000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```
> **Tip for Phone Testing:** Find your LAN IP using `ipconfig` (IPv4 address under Wi-Fi/Ethernet, e.g., `192.168.100.194`). Use this IP in both `.env` files so your phone can communicate with your PC backend.

---

## 4. Admin Portal Access

The Admin Portal is used to review identity documents, manage unreturned cases, and supervise users.

1. **Create an Admin Account (once):**
   ```powershell
   cd brb-server
   .venv\Scripts\python.exe manage.py createsuperuser
   ```
   *Email must use the `@pup.edu.ph` domain (e.g., `admin@pup.edu.ph`).*

2. **Open the Portal:**
   - URL: `http://localhost:8000/portal/`
   - Sign in with your admin credentials to access the Verification Queue and Dashboard.
   - Standard Django admin is also available at `http://localhost:8000/admin/`.

---

## 5. Manual QA Testing Flow (Sprint 3)

### A. Borrower Flow & Verification
1. **Register** using a PUP webmail (`@iskolarngbayan.pup.edu.ph` for students, `@pup.edu.ph` for faculty/staff).
2. Copy the **email verification link** printed in the backend terminal and open it in your browser.
3. **Log in** ➔ lands on the **Borrower Dashboard** showing your borrowing limit (`0/3 items held`) and empty order sections.
4. **Identity Verification:** Go to Profile ➔ Verify Identity ➔ Upload ID document with consent checked. Approve it via the Admin Portal (`/portal/`) to enable borrowing.

### B. Lender Flow & Listing Management
1. In Profile, tap **"Apply for Lender Role"** ➔ Lender status is granted immediately.
2. The **Dashboard Switch** appears, allowing you to toggle between **Borrower** and **Lender** views.
3. Tap **"Create Listing"** (or "+" tab) to create an available item with pickup location and date range.
4. Manage listings via **Lender Dashboard ➔ My Listings** (edit fields, deactivate, or delete).

### C. Borrow Request & Acceptance (CP-501, CP-502)
1. As Borrower, open the listing details and tap **"Request to Borrow"**. Select dates within the availability window.
2. The order appears under **"Requested"** on the Borrower Dashboard.
3. Switch to the Lender account ➔ open **Lender Dashboard ➔ Incoming Requests** ➔ tap **"Accept"** (order becomes `Confirmed`) or **"Decline"**.

### D. Handover Code Verification (CP-504)
1. Open the Confirmed order.
2. **Lender:** Taps "Handover Code" to generate a 6-digit OTP (valid for 3 hours, with live countdown).
3. **Borrower:** Taps "Enter Handover Code", inputs the 6 digits, and confirms.
4. Order status transitions to **`Active`**.

### E. Return Code & Damage Reporting (CP-505)
1. When return time arrives, open the Active order.
2. **Borrower:** Taps "Return Code" to generate a 6-digit return OTP.
3. **Lender:** Taps "Confirm Return" and inputs the code:
   - **No Damage:** Order immediately transitions to **`Completed`**.
   - **Damage Flagged:** Check "Report damage / missing item", enter a description, and confirm. Order transitions to **`Disputed`**.

### F. Order Cancellation (CP-503)
- Either party can cancel a `Requested` or `Confirmed` order before handover by tapping **"Cancel Order"** and selecting a reason.
- Active orders cannot be cancelled.

---

## 6. Troubleshooting Checklist

| Issue | Solution |
|---|---|
| **"Something went wrong. Please try again."** | The frontend cannot reach the backend. Check that the backend is running (`runserver 0.0.0.0:8000`), both devices share the same Wi-Fi, and the IP in `brb-client/.env` matches `ipconfig`. |
| **Email verification link not arriving** | Emails are captured locally. Check the terminal running `runserver` to copy the verification link. |
| **Database connection error on start** | Ensure `copup_db` on Render is active, or use local SQLite (`DATABASE_URL=sqlite:///db.sqlite3` in `brb-server/.env`). |
| **Changes not reflecting in Expo** | Press `r` in the Expo terminal to reload, or restart with `npx expo start -c` to clear the bundler cache. |
