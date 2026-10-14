// ─── GALLERY — MANUAL / DEFAULT DATA ────────────────────────
//
// Manual/default data source for the gallery section. Used automatically
// when the database/API has no gallery records yet; Admin Panel/database
// data will override this once connected (later phases).
//
// To use local photos instead of the placeholder URLs below, drop the
// image file into `frontend/public/images/gallery/` and change `src`
// to e.g. "/images/gallery/clinic-reception.jpg".

export type GalCat = "All" | "Clinic" | "Equipment" | "Results" | "Treatment";

export interface GalleryItem {
  id: number;
  src: string;
  alt: string;
  cat: GalCat;
}

export const GALLERY: GalleryItem[] = [
  { id: 1, src: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=700&h=500&fit=crop&auto=format", alt: "Modern dental clinic reception area",    cat: "Clinic"    },
  { id: 2, src: "https://images.unsplash.com/photo-1588776814546-1ffbb5b7dc8e?w=700&h=500&fit=crop&auto=format", alt: "State-of-the-art dental chair",           cat: "Equipment" },
  { id: 3, src: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=700&h=500&fit=crop&auto=format", alt: "Patient smile transformation result",      cat: "Results"   },
  { id: 4, src: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=700&h=500&fit=crop&auto=format", alt: "Precision dental instruments and tools",   cat: "Equipment" },
  { id: 5, src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=500&fit=crop&auto=format", alt: "Digital dental X-ray examination",         cat: "Treatment" },
  { id: 6, src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700&h=500&fit=crop&auto=format", alt: "Comfortable clinic waiting lounge",        cat: "Clinic"    },
];

export const GAL_CATS: GalCat[] = ["All", "Clinic", "Equipment", "Results", "Treatment"];
