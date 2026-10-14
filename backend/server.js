import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import crypto from "node:crypto";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir, { maxAge: "7d" }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, "-").slice(0, 60) || "image";
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)) return cb(new Error("Only image files are allowed."));
    cb(null, true);
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "dental_care_center",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return MySQL DATE values as YYYY-MM-DD strings so browser date inputs and
  // prescription documents do not suffer from timezone conversion issues.
  dateStrings: true,
});

// Admin authentication for management operations and sensitive patient/prescription records.
// Configure ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET in backend/.env before deployment.
const isProduction = process.env.NODE_ENV === "production";
const configuredSessionSecret = String(process.env.SESSION_SECRET || "").trim();
const hasStrongSessionSecret = configuredSessionSecret.length >= 32 && !/replace-this|change-me|your-secret/i.test(configuredSessionSecret);
const configuredAdminPassword = String(process.env.ADMIN_PASSWORD || "");
if (isProduction && (!process.env.ADMIN_USERNAME || !configuredAdminPassword || configuredAdminPassword === "dental@123" || !hasStrongSessionSecret)) {
  throw new Error("Production requires custom ADMIN_USERNAME, a non-default ADMIN_PASSWORD, and a strong SESSION_SECRET in backend/.env.");
}
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = configuredAdminPassword || "dental@123";
const SESSION_SECRET = hasStrongSessionSecret ? configuredSessionSecret : crypto.randomBytes(48).toString("hex");
if (!hasStrongSessionSecret) console.warn("SESSION_SECRET is not set to a strong value; a random per-run secret is being used. Set a strong SESSION_SECRET before storing real patient records.");
if (ADMIN_PASSWORD === "dental@123") console.warn("Using the development Admin password. Set a private ADMIN_PASSWORD before using this system with real patient data.");
const failedLogins = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const timingSafeStringEqual = (a, b) => {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
};
const signToken = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
};
function requireAdmin(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !token.includes(".")) return res.status(401).json({ error: "Sign in to the Admin Panel to access this information." });
  try {
    const [encoded, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
    if (!timingSafeStringEqual(signature, expected)) return res.status(401).json({ error: "Your session is invalid. Please sign in again." });
    const claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!claims.sub || !claims.exp || claims.exp < Date.now()) return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    req.auth = { username: String(claims.sub) };
    next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid. Please sign in again." });
  }
}

const normalizePhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return digits;
};
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const isValidDateValue = (value) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const publicPatient = (row) => ({
  id: row.id, full_name: row.full_name, phone: row.phone, email: row.email,
  date_of_birth: row.date_of_birth, gender: row.gender,
  medical_history: row.medical_history, allergies: row.allergies,
  created_at: row.created_at, updated_at: row.updated_at,
});

const resources = {
  dentists: { table: "dentists", fields: ["name","image","qualification","specialization","experience","description","timing"] },
  services: { table: "services", fields: ["name","description","category","image_icon","price","bg"] },
  gallery: { table: "gallery", fields: ["image","title","caption","category"] },
  reviews: { table: "reviews", fields: ["customer_name","review_text","rating","treatment","image_avatar","location"] },
};

app.post("/api/uploads", requireAdmin, (req, res) => {
  upload.single("file")(req, res, err => {
    if (err) {
      const message = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large. Maximum size is 8 MB."
        : err.message || "Unable to upload image.";
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: "Please select an image." });
    const baseUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;
    res.status(201).json({ url: `${baseUrl}/uploads/${req.file.filename}`, filename: req.file.filename });
  });
});

const isValidIndianPhone = value => /^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(String(value || "").trim());
const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());

app.get("/api/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ ok: true, database: process.env.DB_NAME || "dental_care_center" }); }
  catch { res.status(503).json({ ok: false, error: "Database unavailable" }); }
});

