import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ChevronDown, ChevronUp, ClipboardList,
  Download, FileDown, FileText, Plus, Printer, Search, Share2, Trash2, UserRound,
  UserRoundPlus, X, Pill, Save, BookOpen, Database,
} from "lucide-react";
import { toast } from "sonner";
import { api, type ApiDentist, type MedicineRecord, type PatientRecord, type PrescriptionMedicine, type PrescriptionRecord } from "../api";

const BLUE = "#00ABE4";
const BLUE2 = "#028090";
const DARK = "#0C2340";
const LIGHT = "#EDF6F9";

type PatientForm = {
  full_name: string; phone: string; email: string; date_of_birth: string; gender: string;
  medical_history: string; allergies: string;
};
type Draft = {
  doctor_id: string; prescription_date: string; chief_complaint: string; clinical_observations: string;
  diagnosis: string; treatment_plan: string; additional_notes: string; follow_up_date: string;
};
type MedicineRow = PrescriptionMedicine & { localId: string };

const emptyPatient: PatientForm = { full_name: "", phone: "", email: "", date_of_birth: "", gender: "", medical_history: "", allergies: "" };
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const emptyDraft = (): Draft => ({ doctor_id: "", prescription_date: todayISO(), chief_complaint: "", clinical_observations: "", diagnosis: "", treatment_plan: "", additional_notes: "", follow_up_date: "" });
const newMedicineRow = (): MedicineRow => ({ localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, medicine_id: null, medicine_name: "", strength: "", dose: "", route: "", frequency: "", duration: "", quantity: "", instructions: "", notes: "" });
const fmtDate = (value?: string | null) => value ? String(value).slice(0, 10) : "—";
const prettyDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5";
const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-50";

function DocumentSection({ title, text }: { title: string; text?: string | null }) {
  if (!text?.trim()) return null;
  return <section className="mb-4 break-inside-avoid">
    <h3 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: BLUE2 }}>{title}</h3>
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{text}</p>
  </section>;
}

function PrescriptionDocument({ record }: { record: PrescriptionRecord }) {
  const patient = record.patient;
  const medicines = record.medicines || [];
  return <article id="prescription-print" className="prescription-document mx-auto w-full max-w-[820px] bg-white text-gray-800 border border-gray-200 rounded-xl shadow-sm p-6 sm:p-9">
    <header className="flex flex-col sm:flex-row justify-between gap-4 border-b-2 pb-5 mb-5" style={{ borderColor: BLUE }}>
      <div className="flex items-center gap-3 min-w-0">
        <img src="/images/logo/dental-care-center-mark.svg" alt="Dental Care Center tooth-and-cross logo" className="w-16 h-16 object-contain shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide" style={{ color: DARK, fontFamily: "Poppins, sans-serif" }}>DENTAL CARE CENTER</h1>
          <p className="text-xs sm:text-sm font-semibold mt-1" style={{ color: BLUE }}>Jogeshwari-West</p>
          <p className="text-[11px] text-gray-500 mt-1">Sai Complex, SV Road, Jogeshwari West, Mumbai – 400102</p>
          <p className="text-[11px] text-gray-500">Clinic: +91 99678 29567 · info@dentalcarecenter.in</p>
        </div>
      </div>
      <div className="sm:text-right shrink-0">
        <div className="inline-block rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: BLUE }}>DENTAL PRESCRIPTION</div>
        <p className="text-xs text-gray-500 mt-2">Prescription No.</p>
        <p className="text-sm font-bold" style={{ color: DARK }}>{record.prescription_number || "DRAFT"}</p>
        <p className="text-xs text-gray-500 mt-1">Date: {prettyDate(record.prescription_date)}</p>
      </div>
    </header>

    <section className="rounded-xl p-4 mb-5 border border-sky-100" style={{ background: "#F7FCFE" }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-3" style={{ color: BLUE2 }}><UserRound className="w-4 h-4" /> Patient Information</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div><span className="text-gray-500">Name:</span> <strong>{patient?.full_name || "—"}</strong></div>
        <div><span className="text-gray-500">Phone:</span> {patient?.phone || "—"}</div>
        <div className="break-all"><span className="text-gray-500">Email:</span> {patient?.email || "—"}</div>
        <div><span className="text-gray-500">Date of birth:</span> {prettyDate(patient?.date_of_birth)}</div>
        {patient?.gender && <div><span className="text-gray-500">Gender:</span> {patient.gender}</div>}
        <div><span className="text-gray-500">Prescribing dentist:</span> <strong>{record.doctor_name || "—"}</strong>{record.doctor_qualification ? ` · ${record.doctor_qualification}` : ""}</div>
      </div>
    </section>

    <DocumentSection title="Chief Complaint" text={record.chief_complaint} />
    <DocumentSection title="Clinical Observations" text={record.clinical_observations} />
    <DocumentSection title="Diagnosis" text={record.diagnosis} />
    <DocumentSection title="Treatment Plan" text={record.treatment_plan} />

    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE2 }}>Medication / Prescription</h3>
        <span className="text-xs text-gray-400">{medicines.length} item{medicines.length === 1 ? "" : "s"}</span>
      </div>
      {medicines.length ? <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs prescription-medicine-table">
          <thead><tr style={{ background: LIGHT }}>
            { ["Medicine", "Strength / Dose", "Route", "Frequency", "Duration", "Qty / Instructions"].map(label => <th key={label} className="px-2.5 py-2 text-left font-bold text-gray-600">{label}</th>) }
          </tr></thead>
          <tbody>{medicines.map((medicine, index) => <tr key={`${medicine.id ?? index}-${medicine.medicine_name}`} className="border-t border-gray-100 align-top">
            <td className="px-2.5 py-2 font-semibold">{medicine.medicine_name}{medicine.notes && <div className="font-normal text-gray-500 mt-1">{medicine.notes}</div>}</td>
            <td className="px-2.5 py-2">{[medicine.strength, medicine.dose].filter(Boolean).join(" · ") || "—"}</td>
            <td className="px-2.5 py-2">{medicine.route || "—"}</td>
            <td className="px-2.5 py-2">{medicine.frequency || "—"}</td>
            <td className="px-2.5 py-2">{medicine.duration || "—"}</td>
            <td className="px-2.5 py-2">{medicine.quantity || "—"}{medicine.instructions && <div className="mt-1 text-gray-500">{medicine.instructions}</div>}</td>
          </tr>)}</tbody>
        </table>
      </div> : <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-400">No medicines entered for this prescription.</div>}
    </section>

    <DocumentSection title="Additional Notes / Instructions" text={record.additional_notes} />
    {patient?.allergies && <DocumentSection title="Recorded Allergies (Patient Record)" text={patient.allergies} />}
    {record.follow_up_date && <div className="rounded-lg px-4 py-3 mb-6 text-sm" style={{ background: LIGHT }}><strong style={{ color: DARK }}>Follow-up:</strong> {prettyDate(record.follow_up_date)}</div>}

    <footer className="grid grid-cols-2 gap-8 items-end mt-10 pt-5 border-t border-gray-200">
      <div><p className="text-xs text-gray-500">Please contact the clinic if you need clarification on these instructions.</p><p className="text-xs text-gray-400 mt-2">Record created by: {record.created_by || "Draft"}</p></div>
      <div className="text-center"><div className="border-b border-gray-400 h-12 mx-3 mb-2" /><p className="text-xs font-semibold" style={{ color: DARK }}>{record.doctor_name || "Prescribing Dentist"}</p><p className="text-[11px] text-gray-500">Signature / Clinic Seal</p></div>
    </footer>
  </article>;
}

