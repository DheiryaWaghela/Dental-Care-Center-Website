// ─── FAQS — MANUAL / DEFAULT DATA ───────────────────────────
//
// Manual/default data source for the public FAQ section. Used
// automatically when the database/API has no FAQ records yet;
// Admin Panel/database data will override this once connected
// (later phases).

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  { q: "What are your working hours?",               a: "We are open Monday to Saturday from 9:00 AM to 9:00 PM, and Sundays from 10:00 AM to 4:00 PM. For dental emergencies, we are available 24/7 — please call our emergency line immediately." },
  { q: "How much does a dental cleaning cost?",      a: "A professional dental cleaning (scaling and polishing) starts from ₹500. The exact cost may vary based on the extent of tartar buildup. We always provide a full cost estimate before starting any procedure." },
  { q: "Do you offer EMI or payment plans?",         a: "Yes! We offer 0% interest EMI plans for major treatments like implants, braces, and smile makeovers. We accept all major credit/debit cards, UPI, and partner with leading healthcare financing providers." },
  { q: "What should I expect during my first visit?", a: "Your first visit includes a comprehensive oral examination, digital X-rays if needed, professional cleaning, and a detailed treatment plan discussion. We typically allocate 60–90 minutes for first-time patients." },
  { q: "Is root canal treatment painful?",           a: "Modern root canal treatment is virtually pain-free! With advanced anesthesia and rotary techniques, most patients feel no more discomfort than a routine filling. We also offer sedation dentistry for anxious patients." },
  { q: "How long do dental implants last?",          a: "Dental implants are designed to last a lifetime with proper care. The titanium post fuses permanently with your jawbone, while the crown typically lasts 15–20 years with good oral hygiene and regular check-ups." },
  { q: "Do you accept health insurance?",            a: "We work with several major insurance providers and corporate health plans. Please bring your insurance card on your first visit and our team will help you understand your coverage and assist with all claim documentation." },
  { q: "How often should I visit the dentist?",      a: "We recommend a professional check-up and cleaning every 6 months for most patients. Those with gum disease, a history of cavities, or wearing braces may need more frequent visits — typically every 3–4 months." },
];