app.post("/api/auth/login", (req, res) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const prior = failedLogins.get(key);
  if (prior && now - prior.startedAt < LOGIN_WINDOW_MS && prior.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ error: "Too many sign-in attempts. Please wait 15 minutes before trying again." });
  }
  if (prior && now - prior.startedAt >= LOGIN_WINDOW_MS) failedLogins.delete(key);
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!timingSafeStringEqual(username, ADMIN_USERNAME) || !timingSafeStringEqual(password, ADMIN_PASSWORD)) {
    const current = failedLogins.get(key);
    failedLogins.set(key, current && now - current.startedAt < LOGIN_WINDOW_MS
      ? { startedAt: current.startedAt, count: current.count + 1 }
      : { startedAt: now, count: 1 });
    return res.status(401).json({ error: "Invalid username or password." });
  }
  failedLogins.delete(key);
  const token = signToken({ sub: username, iat: now, exp: now + 8 * 60 * 60 * 1000 });
  res.json({ token, expires_at: new Date(now + 8 * 60 * 60 * 1000).toISOString(), username });
});


for (const [resource, cfg] of Object.entries(resources)) {
  app.get(`/api/${resource}`, async (_req, res) => {
    try { const [rows] = await pool.query(`SELECT * FROM ${cfg.table} ORDER BY id DESC`); res.json(rows); }
    catch (err) { console.error(`${resource} GET`, err.message); res.status(500).json({ error: "Unable to load data." }); }
  });

  app.post(`/api/${resource}`, requireAdmin, async (req, res) => {
    try {
      const data = {};
      for (const field of cfg.fields) data[field] = req.body[field] ?? null;
      if (resource === "reviews" && (!data.customer_name || !data.review_text || !Number.isInteger(Number(data.rating)))) return res.status(400).json({ error: "Invalid review data." });
      if (resource === "dentists" && !data.name) return res.status(400).json({ error: "Dentist name is required." });
      if (resource === "services" && (!data.name || !data.description || !data.category)) return res.status(400).json({ error: "Service name, description and category are required." });
      if (resource === "gallery" && (!data.image || !data.category)) return res.status(400).json({ error: "Gallery image and category are required." });
      const columns = Object.keys(data); const values = Object.values(data);
      const [result] = await pool.query(`INSERT INTO ${cfg.table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`, values);
      const [rows] = await pool.query(`SELECT * FROM ${cfg.table} WHERE id = ?`, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) { console.error(`${resource} POST`, err.message); res.status(500).json({ error: "Unable to save data." }); }
  });

  app.put(`/api/${resource}/:id`, requireAdmin, async (req, res) => {
    try {
      const sets = []; const values = [];
      for (const field of cfg.fields) if (req.body[field] !== undefined) { sets.push(`${field} = ?`); values.push(req.body[field]); }
      if (!sets.length) return res.status(400).json({ error: "No fields to update." });
      values.push(req.params.id);
      await pool.query(`UPDATE ${cfg.table} SET ${sets.join(", ")} WHERE id = ?`, values);
      const [rows] = await pool.query(`SELECT * FROM ${cfg.table} WHERE id = ?`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "Record not found." });
      res.json(rows[0]);
    } catch (err) { console.error(`${resource} PUT`, err.message); res.status(500).json({ error: "Unable to update data." }); }
  });

  app.delete(`/api/${resource}/:id`, requireAdmin, async (req, res) => {
    try { await pool.query(`DELETE FROM ${cfg.table} WHERE id = ?`, [req.params.id]); res.status(204).end(); }
    catch (err) { console.error(`${resource} DELETE`, err.message); res.status(500).json({ error: "Unable to delete data." }); }
  });
}

