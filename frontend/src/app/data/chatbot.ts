// ─── CHATBOT — MANUAL / DEFAULT DATA ────────────────────────
//
// Manual/default canned-reply data for the on-site chatbot widget.
// Used automatically when the database/API has no chatbot FAQ
// records yet; Admin Panel/database data (Chatbot FAQs section)
// will override this once connected (later phases).

export const BOT: Record<string, string> = {
  greeting:    "Hello! 👋 Welcome to Dental Care Center. I'm your virtual assistant. How can I help you today?",
  services:    "We offer comprehensive dental services:\n• Dental Cleaning & Scaling\n• Root Canal Treatment\n• Dental Implants\n• Braces & Clear Aligners\n• Teeth Whitening\n• Crowns & Veneers\n• Pediatric Dentistry\n• Emergency Care\n\nAsk me about any specific service!",
  hours:       "🕐 Working Hours:\n• Mon–Sat: 9:00 AM – 9:00 PM\n• Sunday: 10:00 AM – 4:00 PM\n• Emergency: 24/7\n\nCall +91 98765 43210 anytime!",
  location:    "📍 Find us at:\nShop No. 12, Sai Complex, SV Road,\nJogeshwari West, Mumbai – 400102\n\nLandmark: Near Jogeshwari Station (WR Line)\nEasy parking available!",
  appointment: "📅 Book your appointment:\n1. Use our online form below\n2. Call: +91 98765 43210\n3. WhatsApp: +91 98765 43210\n4. Email: info@dentalcarecenter.in\n\nConfirmation within 2 hours! ✅",
  cost:        "💰 Treatment price range:\n• Cleaning: ₹500+\n• Root Canal: ₹2,500+\n• Implants: ₹15,000+\n• Braces: ₹12,000+\n• Whitening: ₹3,000+\n\nEMI available! Exact quote after consultation.",
  emergency:   "🚨 Dental Emergency?\nCall NOW: +91 98765 43210\nWe're available 24/7!\n\nWe handle:\n• Severe toothaches\n• Broken/chipped teeth\n• Lost crown or filling\n• Dental abscess\n\nDon't wait — call us immediately!",
  tips:        "🦷 Daily Dental Tips:\n1. Brush twice daily, 2 minutes each\n2. Floss every night before bed\n3. Use fluoride toothpaste\n4. Stay hydrated — water fights bacteria\n5. Limit sugary drinks and snacks\n6. Visit us every 6 months!\n\nHealthy habits = beautiful smiles! 😊",
  fallback:    "I'm not sure about that! Our team can help:\n• Call: +91 98765 43210\n• WhatsApp us anytime\n• Email: info@dentalcarecenter.in\n\nWe're always here for you! 😊",
};

export const QUICK_REPLIES = [
  { label: "📋 Services",         key: "services"    },
  { label: "📅 Book Appointment", key: "appointment" },
  { label: "🕐 Working Hours",    key: "hours"       },
  { label: "📍 Our Location",     key: "location"    },
  { label: "💰 Treatment Costs",  key: "cost"        },
  { label: "🚨 Emergency",        key: "emergency"   },
  { label: "🦷 Dental Tips",      key: "tips"        },
];
