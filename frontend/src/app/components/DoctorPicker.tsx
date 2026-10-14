import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Clock3, GraduationCap, X } from "lucide-react";
import type { ApiDentist } from "../api";

const BLUE = "#00ABE4";
const DARK = "#0C2340";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "DR";
}

function DoctorInformation({ doctor, onClose, compact = false }: { doctor: ApiDentist; onClose?: () => void; compact?: boolean }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden ${compact ? "w-full max-w-md mx-auto" : "w-full"}`}>
    <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100">
      <div className="flex gap-3 min-w-0">
        {doctor.image || doctor.img ? <img src={doctor.image || doctor.img} alt={doctor.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0" /> : <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ background: BLUE }}>{initials(doctor.name)}</div>}
        <div className="min-w-0">
          <h3 className="font-bold leading-tight" style={{ color: DARK }}>{doctor.name}</h3>
          {doctor.qualification && <p className="text-xs text-gray-500 mt-1">{doctor.qualification}</p>}
          {doctor.specialization && <p className="text-sm font-semibold mt-1" style={{ color: BLUE }}>{doctor.specialization}</p>}
        </div>
      </div>
      {onClose && <button type="button" onClick={onClose} aria-label="Close doctor information" autoFocus={!!onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"><X className="w-4 h-4" /></button>}
    </div>
    <div className="p-4 space-y-3">
      {doctor.experience && <div className="flex items-center gap-2 text-sm text-gray-600"><GraduationCap className="w-4 h-4 shrink-0" style={{ color: BLUE }} /><span><strong>Experience:</strong> {doctor.experience}</span></div>}
      {doctor.timing && <div className="flex items-center gap-2 text-sm text-gray-600"><Clock3 className="w-4 h-4 shrink-0" style={{ color: BLUE }} /><span><strong>Clinic hours:</strong> {doctor.timing}</span></div>}
      {doctor.description && <div><p className="text-xs uppercase tracking-wide font-bold text-gray-400 mb-1">About the doctor</p><p className="text-sm text-gray-600 leading-relaxed">{doctor.description}</p></div>}
      {doctor.specialization && <div><p className="text-xs uppercase tracking-wide font-bold text-gray-400 mb-1">Area of expertise</p><p className="text-sm text-gray-600">{doctor.specialization}</p></div>}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">Only information available in the clinic records is shown. Ratings and doctor-specific reviews are not displayed because no linked data is available.</p>
    </div>
  </div>;
}

export default function DoctorPicker({ dentists, value, onChange }: { dentists: ApiDentist[]; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mobileInfo, setMobileInfo] = useState<ApiDentist | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mobileShowMoreRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = dentists.find(doctor => doctor.name === value);
  const active = dentists[activeIndex];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setHoveredId(null);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false); setHoveredId(null); setMobileInfo(null);
        window.setTimeout(() => (mobileShowMoreRef.current || triggerRef.current)?.focus(), 0);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onEscape);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onEscape); };
  }, [open]);

  const selectDoctor = (doctor: ApiDentist) => {
    onChange(doctor.name);
    setOpen(false);
    setHoveredId(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const closeMobileInfo = () => {
    setMobileInfo(null);
    window.setTimeout(() => (mobileShowMoreRef.current || triggerRef.current)?.focus(), 0);
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      const nextIndex = Math.min(activeIndex + (open ? 1 : 0), Math.max(dentists.length - 1, 0));
      setActiveIndex(nextIndex);
      setHoveredId(dentists[nextIndex]?.id ?? null);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const nextIndex = Math.max(activeIndex - 1, 0);
      setActiveIndex(nextIndex);
      setHoveredId(dentists[nextIndex]?.id ?? null);
    } else if (event.key === "Enter" && open && active) {
      event.preventDefault();
      selectDoctor(active);
    } else if (event.key === "Escape") {
      setOpen(false);
      setHoveredId(null);
    }
  };

  return <div className="relative" ref={rootRef}>
    <button ref={triggerRef} type="button" aria-label="Preferred dentist" aria-haspopup="true" aria-expanded={open} aria-controls={listId}
      onClick={() => setOpen(current => !current)} onKeyDown={onTriggerKeyDown}
      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-sky-100">
      <span className={value ? "text-gray-800" : "text-gray-400"}>{value || "No Preference"}</span>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute z-[80] top-full left-0 mt-2 w-[min(660px,calc(100vw-32px))] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden" onMouseLeave={() => setHoveredId(null)}>
      <div className="grid md:grid-cols-[minmax(210px,0.9fr)_minmax(260px,1.1fr)]">
        <div className="p-2 border-b md:border-b-0 md:border-r border-gray-100">
          <button type="button" aria-pressed={!value} onClick={() => { onChange(""); setOpen(false); setHoveredId(null); window.setTimeout(() => triggerRef.current?.focus(), 0); }} className={`w-full rounded-xl px-3 py-3 text-left text-sm ${!value ? "bg-sky-50 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}>No Preference</button>
          <div id={listId} role="group" aria-label="Choose a dentist" className="max-h-64 overflow-y-auto space-y-1">
            {dentists.map((doctor, index) => <div key={doctor.id}
              onMouseEnter={() => { setActiveIndex(index); setHoveredId(doctor.id); }} onFocus={() => { setActiveIndex(index); setHoveredId(doctor.id); }}
              className={`px-3 py-3 rounded-xl ${value === doctor.name ? "bg-sky-50" : hoveredId === doctor.id ? "bg-gray-50" : "hover:bg-gray-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <button type="button" aria-pressed={value === doctor.name} onClick={() => selectDoctor(doctor)} className="min-w-0 text-left text-sm font-medium text-gray-800 hover:text-sky-600">{doctor.name}</button>
                <button type="button" className="md:hidden text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-lg" style={{ color: BLUE }} onClick={event => { mobileShowMoreRef.current = event.currentTarget; setMobileInfo(doctor); }} aria-label={`Show more information about ${doctor.name}`}>Show More</button>
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">{doctor.specialization || doctor.qualification}</div>
            </div>)}
            {!dentists.length && <div className="p-4 text-sm text-gray-400">No dentists are available right now.</div>}
          </div>
          <div className="px-3 py-2 text-[11px] text-gray-400 border-t border-gray-100">Hover to preview · Select a name to choose</div>
        </div>
        <div className="hidden md:block p-3 bg-gray-50/70 min-h-[250px]">
          {dentists.find(doctor => doctor.id === hoveredId) ? <DoctorInformation doctor={dentists.find(doctor => doctor.id === hoveredId)!} /> : <div className="h-full min-h-[240px] flex items-center justify-center text-center px-5 text-sm text-gray-400">Hover over a doctor to see their photo, experience and profile.</div>}
        </div>
      </div>
    </div>}
    {selected && <div className="mt-2 text-xs text-gray-500">{selected.specialization}{selected.experience ? ` · ${selected.experience}` : ""}</div>}
    {mobileInfo && <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 md:hidden" role="dialog" aria-modal="true" aria-label={`${mobileInfo.name} profile`} onClick={closeMobileInfo}>
      <div className="w-full max-w-md" onClick={event => event.stopPropagation()}><DoctorInformation doctor={mobileInfo} onClose={closeMobileInfo} compact /></div>
    </div>}
  </div>;
}