// Patient records: names are searchable for convenience, but phone/email are
// normalized and used for duplicate/conflict checks. Names alone never merge people.
app.get("/api/patients/search", requireAdmin, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  const digits = normalizePhone(q);
  const like = `%${q.toLowerCase()}%`;
  const clauses = ["LOWER(full_name) LIKE ?", "LOWER(email) LIKE ?"];
  const values = [like, like];
  if (digits.length >= 3) { clauses.push("phone LIKE ?"); values.push(`%${digits}%`); }
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, phone, email, date_of_birth, gender, medical_history, allergies, created_at, updated_at FROM patients WHERE ${clauses.join(" OR ")} ORDER BY full_name ASC LIMIT 25`,
      values
    );
    res.json(rows.map(publicPatient));
  } catch (err) {
    console.error("patients search", err.message);
    res.status(500).json({ error: "Unable to search patient records. Apply database migration 001_prescription_system.sql first." });
  }
});

app.post("/api/patients", requireAdmin, async (req, res) => {
  const fullName = String(req.body?.full_name || "").trim();
  const phone = normalizePhone(req.body?.phone);
  const email = normalizeEmail(req.body?.email);
  const dateOfBirth = req.body?.date_of_birth || null;
  const gender = String(req.body?.gender || "").trim() || null;
  const medicalHistory = String(req.body?.medical_history || "").trim() || null;
  const allergies = String(req.body?.allergies || "").trim() || null;
  if (!fullName) return res.status(400).json({ error: "Patient full name is required." });
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (dateOfBirth && !isValidDateValue(dateOfBirth)) return res.status(400).json({ error: "Date of birth is invalid." });
  try {
    const [byPhone] = await pool.query("SELECT * FROM patients WHERE phone = ? LIMIT 1", [phone]);
    const [byEmail] = await pool.query("SELECT * FROM patients WHERE LOWER(email) = ? LIMIT 1", [email]);
    const phoneRecord = byPhone[0] || null; const emailRecord = byEmail[0] || null;
    if (phoneRecord && emailRecord && phoneRecord.id === emailRecord.id) {
      return res.status(200).json({ existing: true, patient: publicPatient(phoneRecord), message: "A patient with this phone and email already exists." });
    }
    const matches = [phoneRecord, emailRecord].filter(Boolean).filter((row, i, arr) => arr.findIndex(other => other.id === row.id) === i);
    if (matches.length) return res.status(409).json({ error: "The phone number and email match an existing or conflicting patient record. Review the matches before registering; records were not merged.", matches: matches.map(publicPatient) });
    const [result] = await pool.query(
      "INSERT INTO patients (full_name, phone, email, date_of_birth, gender, medical_history, allergies) VALUES (?,?,?,?,?,?,?)",
      [fullName, phone, email, dateOfBirth, gender, medicalHistory, allergies]
    );
    const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [result.insertId]);
    res.status(201).json({ existing: false, patient: publicPatient(rows[0]) });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A patient with this phone or email was added at the same time. Search and review existing records." });
    console.error("patients POST", err.message);
    res.status(500).json({ error: "Unable to register patient. Ensure the prescription database migration is applied." });
  }
});

app.put("/api/patients/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid patient ID." });
  const allowed = ["full_name", "phone", "email", "date_of_birth", "gender", "medical_history", "allergies"];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (req.body?.[key] === undefined) continue;
    let value = req.body[key];
    if (key === "phone") value = normalizePhone(value);
    if (key === "email") value = normalizeEmail(value);
    if (key === "full_name") value = String(value || "").trim();
    if (["gender", "medical_history", "allergies"].includes(key)) value = String(value || "").trim() || null;
    fields.push(`${key} = ?`); values.push(value);
  }
  if (!fields.length) return res.status(400).json({ error: "No patient fields were supplied." });
  if (req.body.phone !== undefined && !/^[6-9]\d{9}$/.test(normalizePhone(req.body.phone))) return res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." });
  if (req.body.email !== undefined && !isValidEmail(req.body.email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (req.body.date_of_birth && !isValidDateValue(req.body.date_of_birth)) return res.status(400).json({ error: "Date of birth is invalid." });
  try {
    values.push(id);
    await pool.query(`UPDATE patients SET ${fields.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Patient not found." });
    res.json(publicPatient(rows[0]));
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "That phone or email is already linked to another patient. Resolve the conflict before updating." });
    console.error("patients PUT", err.message); res.status(500).json({ error: "Unable to update patient." });
  }
});

