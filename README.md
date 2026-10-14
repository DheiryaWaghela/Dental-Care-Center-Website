# Dental Care Center

Existing React + TypeScript + Vite frontend with a Node.js + Express + MySQL/MariaDB API.

## Main folders

- `frontend/` — React website and Admin Panel.
- `backend/` — the existing Express API, image uploads, and server-verified Admin sign-in.
- `database/schema.sql` — full schema for a fresh setup.
- `database/migrations/001_prescription_system.sql` — idempotent migration for patient, medicine, and prescription tables in an existing database.

## First-time Windows/XAMPP setup

1. Start **Apache** and **MySQL** in XAMPP if you use phpMyAdmin; for the API, MySQL is the important service.
2. In this project folder, run the prescription migration against the existing `dental_care_center` database:

   ```cmd
   "C:\xampp\mysql\bin\mysql.exe" -u root dental_care_center < database\migrations\001_prescription_system.sql
   ```

   This assumes the XAMPP `root` account has a blank password, as in the supplied local setup. If yours has a password, add `-p` after `root` and enter it when prompted.
3. Create `backend\.env` from `backend\.env.example` if it does not exist. Keep `DB_PASSWORD=` empty only when that is how your local MariaDB account is configured.
4. Start the API in one terminal:

   ```cmd
   cd backend
   npm install
   npm start
   ```
5. Start the frontend in another terminal:

   ```cmd
   cd frontend
   npm install
   npm run dev
   ```

## Admin credentials and sensitive records

The local development defaults are `admin` / `dental@123`, unless changed in `backend/.env` using `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Change these and replace `SESSION_SECRET` with a long random secret before storing real patient records. Do not publish `.env` or send its contents to anyone. Prescriptions, patients, appointments-management reads, photo uploads, and Admin write endpoints require a server-issued bearer token. Public clinic content and public appointment submission remain accessible without sign-in.

## New doctor-picker behaviour

The Preferred Dentist control is now an accessible custom dropdown. On desktop, hover a dentist to display the available profile information. On mobile, tap **Show More** to open their profile card. It uses the current database dentist fields only; it does not invent ratings, reviews, registrations, or per-doctor service links not present in the database.

## Prescription management

After signing in, open **Prescriptions** in the Admin sidebar. Search for a patient by name, phone, or email, or register a new patient. Phone/email are normalized and unique; if an identity collision is detected, the API returns the matching records and does not merge them. Prescriptions and medicine rows are written in a MySQL transaction, assigned a unique prescription number, and then treated as immutable. Patient search and prescription APIs are protected by the server-issued Admin session.

The medicine catalogue starts empty by design. Add verified catalogue entries in the Medicine Catalogue section; this is a suggestion list, not a prescribing recommendation. Doctors must enter and verify diagnoses, clinical observations, doses, frequency, duration, and instructions themselves.

The prescription editor supports HTML preview/printing and a generated PDF download. Share uses the Web Share API for a PDF file where the browser supports file sharing; otherwise the app downloads the PDF for manual sharing. Print uses the browser's print dialog; select A4 or **Save as PDF** as needed.

## Logo

An original vector logo is stored at `frontend/public/images/logo/dental-care-center-logo.svg`, with a square mark at `frontend/public/images/logo/dental-care-center-mark.svg`. These appear in the navbar/footer and prescription document. The existing `/images/hero/hero.png` path is unchanged.

## Database verification

Check the database after applying the migration:

```sql
USE dental_care_center;
SHOW TABLES;
```

In addition to the existing `appointments`, `dentists`, `gallery`, `reviews`, and `services` tables, the prescription feature requires `patients`, `medicines`, `prescriptions`, and `prescription_medicines`. `GET http://localhost:4000/api/health` checks database connectivity. No live MySQL server is available in the build environment, so real connection verification must be done on the machine running XAMPP.
