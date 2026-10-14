# Dental Care Center API

Node.js + Express + MySQL/MariaDB API for the existing Dental Care Center frontend.

## Run locally

1. Start MySQL/MariaDB from XAMPP.
2. Create `backend/.env` from `.env.example`.
3. Keep `DB_PASSWORD=` empty only if the local database account actually has no password.
4. Run `npm install` and `npm start`.
5. The API defaults to `http://localhost:4000`.

## Admin authentication

`POST /api/auth/login` verifies the configured `ADMIN_USERNAME` and `ADMIN_PASSWORD` and returns an eight-hour signed bearer token. Patient, medicine, prescription, appointment-management, upload and Admin write endpoints validate this token on the server. Set a long random `SESSION_SECRET` and change the example development password before storing any real patient data. The existing project still uses a single shared Admin account, not individual doctor accounts/roles.

## Prescription endpoints (Admin token required)

- `GET /api/patients/search?q=...` — patient search by name, phone, or email.
- `POST /api/patients` — register a patient; duplicate phone/email matches are rejected or returned for conflict resolution.
- `PUT /api/patients/:id` — update permitted patient details.
- `GET /api/patients/:id/prescriptions` — the selected patient's history.
- `GET /api/prescriptions/:id` — one prescription and its medicine rows.
- `POST /api/prescriptions` — creates a prescription and medicine rows in a single transaction.
- `GET /api/medicines?q=...` — active medicine catalogue / suggestions.
- `POST /api/medicines`, `PUT /api/medicines/:id`, `DELETE /api/medicines/:id` — manage/deactivate catalogue entries.

Finalized prescriptions have no update/delete endpoint, preserving the saved record and medicine snapshots.

## Database migration

For an existing database, run from the project root in Windows CMD:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root dental_care_center < database\migrations\001_prescription_system.sql
```

Add `-p` if the MariaDB root account has a password. `database/schema.sql` also includes the prescription tables for a new install. The medicine catalogue is deliberately empty: enter verified medicines from the Admin Panel.

## Image uploads

Admin photo management supports local file upload and drag-and-drop. Images are validated and stored in `backend/uploads/` and served at `/uploads/...`; upload requests require an Admin token.