app.get("/api/patients/:id/prescriptions", requireAdmin, async (req, res) => {
  const patientId = Number(req.params.id);
  if (!Number.isInteger(patientId) || patientId <= 0) return res.status(400).json({ error: "Invalid patient ID." });
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.prescription_number, p.patient_id, p.doctor_id, p.doctor_name, p.doctor_qualification, p.prescription_date, p.chief_complaint, p.clinical_observations, p.diagnosis, p.treatment_plan, p.additional_notes, p.follow_up_date, p.created_by, p.created_at, p.updated_at, (SELECT COUNT(*) FROM prescription_medicines pm WHERE pm.prescription_id = p.id) AS medicine_count FROM prescriptions p WHERE p.patient_id = ? ORDER BY p.prescription_date DESC, p.id DESC`,
      [patientId]
    );
    res.json(rows);
  } catch (err) { console.error("prescription history", err.message); res.status(500).json({ error: "Unable to load prescription history. Ensure the prescription migration is applied." }); }
});

async function loadPrescriptionDetail(id) {
  const [rows] = await pool.query(
    `SELECT p.*, pt.full_name AS patient_full_name, pt.phone AS patient_phone, pt.email AS patient_email, pt.date_of_birth AS patient_date_of_birth, pt.gender AS patient_gender, pt.medical_history AS patient_medical_history, pt.allergies AS patient_allergies FROM prescriptions p INNER JOIN patients pt ON pt.id = p.patient_id WHERE p.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const row = rows[0];
  const [medicines] = await pool.query("SELECT * FROM prescription_medicines WHERE prescription_id = ? ORDER BY display_order ASC, id ASC", [id]);
  const patient = {
    id: row.patient_id, full_name: row.patient_full_name, phone: row.patient_phone, email: row.patient_email,
    date_of_birth: row.patient_date_of_birth, gender: row.patient_gender, medical_history: row.patient_medical_history,
    allergies: row.patient_allergies,
  };
  const { patient_full_name, patient_phone, patient_email, patient_date_of_birth, patient_gender, patient_medical_history, patient_allergies, ...prescription } = row;
  return { ...prescription, patient, medicines };
}

app.get("/api/prescriptions/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid prescription ID." });
  try {
    const record = await loadPrescriptionDetail(id);
    if (!record) return res.status(404).json({ error: "Prescription not found." });
    res.json(record);
  } catch (err) { console.error("prescription GET", err.message); res.status(500).json({ error: "Unable to load prescription." }); }
});

