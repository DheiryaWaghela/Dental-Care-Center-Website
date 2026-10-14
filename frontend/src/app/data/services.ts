// ─── SERVICES — MANUAL / DEFAULT DATA ───────────────────────
//
// Manual/default data source for the services list. Used automatically
// when the database/API has no service records yet; Admin Panel/database
// data will override this once connected (later phases).
//
// NOTE: In the original App.tsx, each service stored its icon as a JSX
// element (e.g. `<Sparkles className="w-6 h-6" />`). Plain data files
// (.ts) cannot contain JSX, so each service now stores an `icon` KEY
// (a plain string) instead. App.tsx maps this key back to the actual
// lucide-react icon component via the `SERVICE_ICONS` lookup — this is
// the "small TypeScript change" needed to move the data out of App.tsx.
// The rendered icons are visually identical to before.

export type ServiceCategory = "All" | "Preventive" | "Restorative" | "Cosmetic" | "Emergency";

export type ServiceIconKey =
  | "sparkles"
  | "alert-circle"
  | "award"
  | "layers"
  | "smile"
  | "crown"
  | "eye"
  | "zap"
  | "baby"
  | "activity";

export interface ServiceItem {
  id: number;
  title: string;
  desc: string;
  icon: ServiceIconKey;
  price: string;
  bg: string;
  cat: ServiceCategory;
}

// Solid blue color palette values (copied from App.tsx BLUE / BLUE2 constants)
const BLUE = "#00ABE4";
const BLUE2 = "#028090";

export const SERVICES: ServiceItem[] = [
  { id: 1,  title: "Dental Cleaning",       desc: "Professional scaling and polishing to remove plaque, tartar, and stains for a fresh, healthy smile.",                     icon: "sparkles",     price: "From ₹500",    bg: BLUE,     cat: "Preventive"  },
  { id: 2,  title: "Root Canal Treatment",  desc: "Pain-free root canal therapy using advanced rotary techniques to save your natural tooth.",                               icon: "alert-circle", price: "From ₹2,500",  bg: BLUE2,    cat: "Restorative" },
  { id: 3,  title: "Dental Implants",       desc: "Titanium implants that look, feel, and function like natural teeth — a permanent, life-changing solution.",              icon: "award",        price: "From ₹15,000", bg: BLUE,     cat: "Restorative" },
  { id: 4,  title: "Braces & Aligners",     desc: "Traditional braces and clear aligners to straighten teeth discreetly and effectively.",                                   icon: "layers",       price: "From ₹12,000", bg: BLUE2,    cat: "Cosmetic"    },
  { id: 5,  title: "Teeth Whitening",       desc: "Professional laser whitening treatments to remove stains and brighten your smile by several shades.",                     icon: "smile",        price: "From ₹3,000",  bg: BLUE,     cat: "Cosmetic"    },
  { id: 6,  title: "Dental Crowns",         desc: "Custom-made crowns and bridges to restore damaged or missing teeth with natural-looking aesthetics.",                     icon: "crown",        price: "From ₹4,000",  bg: BLUE2,    cat: "Restorative" },
  { id: 7,  title: "Veneers",               desc: "Ultra-thin porcelain veneers that transform your smile by correcting shape, color, and alignment.",                       icon: "eye",          price: "From ₹8,000",  bg: BLUE,     cat: "Cosmetic"    },
  { id: 8,  title: "Cosmetic Dentistry",    desc: "Comprehensive smile makeovers combining multiple procedures tailored to your unique aesthetic goals.",                    icon: "zap",          price: "Custom Quote", bg: BLUE2,    cat: "Cosmetic"    },
  { id: 9,  title: "Pediatric Dentistry",   desc: "Gentle, child-friendly dental care designed to make young patients comfortable and cavity-free.",                         icon: "baby",         price: "From ₹400",    bg: BLUE,     cat: "Preventive"  },
  { id: 10, title: "Gum Treatment",         desc: "Advanced periodontal treatment including deep cleaning, scaling, and root planing for healthy gums.",                     icon: "activity",     price: "From ₹1,500",  bg: BLUE2,    cat: "Restorative" },
  { id: 11, title: "Emergency Dental Care", desc: "Immediate relief for toothaches, broken teeth, and dental emergencies — available on priority 24/7.",                    icon: "zap",          price: "Call Now",     bg: "#B03A2E", cat: "Emergency"  },
];

export const SERVICE_CATS: ServiceCategory[] = ["All", "Preventive", "Restorative", "Cosmetic", "Emergency"];
