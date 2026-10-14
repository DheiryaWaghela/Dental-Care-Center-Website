// ─── DENTISTS — MANUAL / DEFAULT DATA ───────────────────────
//
// This is the developer-friendly "manual" data source for dentist profiles.
// It is used automatically when the database/API has no dentist records yet.
// Once the Admin Panel + backend are connected (later phases), any dentists
// added/edited from the Admin Panel will come from the database instead and
// will take priority over this file.
//
// To edit a dentist by hand, just change the values below.
// To change a dentist's photo, replace the file at the given `img` path
// inside `frontend/public/images/dentists/` (keep the same filename).

export interface Dentist {
  id: number;
  name: string;
  qual: string;
  spec: string;
  exp: string;
  timing: string;
  img: string;
}

export const DENTISTS: Dentist[] = [
  { id: 1, name: "Dr. Akhilesh Yadav", qual: "BDS, MDS (Orthodontics)",      spec: "Orthodontics & Clear Aligners", exp: "12 Years", timing: "Mon–Fri: 9AM–5PM",  img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=450&fit=crop&auto=format" },
  { id: 2, name: "Dr. Rahul Mehta",    qual: "BDS, MDS (Endodontics)",      spec: "Root Canal Specialist",         exp: "8 Years",  timing: "Mon–Sat: 11AM–7PM", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=450&fit=crop&auto=format" },
  { id: 3, name: "Dr. Ananya Joshi",   qual: "BDS, Cert. Cosmetic Dentistry", spec: "Cosmetic & Smile Design",      exp: "6 Years",  timing: "Tue–Sun: 10AM–6PM", img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=450&fit=crop&auto=format" },
  { id: 4, name: "Dr. Vikram Patel",   qual: "BDS, MDS (Periodontology)",   spec: "Gum Treatment & Surgery",       exp: "10 Years", timing: "Mon–Sat: 2PM–9PM",  img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=450&fit=crop&auto=format" },
];