app.post("/api/prescriptions", requireAdmin, async (req, res) => {
  const patientId = Number(req.body?.patient_id);
  const doctorId = Number(req.body?.doctor_id);
  const prescriptionDate = req.body?.prescription_date || new Date().toISOString().slice(0, 10);
  const followUpDate = req.body?.follow_up_date || null;
  const medicineItems = Array.isArray(req.body?.medicines) ? req.body.medicines : [];
  if (!Number.isInteger(patientId) || patientId <= 0) return res.status(400).json({ error: "Choose a patient before saving." });
  if (!Number.isInteger(doctorId) || doctorId <= 0) return res.status(400).json({ error: "Select the prescribing dentist." });
  if (!isValidDateValue(prescriptionDate) || (followUpDate && !isValidDateValue(followUpDate))) return res.status(400).json({ error: "Prescription or follow-up date is invalid." });
  if (medicineItems.length > 50) return res.status(400).json({ error: "A prescription can contain at most 50 medicine entries." });
  for (const [index, item] of medicineItems.entries()) {
    if (!String(item?.medicine_name || "").trim()) return res.status(400).json({ error: `Medicine ${index + 1} needs a name or must be removed.` });
  }
  const connection = await pool.getConnection();
  let newId;
  try {
    await connection.beginTransaction();
    const [patients] = await connection.query("SELECT id FROM patients WHERE id = ? FOR UPDATE", [patientId]);
    if (!patients.length) { await connection.rollback(); return res.status(404).json({ error: "The selected patient no longer exists." }); }
    const [doctors] = await connection.query("SELECT id, name, qualification FROM dentists WHERE id = ?", [doctorId]);
    if (!doctors.length) { await connection.rollback(); return res.status(400).json({ error: "The selected dentist was not found. Refresh the page and choose again." }); }
    const doctor = doctors[0];
    const prescriptionNumber = `DCC-${String(prescriptionDate).replace(/-/g, "")}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const [result] = await connection.query(
      `INSERT INTO prescriptions (prescription_number, patient_id, doctor_id, doctor_name, doctor_qualification, prescription_date, chief_complaint, clinical_observations, diagnosis, treatment_plan, additional_notes, follow_up_date, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [prescriptionNumber, patientId, doctor.id, doctor.name, doctor.qualification || null, prescriptionDate,
       String(req.body?.chief_complaint || "").trim() || null,
       String(req.body?.clinical_observations || "").trim() || null,
       String(req.body?.diagnosis || "").trim() || null,
       String(req.body?.treatment_plan || "").trim() || null,
       String(req.body?.additional_notes || "").trim() || null,
       followUpDate, req.auth.username]
    );
    newId = result.insertId;
    for (let index = 0; index < medicineItems.length; index += 1) {
      const item = medicineItems[index];
      const medicineId = item.medicine_id ? Number(item.medicine_id) : null;
      if (medicineId) {
        const [catalogueMatch] = await connection.query("SELECT id FROM medicines WHERE id = ? AND is_active = 1", [medicineId]);
        if (!catalogueMatch.length) throw Object.assign(new Error("One selected catalogue medicine is no longer active. Refresh suggestions and try again."), { statusCode: 400 });
      }
      await connection.query(
        `INSERT INTO prescription_medicines (prescription_id, medicine_id, medicine_name, strength, dose, route, frequency, duration, quantity, instructions, notes, display_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [newId, medicineId, String(item.medicine_name).trim(), String(item.strength || "").trim() || null,
         String(item.dose || "").trim() || null, String(item.route || "").trim() || null,
         String(item.frequency || "").trim() || null, String(item.duration || "").trim() || null,
         String(item.quantity || "").trim() || null, String(item.instructions || "").trim() || null,
         String(item.notes || "").trim() || null, index]
      );
    }
    await connection.commit();
    const detail = await loadPrescriptionDetail(newId);
    res.status(201).json(detail);
  } catch (err) {
    await connection.rollback().catch(() => {});
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A prescription number conflict occurred. Please retry." });
    console.error("prescription POST", err.message);
    res.status(500).json({ error: "Unable to save prescription. Check that the prescription database migration is applied." });
  } finally { connection.release(); }
});

app.get("/api/medicines", requireAdmin, async (req, res) => {
  const query = String(req.query.q || "").trim();
  try {
    if (query) {
      const like = `%${query.toLowerCase()}%`;
      const [rows] = await pool.query("SELECT * FROM medicines WHERE is_active = 1 AND (LOWER(name) LIKE ? OR LOWER(COALESCE(generic_name,'')) LIKE ? OR LOWER(COALESCE(brand_name,'')) LIKE ?) ORDER BY name LIMIT 20", [like, like, like]);
      return res.json(rows);
    }
    const [rows] = await pool.query("SELECT * FROM medicines WHERE is_active = 1 ORDER BY name LIMIT 500");
    res.json(rows);
  } catch (err) { console.error("medicines GET", err.message); res.status(500).json({ error: "Unable to load medicine catalogue. Ensure the migration is applied." }); }
});

app.post("/api/medicines", requireAdmin, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Medicine name is required." });
  try {
    const [result] = await pool.query("INSERT INTO medicines (name, generic_name, brand_name, strength, dosage_form, notes, is_active) VALUES (?,?,?,?,?,?,1)", [name, String(req.body?.generic_name || "").trim() || null, String(req.body?.brand_name || "").trim() || null, String(req.body?.strength || "").trim() || null, String(req.body?.dosage_form || "").trim() || null, String(req.body?.notes || "").trim() || null]);
    const [rows] = await pool.query("SELECT * FROM medicines WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "This medicine is already in the catalogue." }); console.error("medicines POST", err.message); res.status(500).json({ error: "Unable to add medicine to the catalogue." }); }
});

app.put("/api/medicines/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id); const allowed = ["name", "generic_name", "brand_name", "strength", "dosage_form", "notes", "is_active"];
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid medicine ID." });
  const sets = []; const values = [];
  for (const field of allowed) if (req.body?.[field] !== undefined) { sets.push(`${field} = ?`); values.push(req.body[field]); }
  if (!sets.length) return res.status(400).json({ error: "No medicine fields were supplied." });
  try { values.push(id); await pool.query(`UPDATE medicines SET ${sets.join(", ")} WHERE id = ?`, values); const [rows] = await pool.query("SELECT * FROM medicines WHERE id = ?", [id]); if (!rows.length) return res.status(404).json({ error: "Medicine not found." }); res.json(rows[0]); }
  catch (err) { console.error("medicines PUT", err.message); res.status(500).json({ error: "Unable to update medicine." }); }
});

app.delete("/api/medicines/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid medicine ID." });
  try { await pool.query("UPDATE medicines SET is_active = 0 WHERE id = ?", [id]); res.status(204).end(); }
  catch (err) { console.error("medicines DELETE", err.message); res.status(500).json({ error: "Unable to deactivate medicine." }); }
});

app.get("/api/appointments", requireAdmin, async (_req, res) => {
  try { const [rows] = await pool.query("SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC, id DESC"); res.json(rows); }
  catch (err) { console.error("appointments GET", err.message); res.status(500).json({ error: "Unable to load appointments." }); }
});

app.post("/api/appointments", async (req, res) => {
  const { first_name, last_name, phone, email, service, dentist, appointment_date, appointment_time, additional_details, status = "pending" } = req.body;
  if (!first_name || !last_name || !phone || !email || !service || !dentist || !appointment_date || !appointment_time) return res.status(400).json({ error: "First name, last name, phone, email, service, dentist, date and time are required." });
  if (!isValidIndianPhone(phone)) return res.status(400).json({ error: "Please enter a valid Indian mobile number." });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date) || !/^\d{1,2}:\d{2} (AM|PM)$/.test(appointment_time)) return res.status(400).json({ error: "Invalid appointment date or time." });
  try {
    const [result] = await pool.query(`INSERT INTO appointments (first_name,last_name,phone,email,service,dentist,appointment_date,appointment_time,additional_details,status) VALUES (?,?,?,?,?,?,?,?,?,?)`, [first_name.trim(), last_name.trim(), String(phone).replace(/\D/g, ""), email.trim().toLowerCase(), service, dentist, appointment_date, appointment_time, additional_details || null, status]);
    const [rows] = await pool.query("SELECT * FROM appointments WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "That dentist is already booked for the selected date and time." });
    console.error("appointments POST", err.message); res.status(500).json({ error: "Unable to create appointment." });
  }
});

app.put("/api/appointments/:id", requireAdmin, async (req, res) => {
  const allowed = ["first_name","last_name","phone","email","service","dentist","appointment_date","appointment_time","additional_details","status"];
  const sets=[]; const values=[];
  for (const f of allowed) if (req.body[f] !== undefined) { sets.push(`${f} = ?`); values.push(req.body[f]); }
  if (!sets.length) return res.status(400).json({ error: "No fields to update." });
  try { values.push(req.params.id); await pool.query(`UPDATE appointments SET ${sets.join(", ")} WHERE id = ?`, values); const [rows]=await pool.query("SELECT * FROM appointments WHERE id = ?", [req.params.id]); res.json(rows[0]); }
  catch (err) { if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "That appointment slot is already booked." }); res.status(500).json({ error: "Unable to update appointment." }); }
});

app.delete("/api/appointments/:id", requireAdmin, async (req,res) => { try { await pool.query("DELETE FROM appointments WHERE id = ?", [req.params.id]); res.status(204).end(); } catch { res.status(500).json({ error: "Unable to delete appointment." }); } });

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Dental Care Center API listening on http://localhost:${port}`));
