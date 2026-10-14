// ─── TESTIMONIALS — MANUAL / DEFAULT DATA ───────────────────
//
// Manual/default data source for patient reviews. Used automatically
// when the database/API has no testimonial records yet; Admin Panel/
// database data will override this once connected (later phases).

export interface Testimonial {
  id: number;
  name: string;
  loc: string;
  rating: number;
  review: string;
  treatment: string;
  av: string; // avatar initials shown when no photo is available
}

export const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Rajesh Kumar",    loc: "Andheri, Mumbai",   rating: 5, review: "I had severe tooth pain and was terrified of root canals. Dr. Rahul made the entire process completely painless. The clinic is spotless and the staff is incredibly warm. Absolutely recommend to anyone!",   treatment: "Root Canal Treatment", av: "RK" },
  { id: 2, name: "Priya Nair",      loc: "Goregaon, Mumbai",  rating: 5, review: "Got dental implants after losing a tooth in an accident. The results are phenomenal — I can't even tell which one is the implant! Dr. Vikram's expertise and attention to detail is simply unmatched.", treatment: "Dental Implants",      av: "PN" },
  { id: 3, name: "Arjun Singh",     loc: "Borivali, Mumbai",  rating: 5, review: "My Invisalign journey with Dr. Priya was transformational. 14 months and my smile is completely changed. The tracking appointments were always on time and the results speak for themselves.",             treatment: "Clear Aligners",       av: "AS" },
  { id: 4, name: "Sunita Desai",    loc: "Malad, Mumbai",     rating: 5, review: "Brought my 7-year-old here and Dr. Ananya was just wonderful with him. He actually looks forward to dental visits now! The pediatric care here is truly exceptional and the staff is so patient.",              treatment: "Pediatric Dentistry",  av: "SD" },
  { id: 5, name: "Mohammed Shaikh", loc: "Jogeshwari, Mumbai", rating: 5, review: "Emergency chipped tooth on a Friday evening — they saw me within an hour. Excellent emergency care, very fair pricing, and the crown they placed looks completely natural.",                                 treatment: "Emergency + Crown",    av: "MS" },
];
