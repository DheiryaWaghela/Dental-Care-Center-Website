// ─── CLINIC INFO — MANUAL / DEFAULT DATA ────────────────────
//
// A single, centralized place for clinic details (name, contact info,
// address, hours, map links, social links). All values below were
// copied EXACTLY from where they previously appeared, scattered across
// App.tsx (EmergencyStrip, Footer, ContactSection, AppointmentSection,
// the chatbot replies, and the Admin "Settings" tab defaults).
//
// This file is created now so the data has one clear home, matching the
// same pattern as dentists.ts/services.ts/etc. It is NOT yet wired into
// every component that shows clinic info — App.tsx's JSX is left exactly
// as-is for this phase to minimize risk of changing wording/behaviour.
// Wiring these values into the UI (replacing the current inline strings)
// and connecting them to the Admin Panel + database happens in a later
// phase (Phase 6+), once "Manage Clinic Information" is implemented.

export const CLINIC_INFO = {
  name: "Dental Care Center",
  foundedYear: 2009,
  about:
    "Founded in 2009, Dental Care Center has been the trusted dental home for families across Jogeshwari West and beyond. What started as a small practice has grown into one of Mumbai's most respected multi-specialty dental clinics.",

  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",

  whatsapp: "+91 98765 43210",
  whatsappHref: "https://wa.me/919876543210",

  email: "info@dentalcarecenter.in",
  emailHref: "mailto:info@dentalcarecenter.in",

  // Full address as shown on the Appointment section, Contact section and
  // Admin Settings tab.
  address: "Shop No. 12, Sai Complex, SV Road, Jogeshwari West, Mumbai – 400102",
  // Shorter variant used in a couple of places (Footer, Hero sub-line).
  addressShort: "Jogeshwari West, Mumbai",
  landmark: "Near Jogeshwari Station (WR Line)",

  hours: {
    weekday: "Mon–Sat: 9:00 AM – 9:00 PM",
    weekdayShort: "Mon–Sat: 9AM–9PM",
    sunday: "Sunday: 10:00 AM – 4:00 PM",
    sundayShort: "Sun: 10AM–4PM",
    emergency: "Emergency: 24/7",
  },

  mapsEmbedUrl:
    "https://maps.google.com/maps?q=Jogeshwari+West,+Mumbai,+Maharashtra+400102&t=&z=15&ie=UTF8&iwloc=&output=embed",
  mapsDirectionsUrl: "https://maps.google.com/?q=Jogeshwari+West+Mumbai",

  social: {
    instagram: "#",
    facebook: "#",
    twitter: "#",
    youtube: "#",
  },
};
