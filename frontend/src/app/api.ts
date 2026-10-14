const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export interface ApiDentist {
  id: number; name: string; image: string; qualification: string; specialization: string;
  experience: string; description: string; timing?: string;
  img: string; qual: string; spec: string; exp: string;
}
export interface ApiService {
  id: number; name: string; description: string; category: string; image_icon?: string;
  icon: any; price: string; bg: string; title: string; desc: string; cat: string;
}
export interface ApiGalleryItem {
  id: number; image: string; title?: string; caption?: string; category: string;
  src: string; alt: string; cat: string;
}
export interface ApiReview {
  id: number; customer_name: string; review_text: string; rating: number; treatment?: string;
  image_avatar?: string; location?: string; name: string; review: string; loc: string; av: string;
}
export interface ApiAppointment {
  id: number; first_name: string; last_name: string; phone: string; email: string;
  service: string; dentist: string; appointment_date: string; appointment_time: string;
  additional_details?: string; status: string; created_at?: string;
  patient?: string; date?: string; time?: string; notes?: string;
}

export interface PatientRecord {
  id: number; full_name: string; phone: string; email: string; date_of_birth?: string | null;
  gender?: string | null; medical_history?: string | null; allergies?: string | null;
  created_at?: string; updated_at?: string;
}
export interface MedicineRecord {
  id: number; name: string; generic_name?: string | null; brand_name?: string | null;
  strength?: string | null; dosage_form?: string | null; notes?: string | null; is_active?: number | boolean;
}
export interface PrescriptionMedicine {
  id?: number; medicine_id?: number | null; medicine_name: string; strength?: string | null;
  dose?: string | null; route?: string | null; frequency?: string | null; duration?: string | null;
  quantity?: string | null; instructions?: string | null; notes?: string | null; display_order?: number;
}
export interface PrescriptionRecord {
  id: number; prescription_number: string; patient_id: number; doctor_id?: number | null;
  doctor_name: string; doctor_qualification?: string | null; prescription_date: string;
  chief_complaint?: string | null; clinical_observations?: string | null; diagnosis?: string | null;
  treatment_plan?: string | null; additional_notes?: string | null; follow_up_date?: string | null;
  created_by: string; created_at: string; updated_at?: string; medicine_count?: number;
  patient?: PatientRecord; medicines?: PrescriptionMedicine[];
}

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(body.error || "Request failed");
    error.status = response.status;
    error.data = body;
    throw error;
  }
  return body;
}

async function authorizedRequest(path: string, options?: RequestInit) {
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("dcc_admin_token") : null;
  if (!token) throw new Error("Please sign in to the Admin Panel again to continue.");
  return request(path, { ...options, headers: { ...(options?.headers || {}), Authorization: `Bearer ${token}` } });
}

const mapDentist = (d: ApiDentist): ApiDentist => ({ ...d, img: d.image, qual: d.qualification, spec: d.specialization, exp: d.experience });
const mapService = (s: ApiService): ApiService => ({ ...s, title: s.name, desc: s.description, cat: s.category, icon: s.image_icon || "sparkles", bg: s.bg || "#00ABE4" });
const mapGallery = (g: ApiGalleryItem): ApiGalleryItem => ({ ...g, src: g.image, alt: g.title || g.caption || "Dental clinic image", cat: g.category });
const mapReview = (r: ApiReview): ApiReview => ({ ...r, name: r.customer_name, review: r.review_text, loc: r.location || "Mumbai", treatment: r.treatment || "Dental Care", av: r.image_avatar || r.customer_name.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase() });

export const api = {
  adminLogin: async (username: string, password: string) => {
    const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("dcc_admin_token", result.token);
    return result;
  },
  clearAdminToken: () => { if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("dcc_admin_token"); },
  list: async (resource: "dentists" | "services" | "gallery" | "reviews" | "appointments") => {
    const data = resource === "appointments" ? await authorizedRequest(`/${resource}`) : await request(`/${resource}`);
    if (resource === "dentists") return data.map(mapDentist);
    if (resource === "services") return data.map(mapService);
    if (resource === "gallery") return data.map(mapGallery);
    if (resource === "reviews") return data.map(mapReview);
    return data as ApiAppointment[];
  },
  create: (resource: string, payload: unknown) => {
    const options = { method: "POST", body: JSON.stringify(payload) } as RequestInit;
    return resource === "appointments" ? request(`/${resource}`, options) : authorizedRequest(`/${resource}`, options);
  },
  update: (resource: string, id: number, payload: unknown) => authorizedRequest(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (resource: string, id: number) => authorizedRequest(`/${resource}/${id}`, { method: "DELETE" }),

  uploadImage: async (file: File) => {
    const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("dcc_admin_token") : null;
    if (!token) throw new Error("Sign in to the Admin Panel before uploading images.");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE}/uploads`, { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Unable to upload image.");
    return body as { url: string; filename: string };
  },
  searchPatients: (query: string) => authorizedRequest(`/patients/search?q=${encodeURIComponent(query)}`) as Promise<PatientRecord[]>,
  createPatient: (payload: Partial<PatientRecord>) => authorizedRequest("/patients", { method: "POST", body: JSON.stringify(payload) }),
  updatePatient: (id: number, payload: Partial<PatientRecord>) => authorizedRequest(`/patients/${id}`, { method: "PUT", body: JSON.stringify(payload) }) as Promise<PatientRecord>,
  patientPrescriptionHistory: (patientId: number) => authorizedRequest(`/patients/${patientId}/prescriptions`) as Promise<PrescriptionRecord[]>,
  getPrescription: (id: number) => authorizedRequest(`/prescriptions/${id}`) as Promise<PrescriptionRecord>,
  createPrescription: (payload: unknown) => authorizedRequest("/prescriptions", { method: "POST", body: JSON.stringify(payload) }) as Promise<PrescriptionRecord>,
  searchMedicines: (query = "") => authorizedRequest(`/medicines${query ? `?q=${encodeURIComponent(query)}` : ""}`) as Promise<MedicineRecord[]>,
  createMedicine: (payload: Partial<MedicineRecord>) => authorizedRequest("/medicines", { method: "POST", body: JSON.stringify(payload) }) as Promise<MedicineRecord>,
  updateMedicine: (id: number, payload: Partial<MedicineRecord>) => authorizedRequest(`/medicines/${id}`, { method: "PUT", body: JSON.stringify(payload) }) as Promise<MedicineRecord>,
  removeMedicine: (id: number) => authorizedRequest(`/medicines/${id}`, { method: "DELETE" }),
};