function pdfSafe(value: unknown) {
  return String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/[\\()]/g, "\\$&").replace(/[\r\n]+/g, " ");
}

// A dependency-free, vector/text PDF writer keeps downloads available even when
// no third-party PDF library has been installed. All clinical values are taken
// from the saved record; it never generates or interprets treatment advice.
function createPrescriptionPdf(record: PrescriptionRecord): Blob {
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = 790;
  const ensurePage = () => {
    if (!commands.length) {
      // Original logo mark redrawn as PDF vector paths so the downloadable PDF
      // carries the same tooth silhouette and coral medical cross as the SVG.
      commands.push("0.00 0.67 0.89 RG 2 w 36.72 788.92 m 31.02 791.96 25.32 788.92 24.56 783.22 c 23.42 777.14 27.60 772.58 29.50 767.26 c 31.02 761.94 32.92 759.28 35.20 760.04 c 37.48 760.80 37.10 768.40 39.38 770.30 c 41.66 768.40 41.28 760.80 43.94 760.04 c 46.22 759.28 48.12 761.94 49.64 767.26 c 51.54 772.58 55.72 777.14 54.58 783.22 c 53.82 788.92 48.12 791.96 42.42 788.92 c 40.52 787.78 38.62 787.78 36.72 788.92 c h S");
      commands.push("0.91 0.18 0.18 rg 45 780 4 14 re f 40 785 14 4 re f");
      commands.push(`BT /F2 17 Tf 70 786 Td (${pdfSafe("DENTAL CARE CENTER")}) Tj ET`);
      commands.push(`BT /F2 9 Tf 70 768 Td (${pdfSafe("JOGESHWARI-WEST")}) Tj ET`);
      commands.push(`BT /F1 8 Tf 70 751 Td (${pdfSafe("Sai Complex, SV Road, Jogeshwari West, Mumbai - 400102 | +91 99678 29567 | info@dentalcarecenter.in")}) Tj ET`);
      commands.push("0.02 0.67 0.89 RG 1.5 w 40 738 m 555 738 l S");
      y = 716;
    }
  };
  const newPage = () => { if (commands.length) pages.push(commands); commands = []; ensurePage(); };
  const text = (value: unknown, opts: { bold?: boolean; size?: number; x?: number; color?: string; gap?: number } = {}) => {
    ensurePage();
    const size = opts.size || 10; const x = opts.x || 42; const color = opts.color || "0.16 0.21 0.28";
    const raw = String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
    const maxChars = Math.max(25, Math.floor((555 - x) / (size * .52)));
    const words = raw.split(/\s+/); const lines: string[] = []; let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) { lines.push(line); line = word; } else line = candidate;
    }
    if (line || !lines.length) lines.push(line);
    for (const eachLine of lines) {
      if (y < 62) newPage();
      commands.push(`${color} rg BT /${opts.bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfSafe(eachLine)}) Tj ET`);
      y -= size + 4;
    }
    y -= opts.gap ?? 2;
  };
  const line = () => { ensurePage(); if (y < 70) newPage(); commands.push(`0.85 0.89 0.92 RG 0.6 w 42 ${y} m 553 ${y} l S`); y -= 12; };
  ensurePage();
  text("DENTAL PRESCRIPTION", { bold: true, size: 12, color: "0.02 0.50 0.56", gap: 2 });
  text(`Prescription number: ${record.prescription_number || "DRAFT"}     Date: ${fmtDate(record.prescription_date)}`, { size: 9, gap: 5 });
  line();
  const patient = record.patient;
  text("PATIENT INFORMATION", { bold: true, size: 10, color: "0.02 0.50 0.56" });
  text(`Name: ${patient?.full_name || "-"}`);
  text(`Phone: ${patient?.phone || "-"}     Email: ${patient?.email || "-"}`, { size: 9 });
  text(`Date of birth: ${fmtDate(patient?.date_of_birth)}     Gender: ${patient?.gender || "-"}`, { size: 9 });
  text(`Prescribing dentist: ${record.doctor_name || "-"}${record.doctor_qualification ? ` | ${record.doctor_qualification}` : ""}`, { size: 9, gap: 4 });
  line();
  const sections: Array<[string, string | null | undefined]> = [
    ["CHIEF COMPLAINT", record.chief_complaint], ["CLINICAL OBSERVATIONS", record.clinical_observations],
    ["DIAGNOSIS", record.diagnosis], ["TREATMENT PLAN", record.treatment_plan],
  ];
  for (const [heading, content] of sections) if (content?.trim()) { text(heading, { bold: true, size: 9, color: "0.02 0.50 0.56" }); text(content, { size: 9, gap: 3 }); }
  text("MEDICATION / PRESCRIPTION", { bold: true, size: 10, color: "0.02 0.50 0.56", gap: 3 });
  const meds = record.medicines || [];
  if (!meds.length) text("No medicines entered.", { size: 9 });
  meds.forEach((medicine, index) => {
    text(`${index + 1}. ${medicine.medicine_name}${medicine.strength ? ` | Strength: ${medicine.strength}` : ""}${medicine.dose ? ` | Dose: ${medicine.dose}` : ""}`, { bold: true, size: 9, gap: 0 });
    const detail = [`Route: ${medicine.route}`, `Frequency: ${medicine.frequency}`, `Duration: ${medicine.duration}`, `Quantity: ${medicine.quantity}`].filter(part => !part.endsWith(": ")).join(" | ");
    if (detail) text(detail, { size: 8, x: 56, color: "0.28 0.32 0.38", gap: 0 });
    if (medicine.instructions) text(`Instructions: ${medicine.instructions}`, { size: 8, x: 56, color: "0.28 0.32 0.38", gap: 0 });
    if (medicine.notes) text(`Notes: ${medicine.notes}`, { size: 8, x: 56, color: "0.28 0.32 0.38", gap: 0 });
    y -= 4;
  });
  if (record.additional_notes?.trim()) { text("ADDITIONAL NOTES / INSTRUCTIONS", { bold: true, size: 9, color: "0.02 0.50 0.56" }); text(record.additional_notes, { size: 9 }); }
  if (patient?.allergies?.trim()) { text("RECORDED ALLERGIES (PATIENT RECORD)", { bold: true, size: 9, color: "0.02 0.50 0.56" }); text(patient.allergies, { size: 9 }); }
  if (record.follow_up_date) text(`Follow-up date: ${fmtDate(record.follow_up_date)}`, { bold: true, size: 9 });
  if (y < 150) newPage();
  y -= 15; line();
  text("Please contact the clinic if you need clarification on these instructions.", { size: 8, color: "0.35 0.38 0.42" });
  y -= 20;
  commands.push(`0.40 0.43 0.46 RG 0.7 w 370 ${y} m 548 ${y} l S`);
  text(record.doctor_name || "Prescribing Dentist", { bold: true, size: 9, x: 370 });
  text("Signature / Clinic Seal", { size: 8, x: 390, color: "0.35 0.38 0.42" });
  pages.push(commands);

  const objects: string[] = ["", "<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  const pageIds: number[] = [];
  pages.forEach((pageCommands, index) => {
    const pageId = 5 + index * 2; const contentsId = pageId + 1; pageIds.push(pageId);
    const stream = `${pageCommands.join("\n")}\n`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentsId} 0 R >>`;
    objects[contentsId] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
  });
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n%DentalCareCenter\n";
  const offsets: number[] = [0];
  for (let index = 1; index < objects.length; index++) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index++) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PrescriptionsAdmin({ dentists }: { dentists: ApiDentist[] }) {
  const [query, setQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [history, setHistory] = useState<PrescriptionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [patientForm, setPatientForm] = useState<PatientForm>(emptyPatient);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [medicineRows, setMedicineRows] = useState<MedicineRow[]>([]);
  const [catalogue, setCatalogue] = useState<MedicineRecord[]>([]);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [suggestionFor, setSuggestionFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MedicineRecord[]>([]);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [catalogueEditId, setCatalogueEditId] = useState<number | null>(null);
  const [catalogueForm, setCatalogueForm] = useState({ name: "", generic_name: "", brand_name: "", strength: "", dosage_form: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<PrescriptionRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedDoctor = useMemo(() => {
    if (savedPrescription) return { name: savedPrescription.doctor_name, qualification: savedPrescription.doctor_qualification || "" };
    return dentists.find(dentist => String(dentist.id) === draft.doctor_id) || null;
  }, [savedPrescription, dentists, draft.doctor_id]);

  const loadCatalogue = async () => {
    try { setCatalogue(await api.searchMedicines()); }
    catch (error: any) { toast.error(error?.message || "Unable to load medicine catalogue."); }
  };
  useEffect(() => { loadCatalogue(); }, []);

  useEffect(() => {
    if (!medicineSearch.trim() || medicineSearch.trim().length < 2) { setSuggestions([]); return; }
    const timer = window.setTimeout(async () => {
      try { setSuggestions(await api.searchMedicines(medicineSearch.trim())); }
      catch { setSuggestions(catalogue.filter(item => `${item.name} ${item.generic_name || ""} ${item.brand_name || ""}`.toLowerCase().includes(medicineSearch.toLowerCase())).slice(0, 10)); }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [medicineSearch, catalogue]);

  const loadHistory = async (patientId: number) => {
    setHistoryLoading(true);
    try { setHistory(await api.patientPrescriptionHistory(patientId)); }
    catch (error: any) { toast.error(error?.message || "Unable to load this patient's prescription history."); setHistory([]); }
    finally { setHistoryLoading(false); }
  };
  const selectPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient); setPatientResults([]); setRegisterOpen(false); setEditorOpen(false); setSavedPrescription(null); setPreviewOpen(false); setMedicineRows([]);
    void loadHistory(patient.id);
  };

  const searchPatients = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (query.trim().length < 2) { toast.error("Enter at least two characters, or a few digits of a phone number, to search."); return; }
    setSearching(true);
    try { setPatientResults(await api.searchPatients(query.trim())); }
    catch (error: any) { toast.error(error?.message || "Patient search failed. Make sure the prescription migration is applied."); }
    finally { setSearching(false); }
  };

  const registerPatient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!patientForm.full_name.trim()) { toast.error("Patient full name is required."); return; }
    if (!patientForm.phone.trim() || !patientForm.email.trim()) { toast.error("Phone and email are both required for patient identity checks."); return; }
    setSaving(true);
    try {
      const response: any = await api.createPatient({ ...patientForm, full_name: patientForm.full_name.trim(), phone: patientForm.phone.trim(), email: patientForm.email.trim().toLowerCase(), date_of_birth: patientForm.date_of_birth || null });
      const patient = response.patient || response;
      setPatientForm(emptyPatient); setRegisterOpen(false); setQuery(patient.phone || patient.email); setPatientResults([]);
      selectPatient(patient);
      toast.success(response.existing ? "This patient already exists; opened the matched record." : "Patient registered successfully.");
    } catch (error: any) {
      if (error.status === 409 && Array.isArray(error.data?.matches)) setPatientResults(error.data.matches);
      toast.error(error?.message || "Unable to register patient.");
    } finally { setSaving(false); }
  };

  const beginPrescription = () => {
    if (!selectedPatient) { toast.error("Search for and select a patient first."); return; }
    setSavedPrescription(null); setDraft(emptyDraft()); setMedicineRows([]); setEditorOpen(true); setPreviewOpen(false);
  };

  const updateMedicineRow = (localId: string, key: keyof PrescriptionMedicine, value: string | number | null) => {
    setMedicineRows(rows => rows.map(row => row.localId === localId ? { ...row, [key]: value, ...(key === "medicine_name" ? { medicine_id: null } : {}) } : row));
  };
  const chooseSuggestion = (row: MedicineRow, medicine: MedicineRecord) => {
    setMedicineRows(rows => rows.map(item => item.localId === row.localId ? { ...item, medicine_id: medicine.id, medicine_name: medicine.name, strength: item.strength || medicine.strength || "" } : item));
    setMedicineSearch(""); setSuggestions([]); setSuggestionFor(null);
  };
  const moveMedicine = (index: number, delta: number) => {
    setMedicineRows(rows => { const next = [...rows]; const to = index + delta; if (to < 0 || to >= next.length) return rows; [next[index], next[to]] = [next[to], next[index]]; return next; });
  };

  const savePrescription = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPatient) { toast.error("Select a patient first."); return; }
    if (!draft.doctor_id) { toast.error("Choose the prescribing dentist."); return; }
    if (medicineRows.some(row => !row.medicine_name.trim())) { toast.error("Complete or remove each medicine row before saving."); return; }
    setSaving(true);
    try {
      const record = await api.createPrescription({
        patient_id: selectedPatient.id, doctor_id: Number(draft.doctor_id),
        prescription_date: draft.prescription_date, follow_up_date: draft.follow_up_date || null,
        chief_complaint: draft.chief_complaint, clinical_observations: draft.clinical_observations,
        diagnosis: draft.diagnosis, treatment_plan: draft.treatment_plan, additional_notes: draft.additional_notes,
        medicines: medicineRows.map(({ localId: _localId, ...medicine }) => medicine),
      });
      setSavedPrescription(record); setEditorOpen(false); setPreviewOpen(true); await loadHistory(selectedPatient.id);
      toast.success(`Prescription ${record.prescription_number} saved to MySQL.`);
    } catch (error: any) { toast.error(error?.message || "Unable to save prescription."); }
    finally { setSaving(false); }
  };

  const downloadPrescription = (record: PrescriptionRecord) => {
    const blob = createPrescriptionPdf(record);
    downloadBlob(blob, `${record.prescription_number || "dental-prescription"}.pdf`);
    toast.success("Prescription PDF downloaded.");
  };
  const sharePrescription = async (record: PrescriptionRecord) => {
    const blob = createPrescriptionPdf(record);
    const fileName = `${record.prescription_number || "dental-prescription"}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });
    const shareNavigator = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data?: ShareData) => Promise<void> };
    try {
      if (shareNavigator.share && shareNavigator.canShare?.({ files: [file] })) {
        await shareNavigator.share({ files: [file], title: `Prescription ${record.prescription_number}`, text: `Dental Care Center prescription for ${record.patient?.full_name || "patient"}.` });
        toast.success("Prescription shared.");
      } else {
        downloadBlob(blob, fileName);
        toast.info("File sharing is not supported in this browser. The PDF was downloaded so you can attach it in your preferred app.");
      }
    } catch (error: any) { if (error?.name !== "AbortError") toast.error("Unable to share automatically. Download the PDF and share it manually."); }
  };

  const openHistoryRecord = async (id: number, action: "view" | "print" | "download" | "share" = "view") => {
    try {
      const record = await api.getPrescription(id);
      if (record.patient) {
        setSelectedPatient(record.patient);
        await loadHistory(record.patient.id);
      }
      setSavedPrescription(record); setEditorOpen(false); setPreviewOpen(true);
      if (action === "download") downloadPrescription(record);
      else if (action === "share") void sharePrescription(record);
      else if (action === "print") window.setTimeout(() => window.print(), 250);
    } catch (error: any) { toast.error(error?.message || "Unable to open that prescription."); }
  };

  const saveCatalogueItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!catalogueForm.name.trim()) { toast.error("Medicine name is required."); return; }
    setSaving(true);
    try {
      const payload = { ...catalogueForm, name: catalogueForm.name.trim() };
      const saved = catalogueEditId ? await api.updateMedicine(catalogueEditId, payload) : await api.createMedicine(payload);
      await loadCatalogue(); setCatalogueOpen(false); setCatalogueEditId(null); setCatalogueForm({ name: "", generic_name: "", brand_name: "", strength: "", dosage_form: "", notes: "" });
      toast.success(catalogueEditId ? `${saved.name} updated.` : `${saved.name} added to the medicine catalogue.`);
    } catch (error: any) { toast.error(error?.message || "Unable to add medicine."); }
    finally { setSaving(false); }
  };

  const currentDocument = useMemo<PrescriptionRecord | null>(() => {
    if (!previewOpen) return null;
    if (savedPrescription) return savedPrescription;
    if (!selectedPatient || !selectedDoctor) return null;
    return {
      id: 0, prescription_number: "DRAFT — UNSAVED", patient_id: selectedPatient.id,
      doctor_id: Number(draft.doctor_id), doctor_name: selectedDoctor.name,
      doctor_qualification: "qualification" in selectedDoctor ? selectedDoctor.qualification : "",
      prescription_date: draft.prescription_date, chief_complaint: draft.chief_complaint,
      clinical_observations: draft.clinical_observations, diagnosis: draft.diagnosis,
      treatment_plan: draft.treatment_plan, additional_notes: draft.additional_notes,
      follow_up_date: draft.follow_up_date || null, created_by: "Draft", created_at: new Date().toISOString(),
      patient: selectedPatient, medicines: medicineRows.map(({ localId: _localId, ...medicine }) => medicine),
    };
  }, [previewOpen, savedPrescription, selectedPatient, selectedDoctor, draft, medicineRows]);

  const downloadDraftOrSaved = () => {
    if (!currentDocument) { toast.error("Select a patient and dentist before previewing the prescription."); return; }
    if (!currentDocument.id) { toast.error("Save the prescription before downloading or sharing a final PDF."); return; }
    downloadPrescription(currentDocument);
  };
  const shareDraftOrSaved = () => {
    if (!currentDocument) return;
    if (!currentDocument.id) { toast.error("Save the prescription before sharing the final PDF."); return; }
    void sharePrescription(currentDocument);
  };

  return <div className="space-y-6 max-w-[1400px]">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div><h2 className="font-bold text-xl" style={{ color: DARK }}>Prescription Management</h2><p className="text-sm text-gray-500 mt-1">Register patients, review their history, and save signed-off clinical prescriptions securely in MySQL.</p></div>
      <div className="flex gap-2 flex-wrap"><button type="button" onClick={() => setCatalogueOpen(v => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700"><Database className="w-4 h-4" /> Medicine Catalogue</button>{selectedPatient && <button type="button" onClick={beginPrescription} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: BLUE }}><Plus className="w-4 h-4" /> Create New Prescription</button>}</div>
    </div>

    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3"><Search className="w-5 h-5" style={{ color: BLUE }} /><h3 className="font-bold" style={{ color: DARK }}>Find a Patient</h3></div>
      <form onSubmit={searchPatients} className="flex flex-col sm:flex-row gap-3"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by patient name, phone number, or email" className={`${inputClass} flex-1`} aria-label="Search patients by name, phone or email" /><button disabled={searching} className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: BLUE }}><Search className="w-4 h-4" />{searching ? "Searching…" : "Search"}</button><button type="button" onClick={() => { setRegisterOpen(v => !v); setPatientForm(form => ({ ...form, phone: /^\+?\d/.test(query.trim()) ? query.trim() : form.phone, email: query.includes("@") ? query.trim() : form.email, full_name: !query.includes("@") && !/^\+?\d/.test(query.trim()) ? query.trim() : form.full_name })); }} className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"><UserRoundPlus className="w-4 h-4" />Register New Patient</button></form>
      {patientResults.length > 0 && <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{patientResults.map(patient => <button type="button" key={patient.id} onClick={() => selectPatient(patient)} className="text-left border border-gray-100 rounded-xl p-4 hover:border-sky-200 hover:bg-sky-50/40 transition-colors"><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: BLUE }}>{patient.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div><div className="font-semibold text-sm" style={{ color: DARK }}>{patient.full_name}</div></div><div className="text-xs text-gray-500 mt-2">{patient.phone} · {patient.email}</div><div className="text-xs mt-2 font-semibold" style={{ color: BLUE }}>Select patient →</div></button>)}</div>}
      {patientResults.length === 0 && query.trim().length >= 2 && !searching && <div className="text-xs text-gray-400 mt-3">No matches are currently displayed. Run Search, or register the patient if no record exists.</div>}
      {registerOpen && <form onSubmit={registerPatient} className="mt-5 border-t border-gray-100 pt-5 space-y-4">
        <div className="flex items-center justify-between"><h4 className="font-bold" style={{ color: DARK }}>Register Patient</h4><button type="button" onClick={() => setRegisterOpen(false)} aria-label="Close patient registration" className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><label className={labelClass}>Full name *</label><input required value={patientForm.full_name} onChange={e => setPatientForm({ ...patientForm, full_name: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Phone number *</label><input required type="tel" value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} placeholder="10-digit Indian mobile" className={inputClass} /></div>
          <div><label className={labelClass}>Email address *</label><input required type="email" value={patientForm.email} onChange={e => setPatientForm({ ...patientForm, email: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Date of birth (optional)</label><input type="date" value={patientForm.date_of_birth} onChange={e => setPatientForm({ ...patientForm, date_of_birth: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Gender (optional)</label><select value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })} className={inputClass}><option value="">Not provided</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></div>
          <div><label className={labelClass}>Known allergies (optional)</label><input value={patientForm.allergies} onChange={e => setPatientForm({ ...patientForm, allergies: e.target.value })} placeholder="Only if provided" className={inputClass} /></div>
          <div className="sm:col-span-2 lg:col-span-3"><label className={labelClass}>Medical history (optional)</label><textarea rows={2} value={patientForm.medical_history} onChange={e => setPatientForm({ ...patientForm, medical_history: e.target.value })} placeholder="Enter only information provided by the patient" className={inputClass} /></div>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setRegisterOpen(false)} className="px-4 py-2.5 rounded-xl border text-sm">Cancel</button><button disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: BLUE }}>{saving ? "Saving…" : "Save Patient"}</button></div>
      </form>}
    </section>

    {selectedPatient && <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-3"><div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: BLUE }}><UserRound className="w-6 h-6" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-lg" style={{ color: DARK }}>{selectedPatient.full_name}</h3><span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Patient ID #{selectedPatient.id}</span></div><p className="text-sm text-gray-500 mt-1">{selectedPatient.phone} · {selectedPatient.email}</p><p className="text-xs text-gray-400 mt-1">DOB: {prettyDate(selectedPatient.date_of_birth)}{selectedPatient.gender ? ` · ${selectedPatient.gender}` : ""}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={beginPrescription} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: BLUE }}><Plus className="w-4 h-4" />Create New Prescription</button><button type="button" onClick={() => { setSelectedPatient(null); setHistory([]); setSavedPrescription(null); setPreviewOpen(false); setEditorOpen(false); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">Clear selection</button></div>
      </div>
      {(selectedPatient.medical_history || selectedPatient.allergies) && <div className="grid md:grid-cols-2 gap-3 mt-4">{selectedPatient.medical_history && <div className="rounded-xl bg-gray-50 p-3"><div className="text-xs font-bold text-gray-500 mb-1">Medical history (provided)</div><p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPatient.medical_history}</p></div>}{selectedPatient.allergies && <div className="rounded-xl bg-amber-50 p-3"><div className="text-xs font-bold text-amber-800 mb-1">Recorded allergies</div><p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedPatient.allergies}</p></div>}</div>}
      <div className="mt-5 pt-5 border-t border-gray-100"><div className="flex items-center justify-between gap-3 mb-3"><h4 className="font-bold" style={{ color: DARK }}>Prescription History</h4><span className="text-xs text-gray-400">Records for this patient only</span></div>
        {historyLoading ? <p className="text-sm text-gray-400 py-4">Loading prescription history…</p> : history.length ? <div className="space-y-3">{history.map(item => <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><div className="font-semibold text-sm" style={{ color: DARK }}>{item.prescription_number}</div><div className="text-xs text-gray-500 mt-1">{prettyDate(item.prescription_date)} · {item.doctor_name}</div>{item.diagnosis && <div className="text-sm text-gray-600 mt-1">Diagnosis: {item.diagnosis}</div>}<div className="text-xs text-gray-400 mt-1">{Number(item.medicine_count || 0)} medicine item(s) · Recorded by {item.created_by}</div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void openHistoryRecord(item.id, "view")} className="px-3 py-2 rounded-lg border text-xs font-semibold">View</button><button type="button" onClick={() => void openHistoryRecord(item.id, "print")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold"><Printer className="w-3.5 h-3.5" />Print</button><button type="button" onClick={() => void openHistoryRecord(item.id, "download")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold"><Download className="w-3.5 h-3.5" />PDF</button><button type="button" onClick={() => void openHistoryRecord(item.id, "share")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold"><Share2 className="w-3.5 h-3.5" />Share</button></div></div>)}</div> : <div className="border border-dashed border-gray-200 rounded-xl text-center p-7"><BookOpen className="w-7 h-7 mx-auto text-gray-300 mb-2"/><p className="text-sm text-gray-500">No prescriptions have been recorded for this patient yet.</p><button type="button" onClick={beginPrescription} className="mt-3 text-sm font-semibold" style={{ color: BLUE }}>Create the first prescription</button></div>}
      </div>
    </section>}

    {catalogueOpen && <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4"><div><h3 className="font-bold" style={{ color: DARK }}>Medicine Catalogue</h3><p className="text-xs text-gray-500 mt-1">Suggestions only. The clinician decides whether and how to prescribe.</p></div><button type="button" onClick={() => setCatalogueOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
      <form onSubmit={saveCatalogueItem} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {([{key:"name",label:"Medicine name *"},{key:"generic_name",label:"Generic name"},{key:"brand_name",label:"Brand name"},{key:"strength",label:"Strength"},{key:"dosage_form",label:"Dosage form"},{key:"notes",label:"Catalogue notes"}] as const).map(field => <div key={field.key}><label className={labelClass}>{field.label}</label><input required={field.key === "name"} value={catalogueForm[field.key]} onChange={e => setCatalogueForm({ ...catalogueForm, [field.key]: e.target.value })} className={inputClass} /></div>)}
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2"><button type="button" onClick={() => { setCatalogueEditId(null); setCatalogueForm({ name: "", generic_name: "", brand_name: "", strength: "", dosage_form: "", notes: "" }); }} className="px-4 py-2.5 rounded-xl border text-sm">Clear form</button><button disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: BLUE }}>{saving ? "Saving…" : catalogueEditId ? "Save Catalogue Changes" : "Add to Catalogue"}</button></div>
      </form>
      <div className="mt-5 border-t border-gray-100 pt-4"><div className="text-sm font-bold mb-2" style={{ color: DARK }}>Active catalogue entries ({catalogue.length})</div>{catalogue.length ? <div className="divide-y divide-gray-100">{catalogue.map(item => <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><div className="text-sm font-semibold">{item.name}</div><div className="text-xs text-gray-500 mt-0.5">{[item.generic_name, item.brand_name, item.strength, item.dosage_form].filter(Boolean).join(" · ") || "No extra catalogue details"}</div></div><div className="flex gap-2"><button type="button" onClick={() => { setCatalogueEditId(item.id); setCatalogueForm({ name:item.name, generic_name:item.generic_name || "", brand_name:item.brand_name || "", strength:item.strength || "", dosage_form:item.dosage_form || "", notes:item.notes || "" }); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }} className="px-3 py-1.5 rounded-lg border text-xs">Edit</button><button type="button" onClick={async () => { if (!window.confirm(`Deactivate ${item.name} in the medicine catalogue? Existing prescriptions will retain their saved medicine details.`)) return; try { await api.removeMedicine(item.id); await loadCatalogue(); toast.success(`${item.name} deactivated.`); } catch (error:any) { toast.error(error?.message || "Unable to deactivate medicine."); } }} className="px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-500">Deactivate</button></div></div>)}</div> : <p className="text-sm text-gray-400 py-3">Catalogue is empty. Add verified catalogue entries above; no medicines are prefilled or recommended.</p>}</div>
    </section>}

    {editorOpen && selectedPatient && <form onSubmit={savePrescription} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="font-bold text-lg" style={{ color: DARK }}>New Prescription</h3><p className="text-sm text-gray-500 mt-1">For {selectedPatient.full_name}. The final saved record is immutable; review all clinical details before saving.</p></div><button type="button" onClick={() => setEditorOpen(false)} className="self-start sm:self-auto px-3 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div><label className={labelClass}>Prescribing dentist *</label><select required value={draft.doctor_id} onChange={e => setDraft({ ...draft, doctor_id: e.target.value })} className={inputClass}><option value="">Select dentist</option>{dentists.map(d => <option key={d.id} value={d.id}>{d.name} — {d.qualification}</option>)}</select></div>
        <div><label className={labelClass}>Prescription date *</label><input type="date" required value={draft.prescription_date} onChange={e => setDraft({ ...draft, prescription_date: e.target.value })} className={inputClass} /></div>
        <div><label className={labelClass}>Follow-up date</label><input type="date" value={draft.follow_up_date} min={draft.prescription_date} onChange={e => setDraft({ ...draft, follow_up_date: e.target.value })} className={inputClass} /></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div><label className={labelClass}>Chief complaint</label><textarea rows={2} value={draft.chief_complaint} onChange={e => setDraft({ ...draft, chief_complaint: e.target.value })} className={inputClass} placeholder="Enter the patient's complaint as reported" /></div>
        <div><label className={labelClass}>Clinical observations</label><textarea rows={2} value={draft.clinical_observations} onChange={e => setDraft({ ...draft, clinical_observations: e.target.value })} className={inputClass} placeholder="Enter verified clinical observations" /></div>
        <div><label className={labelClass}>Diagnosis</label><textarea rows={2} value={draft.diagnosis} onChange={e => setDraft({ ...draft, diagnosis: e.target.value })} className={inputClass} placeholder="Doctor-entered diagnosis" /></div>
        <div><label className={labelClass}>Treatment plan</label><textarea rows={2} value={draft.treatment_plan} onChange={e => setDraft({ ...draft, treatment_plan: e.target.value })} className={inputClass} placeholder="Doctor-entered treatment plan" /></div>
      </div>
      <div className="border-t border-gray-100 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><div><h4 className="font-bold" style={{ color: DARK }}>Medicine entries</h4><p className="text-xs text-gray-500 mt-1">No dose or frequency is chosen automatically.</p></div><button type="button" onClick={() => setMedicineRows(rows => [...rows, newMedicineRow()])} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border" style={{ color: BLUE, borderColor: "#BCEBFA" }}><Plus className="w-4 h-4" />Add Medicine</button></div>
        {medicineRows.length === 0 && <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400"><Pill className="w-6 h-6 mx-auto mb-2 text-gray-300"/>No medicine entries. Add a medicine only if clinically appropriate.</div>}
        <div className="space-y-4">{medicineRows.map((row, index) => <div key={row.localId} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
          <div className="flex items-center justify-between gap-2 mb-3"><div className="text-sm font-bold" style={{ color: DARK }}>Medicine {index + 1}</div><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => moveMedicine(index, -1)} aria-label="Move medicine up" className="p-2 rounded-lg hover:bg-white disabled:opacity-30"><ChevronUp className="w-4 h-4"/></button><button type="button" disabled={index === medicineRows.length - 1} onClick={() => moveMedicine(index, 1)} aria-label="Move medicine down" className="p-2 rounded-lg hover:bg-white disabled:opacity-30"><ChevronDown className="w-4 h-4"/></button><button type="button" onClick={() => setMedicineRows(rows => rows.filter(item => item.localId !== row.localId))} aria-label="Remove medicine" className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button></div></div>
          <div className="relative mb-3"><label className={labelClass}>Medicine name * (catalogue suggestions or custom)</label><input value={row.medicine_name} onFocus={() => { setSuggestionFor(row.localId); setMedicineSearch(row.medicine_name); }} onChange={e => { updateMedicineRow(row.localId, "medicine_name", e.target.value); setSuggestionFor(row.localId); setMedicineSearch(e.target.value); }} className={inputClass} placeholder="Start typing a medicine name" autoComplete="off" />
            {suggestionFor === row.localId && suggestions.length > 0 && <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl max-h-52 overflow-y-auto">{suggestions.map(medicine => <button key={medicine.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => chooseSuggestion(row, medicine)} className="w-full text-left px-3 py-3 hover:bg-sky-50 border-b border-gray-50 last:border-b-0"><span className="block text-sm font-semibold" style={{ color: DARK }}>{medicine.name}</span><span className="block text-xs text-gray-500 mt-0.5">{[medicine.generic_name, medicine.brand_name, medicine.strength, medicine.dosage_form].filter(Boolean).join(" · ") || "Catalogue entry"}</span></button>)}</div>}
            {suggestionFor === row.localId && row.medicine_name.trim().length >= 2 && <button type="button" onClick={() => { setCatalogueEditId(null); setCatalogueForm({ name: row.medicine_name.trim(), generic_name: "", brand_name: "", strength: "", dosage_form: "", notes: "" }); setCatalogueOpen(true); setSuggestionFor(null); }} className="text-xs mt-1 font-semibold" style={{ color: BLUE }}>+ Add this name to the medicine catalogue</button>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {([{key:"strength",label:"Strength / formulation",placeholder:"As directed"},{key:"dose",label:"Dose",placeholder:"Doctor enters dose"},{key:"route",label:"Route",placeholder:"e.g. Oral"},{key:"frequency",label:"Frequency",placeholder:"Doctor enters frequency"},{key:"duration",label:"Duration",placeholder:"As directed"},{key:"quantity",label:"Quantity",placeholder:"Quantity"}] as const).map(field => <div key={field.key}><label className={labelClass}>{field.label}</label><input value={String(row[field.key] || "")} onChange={e => updateMedicineRow(row.localId, field.key, e.target.value)} placeholder={field.placeholder} className={inputClass}/></div>)}
            <div className="sm:col-span-2"><label className={labelClass}>Instructions</label><input value={String(row.instructions || "")} onChange={e => updateMedicineRow(row.localId, "instructions", e.target.value)} placeholder="Patient-facing instructions entered by doctor" className={inputClass}/></div>
            <div className="sm:col-span-2"><label className={labelClass}>Additional medicine notes</label><input value={String(row.notes || "")} onChange={e => updateMedicineRow(row.localId, "notes", e.target.value)} placeholder="Optional note" className={inputClass}/></div>
          </div>
        </div>)}</div>
      </div>
      <div><label className={labelClass}>Additional notes / instructions</label><textarea rows={3} value={draft.additional_notes} onChange={e => setDraft({ ...draft, additional_notes: e.target.value })} className={inputClass} placeholder="Any additional directions entered by the doctor" /></div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={() => { setPreviewOpen(true); setSavedPrescription(null); }} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold"><FileText className="w-4 h-4"/>Preview Prescription</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: BLUE }}><Save className="w-4 h-4"/>{saving ? "Saving to MySQL…" : "Save Prescription"}</button></div>
    </form>}

    {previewOpen && currentDocument && <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="font-bold text-lg" style={{ color: DARK }}>Prescription Preview</h3><p className="text-xs text-gray-500 mt-1">{currentDocument.id ? "Saved clinical record — finalized prescriptions are not editable." : "This is a draft preview. Save it to store a permanent MySQL record and enable final PDF sharing."}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"><Printer className="w-4 h-4"/>Print</button><button type="button" onClick={downloadDraftOrSaved} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"><FileDown className="w-4 h-4"/>Download PDF</button><button type="button" onClick={shareDraftOrSaved} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"><Share2 className="w-4 h-4"/>Share</button>{!savedPrescription && <button type="button" onClick={() => setEditorOpen(true)} className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: BLUE }}>Edit Prescription</button>}<button type="button" onClick={() => setPreviewOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close prescription preview"><X className="w-4 h-4"/></button></div></div>
      <PrescriptionDocument record={currentDocument}/>
    </section>}

    {!selectedPatient && !registerOpen && <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center"><ClipboardList className="w-9 h-9 mx-auto text-gray-300 mb-3"/><h3 className="font-semibold" style={{ color: DARK }}>Select or register a patient to continue</h3><p className="text-sm text-gray-500 mt-1">Prescription history and clinical documents will be scoped to the selected patient.</p></div>}

    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 flex items-start gap-3"><AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/><div className="text-xs text-amber-900 leading-relaxed"><strong>Clinical responsibility and privacy:</strong> This tool stores only information entered by authorized staff. It does not infer diagnoses or select doses. The current project has a single shared Admin account, not individual doctor accounts; the backend protects management/prescription APIs with a server-verified session, so change the example credentials and set a strong session secret before using real patient data.</div></div>
  </div>;
}
