import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import {
  Menu, X, Phone, Mail, MapPin, Clock, Star, ChevronDown,
  ChevronLeft, ChevronRight, ChevronUp, ArrowRight, Shield,
  Award, Heart, Users, Zap, MessageCircle, Send, Calendar,
  CheckCircle, Instagram, Smile,
  Activity, Baby, Sparkles, Crown, Layers, BarChart2, Settings,
  LogOut, FileText, Image, User, MessageSquare, Plus, Edit,
  Trash2, Search, Bell, TrendingUp, Eye, Lock, AlertCircle, UploadCloud, ClipboardList,
} from "lucide-react";

// ─── MANUAL / DEFAULT DATA ───────────────────────────────
// Website content now lives in ./data/*.ts instead of
// being hard-coded here. These act as the "manual/default" fallback
// layer: the Admin Panel + database will be able to override them
// once the backend is connected (see later phases).
import { SERVICE_CATS, type ServiceCategory, type ServiceIconKey } from "./data/services";
import { GAL_CATS, type GalCat } from "./data/gallery";
import { TESTIMONIALS } from "./data/testimonials";
import { BOT, QUICK_REPLIES } from "./data/chatbot";
import { CLINIC_INFO } from "./data/clinic";
import { api, type ApiDentist, type ApiService, type ApiGalleryItem, type ApiReview, type ApiAppointment } from "./api";
import DoctorPicker from "./components/DoctorPicker";
import PrescriptionsAdmin from "./components/PrescriptionsAdmin";

// ─── SOLID BLUE COLOR PALETTE (no chrome gradients) ──────
const BLUE  = "#00ABE4";   // primary solid blue
const BLUE2 = "#028090";   // secondary blue-teal
const TEAL  = "#02C39A";   // accent for highlights & success
const DARK  = "#0C2340";   // dark navy for text
const NAVY  = "#06304A";   // footer / sidebar base
const CREAM = "#F0F3BD";   // badge / accent highlight
const LIGHT = "#EDF6F9";   // section tint background

// ─── DATA ────────────────────────────────────────────────
const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About Us" },
  { path: "/services", label: "Services" },
  { path: "/gallery", label: "Gallery" },
];

// Maps each service's `icon` key (from data/services.ts) back to the
// actual lucide-react icon element. Plain .ts data files can't contain
// JSX, so the icon is stored as a string key there and resolved here —
// the rendered icons look exactly the same as before.
const SERVICE_ICONS: Record<ServiceIconKey, React.ReactNode> = {
  sparkles:     <Sparkles className="w-6 h-6" />,
  "alert-circle": <AlertCircle className="w-6 h-6" />,
  award:        <Award className="w-6 h-6" />,
  layers:       <Layers className="w-6 h-6" />,
  smile:        <Smile className="w-6 h-6" />,
  crown:        <Crown className="w-6 h-6" />,
  eye:          <Eye className="w-6 h-6" />,
  zap:          <Zap className="w-6 h-6" />,
  baby:         <Baby className="w-6 h-6" />,
  activity:     <Activity className="w-6 h-6" />,
};





const REV_DATA  = [{ month: "Feb", v: 88000 },{ month: "Mar", v: 94000 },{ month: "Apr", v: 102000 },{ month: "May", v: 115000 },{ month: "Jun", v: 118000 },{ month: "Jul", v: 128000 }];
const APT_DATA  = [{ day: "Mon", n: 18 },{ day: "Tue", n: 14 },{ day: "Wed", n: 22 },{ day: "Thu", n: 16 },{ day: "Fri", n: 25 },{ day: "Sat", n: 30 }];
const PIE_DATA  = [{ name: "Cleaning", value: 32 },{ name: "Root Canal", value: 18 },{ name: "Implants", value: 14 },{ name: "Braces", value: 20 },{ name: "Other", value: 16 }];
const PIE_COLS  = [BLUE, BLUE2, "#1A7FA8", "#3D9EC0", "#6AB4D0"];
const APT_STATUS: Record<string, string> = { confirmed: TEAL, pending: "#D4A017", "in-progress": BLUE2, cancelled: "#B03A2E" };

const SIDEBAR = [
  { id: "appointments", label: "Appointments", icon: <Calendar className="w-4 h-4" /> },
  { id: "prescriptions", label: "Prescriptions", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "dentists", label: "Manage Dentists", icon: <User className="w-4 h-4" /> },
  { id: "services", label: "Services", icon: <Layers className="w-4 h-4" /> },
  { id: "gallery", label: "Gallery", icon: <Image className="w-4 h-4" /> },
  { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

// ─── HOOKS ───────────────────────────────────────────────
function useCounter(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [started, target, duration]);
  return { val, ref };
}

function useApiCollection<T>(resource: "dentists" | "services" | "gallery" | "reviews") {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.list(resource).then(data => { if (active) setItems(data as T[]); }).catch(() => {
      if (active) toast.error(`Unable to load ${resource} from the database.`);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resource]);
  return { items, setItems, loading };
}

// ─── SCROLL PROGRESS ─────────────────────────────────────
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const tot = document.documentElement.scrollHeight - window.innerHeight;
      setPct(tot > 0 ? (window.scrollY / tot) * 100 : 0);
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return <div className="fixed top-0 left-0 z-[70] h-[3px] transition-all duration-75" style={{ width: `${pct}%`, background: BLUE }} />;
}

// ─── BACK TO TOP ─────────────────────────────────────────
function BackToTop() {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const fn = () => setVis(window.scrollY > 600);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <AnimatePresence>
      {vis && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 left-6 z-50 w-11 h-11 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
          style={{ background: BLUE }}>
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────
function SH({ tag, title, sub, center = true, light = false }: { tag: string; title: string; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`mb-12 ${center ? "text-center" : ""}`}>
      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-4 tracking-widest uppercase"
        style={{ background: light ? "rgba(255,255,255,0.15)" : LIGHT, color: light ? "#fff" : BLUE }}>
        {tag}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
        style={{ fontFamily: "Poppins, sans-serif", color: light ? "#fff" : DARK }}>
        {title}
      </h2>
      {sub && <p className={`max-w-2xl mx-auto text-base md:text-lg leading-relaxed ${light ? "text-white/65" : "text-gray-500"}`}>{sub}</p>}
    </div>
  );
}

// ─── ICON BOX ────────────────────────────────────────────
function IBox({ ch, size = "md", col }: { ch: React.ReactNode; size?: "sm" | "md" | "lg"; col?: string }) {
  const sz = size === "sm" ? "w-9 h-9 rounded-xl" : size === "lg" ? "w-16 h-16 rounded-2xl" : "w-12 h-12 rounded-xl";
  return (
    <div className={`${sz} flex items-center justify-center shrink-0 text-white`} style={{ background: col || BLUE }}>{ch}</div>
  );
}

// ─── CALENDAR PICKER ─────────────────────────────────────
function CalPicker({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [vw, setVw] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const y = vw.getFullYear(), m = vw.getMonth();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) cells.push(new Date(y, m, d));
  const label = vw.toLocaleString("default", { month: "long", year: "numeric" });
  const isPast = (d: Date) => d < today;
  const isSun  = (d: Date) => d.getDay() === 0;
  const isSel  = (d: Date) => selected?.toDateString() === d.toDateString();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setVw(new Date(y, m - 1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: BLUE }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>{label}</span>
        <button onClick={() => setVw(new Date(y, m + 1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: BLUE }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-xs font-semibold py-1 text-gray-400">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const disabled = isPast(day) || isSun(day);
          const sel = isSel(day);
          const tod = isToday(day);
          return (
            <button key={i} disabled={disabled} onClick={() => onSelect(day)}
              className="py-2 text-xs sm:text-sm rounded-lg transition-all font-medium"
              style={{
                background: sel ? BLUE : "transparent",
                color: disabled ? "#ccc" : sel ? "#fff" : tod ? BLUE : DARK,
                fontWeight: tod ? 700 : undefined,
                border: tod && !sel ? `2px solid ${BLUE}` : "2px solid transparent",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}>
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: BLUE }} /><span>Selected</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2" style={{ borderColor: BLUE }} /><span>Today</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-200" /><span>Unavailable</span></div>
      </div>
    </div>
  );
}

// ─── EMERGENCY STRIP ─────────────────────────────────────
function EmergencyStrip() {
  return (
    <div className="py-2 px-4 text-center text-xs sm:text-sm font-medium" style={{ background: DARK }}>
      <span className="text-white/55">🦷 Dental Emergency? </span>
      <a href="tel:+919876543210" className="font-bold hover:underline" style={{ color: CREAM }}>+91 98765 43210</a>
      <span className="text-white/55"> — Available 24/7</span>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [pathname]);
  return null;
}

function Navbar({ onAdmin }: { onAdmin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => setMob(false), [pathname]);
  return (
    <nav className="sticky top-0 z-50 transition-all duration-300 bg-white"
      style={{ boxShadow: scrolled ? "0 2px 20px rgba(0,171,228,0.12)" : "0 1px 0 rgba(12,35,64,0.06)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center py-3 gap-4">
          <Link to="/" className="text-left shrink-0 leading-tight flex items-center gap-2.5">
            <img src="/images/logo/dental-care-center-mark.svg" alt="" aria-hidden="true" className="w-9 h-9 object-contain" />
            <span><span className="block font-bold text-sm sm:text-base" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Dental Care Center</span><span className="block text-xs sm:text-sm font-semibold" style={{ color: BLUE }}>Jogeshwari-West</span></span>
          </Link>
          <div
  className="hidden md:flex items-center justify-center gap-0.5"
  style={{ position: "relative", left: "90px" }}
>
            {NAV_LINKS.map(l => <Link key={l.path} to={l.path} className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: pathname === l.path ? BLUE : "transparent", color: pathname === l.path ? "#fff" : "#374151" }}>{l.label}</Link>)}
          </div>
          <div className="flex items-center justify-end gap-4">
            <a href="tel:+919967829567" className="hidden lg:flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"><Phone className="w-4 h-4" /> +91 99678 29567</a>
            <Link to="/appointment" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200" style={{ background: BLUE }}><Calendar className="w-4 h-4" /> Book Appointment</Link>
            <button onClick={() => setMob(!mob)} className="md:hidden p-2 rounded-lg" style={{ color: BLUE }}>{mob ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mob && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="md:hidden bg-white shadow-2xl border-t border-gray-100">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map(l => <Link key={l.path} to={l.path} className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium" style={{ background: pathname === l.path ? BLUE : "transparent", color: pathname === l.path ? "#fff" : "#374151" }}>{l.label}</Link>)}
            <a href="tel:+919967829567" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-600"><Phone className="w-4 h-4" /> +91 99678 29567</a>
            <Link to="/appointment" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: BLUE }}><Calendar className="w-4 h-4" /> Book Appointment</Link>
            <button onClick={() => { setMob(false); onAdmin(); }} className="w-full py-2 text-xs text-gray-400 flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Admin Portal</button>
          </div>
        </motion.div>}
      </AnimatePresence>
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────
function AnimStat({ num, suffix, label }: { num: number; suffix: string; label: string }) {
  const { val, ref } = useCounter(num);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
        <span ref={ref}>{val}</span>{suffix}
      </div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  );
}

function HeroStat({ icon, num, label }: { icon: React.ReactNode; num: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-5 text-center shadow-sm">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "rgba(0,171,228,0.12)", color: BLUE }}>
        {icon}
      </div>
      <div className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>{num}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #EAF6FC 0%, #F7FBFC 45%, #FFFFFF 100%)" }}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-10 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Left column */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(0,171,228,0.12)", color: BLUE }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: BLUE }} />
              Premium Dental Care in Mumbai
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight"
              style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>
              Your Smile, <span style={{ color: BLUE }}>Our</span><br />
              <span style={{ color: BLUE }}>Priority</span>
            </h1>

            <p className="text-base md:text-lg text-gray-500 max-w-xl mb-8 leading-relaxed">
              Experience world-class dental care at Dental Care Center, Jogeshwari West. From routine cleanings to advanced cosmetic procedures — your perfect smile is our mission.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link to="/appointment" className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200" style={{ background: BLUE }}>
                <Calendar className="w-4 h-4" /> Book Appointment
              </Link>
              <Link to="/services" className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm">
                Explore Services <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <HeroStat icon={<Award className="w-4.5 h-4.5" />} num="15+ Yrs" label="Experience" />
              <HeroStat icon={<Users className="w-4.5 h-4.5" />} num="10K+" label="Happy Patients" />
              <HeroStat icon={<Shield className="w-4.5 h-4.5" />} num="50+" label="Treatments" />
              <HeroStat icon={<Clock className="w-4.5 h-4.5" />} num="8" label="Dentists" />
            </div>
          </motion.div>

          {/* Right column — image panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="relative">
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl">
              <img
                src="/images/hero/hero.png"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackApplied) return;
                  img.dataset.fallbackApplied = "true";
                  img.src = "/images/clinic/examining.jpg";
                }}
                alt="Professional dentist examining patient"
                className="w-full h-[420px] sm:h-[460px] object-cover"
              />
              <div className="absolute inset-0 rounded-[2rem]" style={{ border: "2px dashed rgba(0,171,228,0.35)" }} />
            </div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
              className="absolute -top-4 -left-4 sm:left-2 flex items-center gap-2.5 bg-white rounded-2xl shadow-lg px-4 py-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(2,195,154,0.12)" }}>
                <Shield className="w-4 h-4" style={{ color: TEAL }} />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-gray-800 leading-tight">ISO Certified</div>
                <div className="text-xs text-gray-400 leading-tight">Clinic</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -right-4 sm:right-2 flex items-center gap-2.5 bg-white rounded-2xl shadow-lg px-4 py-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,171,228,0.12)" }}>
                <Award className="w-4 h-4" style={{ color: BLUE }} />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-gray-800 leading-tight">4.9 ★ Rating</div>
                <div className="text-xs text-gray-400 leading-tight">500+ Reviews</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ───────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img src="/images/clinic/interior.jpg" alt="Dental Care Center clinic interior" className="w-full h-80 object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-52 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <img src="/images/clinic/smile.jpg" alt="Patient smile result" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-5 -left-5 w-28 h-28 rounded-2xl flex items-center justify-center text-center text-white shadow-xl" style={{ background: BLUE }}>
              <div><div className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>15+</div><div className="text-xs">Years of<br />Excellence</div></div>
            </div>
            <div className="absolute bottom-20 -left-5 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl bg-white border border-gray-100">
              <CheckCircle className="w-5 h-5" style={{ color: TEAL }} />
              <span className="text-xs font-semibold text-gray-700">10,000+ Happy Smiles</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
            <SH tag="About Us" title="A Legacy of Healthy Smiles" center={false} />
            <p className="text-gray-600 mb-5 leading-relaxed">Founded in 2009, Dental Care Center has been the trusted dental home for families across Jogeshwari West and beyond. What started as a small practice has grown into one of Mumbai&apos;s most respected multi-specialty dental clinics.</p>
            <p className="text-gray-600 mb-8 leading-relaxed">Our mission is simple: exceptional dental care in a comfortable, compassionate environment. We combine cutting-edge technology with genuine warmth to deliver results that transform not just smiles — but lives.</p>
            <div className="grid grid-cols-2 gap-4 mb-7">
              {[{ t: "Our Mission", d: "Deliver pain-free, personalized dental care with compassion and clinical excellence." },{ t: "Our Vision", d: "To be Mumbai's most trusted dental destination, known for smiles that change lives." }].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border-l-4" style={{ background: LIGHT, borderLeftColor: BLUE }}>
                  <div className="font-bold mb-2 text-sm" style={{ fontFamily: "Poppins, sans-serif", color: BLUE }}>{item.t}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Shield className="w-4 h-4" />, t: "Safety First",  d: "Hospital-grade sterilization"    },
                { icon: <Heart className="w-4 h-4" />,  t: "Patient Care",  d: "Compassionate environment"       },
                { icon: <Award className="w-4 h-4" />,  t: "Excellence",    d: "Highest clinical standards"      },
                { icon: <Users className="w-4 h-4" />,  t: "Community",     d: "Mumbai families since 2009"      },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <IBox ch={v.icon} size="sm" /><div><div className="text-sm font-semibold text-gray-800">{v.t}</div><div className="text-xs text-gray-500">{v.d}</div></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── WHY CHOOSE US ───────────────────────────────────────
function WhyChooseSection() {
  const reasons = [
    { icon: <Award className="w-7 h-7" />,  t: "Experienced Dentists",   d: "Our team brings 35+ combined years of clinical expertise across all major dental specialties." },
    { icon: <Zap className="w-7 h-7" />,    t: "Advanced Technology",    d: "Digital X-rays, laser dentistry, CAD/CAM crowns, and 3D imaging for precise treatments." },
    { icon: <Shield className="w-7 h-7" />, t: "Hygienic & Safe",        d: "Hospital-grade sterilization. Every instrument autoclaved; single-use items always fresh." },
    { icon: <Heart className="w-7 h-7" />,  t: "Affordable Care",        d: "Transparent pricing. No hidden costs. 0% EMI available for all major treatments." },
    { icon: <User className="w-7 h-7" />,   t: "Personalized Treatment", d: "Custom treatment plans designed around your unique needs, lifestyle, and aesthetic goals." },
    { icon: <Smile className="w-7 h-7" />,  t: "Friendly Staff",         d: "Warm, trained staff dedicated to making every patient — especially anxious ones — feel at ease." },
  ];
  return (
    <section id="why-choose" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SH tag="Why Choose Us" title="Dental Care You Can Trust" sub="We combine expertise, technology, and genuine compassion to deliver the finest dental experience in Mumbai." />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }} viewport={{ once: true }}
              className="group bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl border border-transparent hover:border-blue-100 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white group-hover:scale-105 transition-transform duration-300" style={{ background: i % 2 === 0 ? BLUE : BLUE2 }}>
                {r.icon}
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>{r.t}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{r.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SERVICES ────────────────────────────────────────────
function ServicesSection() {
  const [cat, setCat] = useState<ServiceCategory>("All");
  const { items: services, loading } = useApiCollection<ApiService>("services");
  const filtered = cat === "All" ? services : services.filter(s => s.cat === cat);
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SH tag="Our Services" title="Complete Dental Care Under One Roof" sub="From routine cleanings to full smile makeovers — comprehensive dental services for every member of your family." />
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {SERVICE_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{ background: cat === c ? BLUE : "#F0F4F8", color: cat === c ? "#fff" : "#374151" }}>
              {c} <span className="opacity-60 text-xs ml-1">({c === "All" ? services.length : services.filter(s => s.cat === c).length})</span>
            </button>
          ))}
        </div>
        {loading && <div className="text-center text-sm text-gray-400 py-8">Loading services...</div>}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, i) => (
              <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-100 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform duration-300" style={{ background: s.bg }}>
                  {SERVICE_ICONS[s.icon]}
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="text-sm font-bold flex-1 leading-snug" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>{s.title}</h3>
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: LIGHT, color: BLUE }}>{s.cat}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">{s.desc}</p>
                <div className="text-sm font-bold" style={{ color: BLUE }}>{s.price}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <div className="text-center mt-10">
          <Link to="/appointment" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200" style={{ background: BLUE }}>
            Book a Consultation <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── DENTISTS ────────────────────────────────────────────
function DentistsSection() {
  const { items: dentists, loading } = useApiCollection<ApiDentist>("dentists");
  return (
    <section id="dentists" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SH tag="Our Team" title="Meet Our Expert Dentists" sub="A dedicated team of specialists committed to your oral health and the perfect smile." />
        {loading && <div className="text-center text-sm text-gray-400 py-8">Loading our dentists...</div>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dentists.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all duration-300">
              <div className="relative h-60 overflow-hidden bg-gray-100">
                <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full" style={{ background: BLUE }}>{d.exp}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-base mb-0.5" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>{d.name}</h3>
                <div className="text-xs text-gray-500 mb-1">{d.qual}</div>
                <div className="text-sm font-semibold mb-3" style={{ color: BLUE2 }}>{d.spec}</div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Award className="w-3.5 h-3.5" style={{ color: BLUE }} />{d.exp} Experience</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" style={{ color: BLUE }} />{d.timing}</div>
                </div>
                <Link to="/appointment" className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: BLUE }}>
                  Book Appointment
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY ─────────────────────────────────────────────
function GallerySection() {
  const [cat, setCat] = useState<GalCat>("All");
  const [lb, setLb] = useState<ApiGalleryItem | null>(null);
  const { items: gallery, loading } = useApiCollection<ApiGalleryItem>("gallery");
  const filtered = cat === "All" ? gallery : gallery.filter(g => g.cat === cat);
  return (
    <section id="gallery" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SH tag="Gallery" title="Our Clinic &amp; Results" sub="Take a look inside our state-of-the-art facility and some of our amazing smile transformations." />
        {loading && <div className="text-center text-sm text-gray-400 py-4">Loading gallery...</div>}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {GAL_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: cat === c ? BLUE : "#F0F4F8", color: cat === c ? "#fff" : "#374151" }}>
              {c} ({c === "All" ? gallery.length : gallery.filter(g => g.cat === c).length})
            </button>
          ))}
        </div>
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((img) => (
              <motion.div key={img.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                onClick={() => setLb(img)} className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-100">
                <img src={img.src} alt={img.alt} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300 flex items-center justify-center">
                  <Eye className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(0,171,228,0.80)" }}>{img.cat}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      <AnimatePresence>
        {lb && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLb(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <img src={lb.src} alt={lb.alt} className="w-full rounded-2xl shadow-2xl" />
              <button className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors" onClick={() => setLb(null)}>
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────────
function ReviewsSection() {
  const reviews = useManagedReviews();
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (!reviews.length) return;
    setCur(c => Math.min(c, reviews.length - 1));
    const t = setInterval(() => setCur(c => (c + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [reviews.length]);
  return (
    <section id="reviews" className="py-24 relative overflow-hidden" style={{ background: BLUE }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full border border-white/8" style={{ transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full border border-white/8" style={{ transform: "translate(-30%, 30%)" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SH tag="Patient Stories" title="What Our Patients Say" sub="Real stories from real patients who found their perfect smile at Dental Care Center." light />
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={cur} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
              className="rounded-3xl p-8 md:p-10 text-center border border-white/20" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div className="flex justify-center mb-5">
                {[...Array(reviews[cur].rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-300 text-yellow-300" />)}
              </div>
              <p className="text-white text-lg leading-relaxed mb-8 italic">&ldquo;{reviews[cur].review}&rdquo;</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: "rgba(255,255,255,0.20)", border: "2px solid rgba(255,255,255,0.30)" }}>
                  {reviews[cur].av}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">{reviews[cur].name}</div>
                  <div className="text-white/55 text-sm">{reviews[cur].loc}</div>
                  <div className="text-xs mt-0.5" style={{ color: CREAM }}>{reviews[cur].treatment}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-7">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setCur(i)} className="rounded-full transition-all duration-300"
                style={{ width: i === cur ? 32 : 12, height: 12, background: i === cur ? "#fff" : "rgba(255,255,255,0.28)" }} />
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
          {reviews.map((t, i) => (
            <button key={t.id} onClick={() => setCur(i)} className="text-left p-4 rounded-2xl border transition-all duration-300"
              style={{ background: i === cur ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.08)", borderColor: i === cur ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.10)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "rgba(255,255,255,0.18)" }}>{t.av}</div>
                <div className="text-white text-xs font-semibold truncate">{t.name}</div>
              </div>
              <div className="flex mb-1">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-yellow-300 text-yellow-300" />)}</div>
              <p className="text-white/45 text-xs line-clamp-2">{t.review}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── APPOINTMENT ─────────────────────────────────────────
function AppointmentSection() {
  const { items: dentists } = useApiCollection<ApiDentist>("dentists");
  const { items: services } = useApiCollection<ApiService>("services");
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", service: "", dentist: "", notes: "" });
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});
  const slots = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];
  const taken = ["10:00 AM","3:00 PM","6:00 PM"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selDate || !selTime) { toast.error("Please select a date and time slot first."); return; }

    const phone = form.phone.trim();
    const email = form.email.trim();
    const phonePattern = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const errors: { phone?: string; email?: string } = {};

    if (!phone) errors.phone = "Phone number is required.";
    else if (!phonePattern.test(phone)) errors.phone = "Please enter a valid 10-digit phone number.";
    if (!email) errors.email = "Email address is required.";
    else if (!emailPattern.test(email)) errors.email = "Please enter a valid email address.";

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Please correct the highlighted contact details.");
      return;
    }

    const normalizedPhone = phone.replace(/[^\d]/g, "").replace(/^91(?=\d{10}$)/, "");
    try {
      await api.create("appointments", {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: normalizedPhone,
        email,
        service: form.service,
        dentist: form.dentist || "No Preference",
        appointment_date: `${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, "0")}-${String(selDate.getDate()).padStart(2, "0")}`,
        appointment_time: selTime,
        additional_details: form.notes.trim(),
        status: "pending",
      });
      setDone(true);
      toast.success(`Appointment requested for ${selDate.toDateString()} at ${selTime}!`, { duration: 6000 });
    } catch (err: any) {
      toast.error(err?.message || "Unable to submit the appointment. Please try again.");
    }
  };

  return (
    <section id="appointment" className="py-24" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SH tag="Book Appointment" title="Schedule Your Visit" sub="Pick a date, choose a time, fill your details. We confirm within 2 hours." />
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
            {done ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-white" style={{ background: BLUE }}>
                  <CheckCircle className="w-12 h-12" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Appointment Requested!</h3>
                <p className="text-gray-500 max-w-sm mb-2">Thank you, {`${form.firstName} ${form.lastName}`.trim() || "there"}!</p>
                <p className="text-gray-400 text-sm max-w-sm mb-8">Booked for <strong>{selDate?.toDateString()}</strong> at <strong>{selTime}</strong>. We&apos;ll confirm via WhatsApp/call within 2 hours.</p>
                <button onClick={() => { setDone(false); setSelDate(null); setSelTime(null); setForm({ firstName: "", lastName: "", phone: "", email: "", service: "", dentist: "", notes: "" }); setFieldErrors({}); }}
                  className="px-6 py-3 rounded-xl text-white font-semibold" style={{ background: BLUE }}>
                  Book Another Appointment
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="text-base font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Select a Date</div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <CalPicker selected={selDate} onSelect={(d) => { setSelDate(d); setSelTime(null); }} />
                  </div>
                </div>
                <AnimatePresence>
                  {selDate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="text-base font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>
                        Slots — {selDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {slots.map(slot => {
                          const unavail = taken.includes(slot);
                          const sel = selTime === slot;
                          return (
                            <button key={slot} type="button" disabled={unavail} onClick={() => setSelTime(slot)}
                              className="py-2 text-xs font-semibold rounded-xl transition-all border"
                              style={{
                                background: sel ? BLUE : unavail ? "#f5f5f5" : "#fff",
                                color: sel ? "#fff" : unavail ? "#bbb" : DARK,
                                borderColor: sel ? BLUE : unavail ? "#eee" : "#E5E7EB",
                                cursor: unavail ? "not-allowed" : "pointer", opacity: unavail ? 0.5 : 1,
                                textDecoration: unavail ? "line-through" : "none",
                              }}>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {selTime && <p className="text-xs font-medium mt-2 flex items-center gap-1.5" style={{ color: TEAL }}><CheckCircle className="w-3.5 h-3.5" /> Selected: {selTime}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="border-t border-gray-100 pt-6">
                  <div className="text-base font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Your Details</div>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ l: "First Name *", ph: "Rajesh", k: "firstName" as const, req: true },{ l: "Last Name *", ph: "Kumar", k: "lastName" as const, req: true },{ l: "Phone *", ph: "+91 99678 29567", k: "phone" as const, req: true },{ l: "Email *", ph: "your@email.com", k: "email" as const, req: true }].map(f => (
                      <div key={f.k} className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-gray-500 mb-1.5 block font-medium">{f.l}</label>
                        <input required={f.req} type={f.k === "email" ? "email" : "text"} inputMode={f.k === "phone" ? "tel" : undefined} value={form[f.k]} onChange={e => { setForm({ ...form, [f.k]: e.target.value }); if (f.k !== "firstName" && f.k !== "lastName") setFieldErrors(prev => ({ ...prev, [f.k]: undefined })); }} placeholder={f.ph}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${fieldErrors[f.k as "phone" | "email"] ? "border-red-400" : "border-gray-200"}`}
                          aria-invalid={!!fieldErrors[f.k as "phone" | "email"]}
                          onFocus={e => (e.target.style.borderColor = fieldErrors[f.k as "phone" | "email"] ? "#F87171" : BLUE)} onBlur={e => (e.target.style.borderColor = fieldErrors[f.k as "phone" | "email"] ? "#F87171" : "#E5E7EB")} />
                        {fieldErrors[f.k as "phone" | "email"] && <p className="text-xs text-red-500 mt-1.5">{fieldErrors[f.k as "phone" | "email"]}</p>}
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block font-medium">Service Required</label>
                      <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
                        <option value="">Select Service</option>
                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Preferred Dentist</label>
                    <DoctorPicker dentists={dentists} value={form.dentist} onChange={value => setForm({ ...form, dentist: value })} />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Notes / Concerns</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any specific concerns or medical history we should know?" rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 hover:shadow-lg transition-all flex items-center justify-center gap-2" style={{ background: BLUE }}>
                  <Calendar className="w-5 h-5" />
                  {selDate && selTime ? `Confirm — ${selDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${selTime}` : "Confirm Appointment"}
                </button>
              </form>
            )}
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-5" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Clinic Information</h3>
              <div className="space-y-4">
                {[
                  { icon: <MapPin className="w-5 h-5" />, label: "Address", val: "Shop No. 12, Sai Complex, SV Road, Jogeshwari West, Mumbai – 400102" },
                  { icon: <Phone className="w-5 h-5" />,  label: "Phone",   val: "+91 99678 29567"      },
                  { icon: <Mail className="w-5 h-5" />,   label: "Email",   val: "info@dentalcarecenter.in" },
                  { icon: <Clock className="w-5 h-5" />,  label: "Hours",   val: "Mon–Sat: 9AM–9PM\nSun: 10AM–4PM" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <IBox ch={item.icon} size="sm" />
                    <div><div className="text-xs text-gray-400 mb-0.5">{item.label}</div><div className="text-sm text-gray-700 font-medium whitespace-pre-line">{item.val}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <a href="https://wa.me/919967829567?text=Hello%20Dental%20Care%20Center%2C%20I%20would%20like%20to%20know%20more%20about%20your%20dental%20services%20and%20book%20an%20appointment." target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#25D366" }}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a href="https://maps.google.com/?q=Jogeshwari+West+Mumbai" target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold" style={{ background: LIGHT, color: BLUE }}>
                  <MapPin className="w-4 h-4" /> Directions
                </a>
              </div>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <iframe src="https://maps.google.com/maps?q=Jogeshwari+West,+Mumbai,+Maharashtra+400102&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%" height="260" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Dental Care Center Location" />
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="text-sm font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Also Connect Via</div>
              <div className="flex gap-2">
                {[{ icon: <Phone className="w-4 h-4" />,    label: "Call",  href: "tel:+919967829567",     bg: BLUE      },
                  { icon: <Instagram className="w-4 h-4" />, label: "Instagram", href: "https://www.instagram.com/dentalclinic/", bg: "#E1306C" }].map((s, i) => (
                  <a key={i} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-white text-xs font-medium hover:scale-105 transition-transform" style={{ background: s.bg }}>
                    {s.icon}{s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT ─────────────────────────────────────────────
// ─── FOOTER ──────────────────────────────────────────────
function Footer({ onAdmin }: { onAdmin: () => void }) {
  return (
    <footer className="text-white pt-16 pb-6" style={{ background: NAVY }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4"><img src="/images/logo/dental-care-center-mark.svg" alt="Dental Care Center logo" className="w-10 h-10 rounded-xl bg-white p-1 shrink-0"/><div><div className="font-bold text-white text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Dental Care Center</div><div className="text-xs text-white/40">Jogeshwari West, Mumbai</div></div></Link>
            <p className="text-white/45 text-sm leading-relaxed mb-4">Providing exceptional dental care to Mumbai families since 2009. Your smile, our priority.</p>
          </div>
          <div><div className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Quick Links</div><div className="space-y-2">{NAV_LINKS.map(l => <Link key={l.path} to={l.path} className="block text-white/45 hover:text-white text-sm transition-colors">{l.label}</Link>)}</div></div>
          <div><div className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Services</div><div className="space-y-2">{["Dental Cleaning","Root Canal","Dental Implants","Braces & Aligners","Teeth Whitening","Gum Treatment","Emergency Care"].map(s => <Link key={s} to="/services" className="block text-white/45 hover:text-white text-sm transition-colors">{s}</Link>)}</div></div>
          <div><div className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Clinic</div><div className="space-y-3 text-sm text-white/45"><div className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: TEAL }} /><span>Sai Complex, SV Road, Jogeshwari West, Mumbai 400102</span></div><div className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: TEAL }} /><a href="tel:+919967829567" className="hover:text-white">+91 99678 29567</a></div><div className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: TEAL }} /><a href="mailto:info@dentalcarecenter.in" className="hover:text-white text-xs">info@dentalcarecenter.in</a></div><div className="flex items-start gap-2"><Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: TEAL }} /><span>Mon–Sat: 9AM–9PM<br />Sun: 10AM–4PM</span></div></div></div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30"><span>© 2026 Dental Care Center, Jogeshwari West, Mumbai. All rights reserved.</span><div className="flex items-center gap-4"><button onClick={onAdmin} className="flex items-center gap-1.5 hover:text-white transition-colors"><Lock className="w-3.5 h-3.5" /> Admin</button></div></div>
      </div>
    </footer>
  );
}

// ─── ADMIN LOGIN ─────────────────────────────────────────
function AdminLogin({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [creds, setCreds] = useState({ u: "", p: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      await api.adminLogin(creds.u, creds.p);
      onLogin();
      toast.success("Welcome back. Admin session verified by the backend.");
    } catch (error: any) {
      setErr(error?.message || "Unable to sign in. Check the backend and credentials.");
    } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: NAVY }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-80 h-80 rounded-full border border-white/5" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full border border-white/5" />
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl text-white" style={{ background: BLUE }}><Lock className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif", color: DARK }}>Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Dental Care Center — Management Suite</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Username</label><input type="text" value={creds.u} onChange={e => setCreds({...creds,u:e.target.value})} placeholder="admin" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label><input type="password" value={creds.p} onChange={e => setCreds({...creds,p:e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" /></div>
          {err && <div className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-4 py-2">{err}</div>}
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2" style={{ background: BLUE }}>
            {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Sign In to Admin Panel"}
          </button>
        </form>
        <button onClick={onBack} className="mt-5 w-full text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" /> Back to Website</button>
        <p className="text-center text-xs text-gray-400 mt-3 bg-gray-50 rounded-lg py-2">Use the admin credentials configured in <strong>backend/.env</strong>.</p>
      </motion.div>
    </div>
  );
}

// ─── ADMIN MEDIA UPLOADS ─────────────────────────────────
function AdminImagePicker({ value, onChange, label = "Photo" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image is too large. Maximum size is 8 MB."); return; }
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      onChange(result.url);
      toast.success("Photo uploaded.");
    } catch (err: any) {
      toast.error(err?.message || "Unable to upload photo.");
    } finally { setUploading(false); }
  };

  return <div>
    <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed p-4 cursor-pointer transition-all ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={e => upload(e.target.files?.[0])} />
      {value ? <div className="flex items-center gap-4">
        <img src={value} alt="Selected" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
        <div className="min-w-0"><div className="font-medium text-sm" style={{color:DARK}}>{uploading ? "Uploading…" : "Photo selected"}</div><div className="text-xs text-gray-400 mt-1">Click or drag another photo here to replace it.</div></div>
      </div> : <div className="text-center py-5">
        <UploadCloud className="w-8 h-8 mx-auto mb-2" style={{color:BLUE}} />
        <div className="text-sm font-semibold" style={{color:DARK}}>{uploading ? "Uploading…" : "Drag & drop a photo here"}</div>
        <div className="text-xs text-gray-400 mt-1">or click to choose from your computer · JPG, PNG, WEBP · max 8 MB</div>
      </div>}
    </div>
  </div>;
}

function AdminModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <motion.div initial={{opacity:0, y:10, scale:.98}} animate={{opacity:1, y:0, scale:1}} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"><h3 className="font-bold text-lg" style={{color:DARK}}>{title}</h3><button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button></div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>;
}

function AdminTextField({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div><label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400" /></div>;
}

function AdminTextarea({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div><label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label><textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none" /></div>;
}

function GalleryEditorModal({ item, onClose, onSaved }: { item?: ApiGalleryItem; onClose:()=>void; onSaved:()=>Promise<void> }) {
  const [image,setImage]=useState(item?.image||""); const [title,setTitle]=useState(item?.title||""); const [caption,setCaption]=useState(item?.caption||""); const [category,setCategory]=useState(item?.category||"Clinic"); const [saving,setSaving]=useState(false);
  const save=async()=>{ if(!image){toast.error("Please add a photo.");return;} if(!category.trim()){toast.error("Category is required.");return;} setSaving(true); try { const payload={image,title:title.trim()||"Dental clinic image",caption,category}; if(item) await api.update("gallery",item.id,payload); else await api.create("gallery",payload); await onSaved(); toast.success(item?"Gallery photo updated.":"Gallery photo added."); onClose(); } catch(err:any){toast.error(err?.message||"Unable to save gallery photo.");} finally{setSaving(false);} };
  return <AdminModal title={item?"Edit Gallery Photo":"Add Gallery Photo"} onClose={onClose}><div className="space-y-4"><AdminImagePicker value={image} onChange={setImage} label="Photo"/><AdminTextField label="Title" value={title} onChange={setTitle} placeholder="Dental clinic image"/><AdminTextarea label="Caption" value={caption} onChange={setCaption}/><AdminTextField label="Category" value={category} onChange={setCategory} placeholder="Clinic"/><div className="flex justify-end gap-3 pt-2"><button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm border border-gray-200">Cancel</button><button disabled={saving} onClick={save} className="px-5 py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-60" style={{background:BLUE}}>{saving?"Saving…":item?"Save Changes":"Add Photo"}</button></div></div></AdminModal>;
}

function DentistEditorModal({ item, onClose, onSaved }: { item?: ApiDentist; onClose:()=>void; onSaved:()=>Promise<void> }) {
  const [image,setImage]=useState(item?.image||""); const [name,setName]=useState(item?.name||""); const [qualification,setQualification]=useState(item?.qualification||"BDS"); const [specialization,setSpecialization]=useState(item?.specialization||"General Dentistry"); const [experience,setExperience]=useState(item?.experience||""); const [description,setDescription]=useState(item?.description||""); const [timing,setTiming]=useState(item?.timing||"By appointment"); const [saving,setSaving]=useState(false);
  const save=async()=>{ if(!name.trim()){toast.error("Dentist name is required.");return;} if(!image){toast.error("Please add a profile photo.");return;} setSaving(true); try { const payload={name:name.trim(),image,qualification,specialization,experience,description,timing}; if(item) await api.update("dentists",item.id,payload); else await api.create("dentists",payload); await onSaved(); toast.success(item?"Dentist updated.":"Dentist added."); onClose(); } catch(err:any){toast.error(err?.message||"Unable to save dentist.");} finally{setSaving(false);} };
  return <AdminModal title={item?"Edit Dentist":"Add Dentist"} onClose={onClose}><div className="space-y-4"><AdminImagePicker value={image} onChange={setImage} label="Profile Photo"/><AdminTextField label="Name" value={name} onChange={setName}/><AdminTextField label="Qualification" value={qualification} onChange={setQualification}/><AdminTextField label="Specialization" value={specialization} onChange={setSpecialization}/><AdminTextField label="Experience" value={experience} onChange={setExperience}/><AdminTextarea label="Description" value={description} onChange={setDescription}/><AdminTextField label="Timing" value={timing} onChange={setTiming}/><div className="flex justify-end gap-3 pt-2"><button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm border border-gray-200">Cancel</button><button disabled={saving} onClick={save} className="px-5 py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-60" style={{background:BLUE}}>{saving?"Saving…":item?"Save Changes":"Add Dentist"}</button></div></div></AdminModal>;
}

function ReviewEditorModal({ item, onClose, onSaved }: { item?: ApiReview; onClose:()=>void; onSaved:()=>Promise<void> }) {
  const [image,setImage]=useState(item?.image_avatar&&item.image_avatar.includes("/")?item.image_avatar:""); const [name,setName]=useState(item?.customer_name||""); const [review,setReview]=useState(item?.review_text||""); const [rating,setRating]=useState(String(item?.rating||5)); const [location,setLocation]=useState(item?.location||""); const [treatment,setTreatment]=useState(item?.treatment||""); const [saving,setSaving]=useState(false);
  const save=async()=>{ const n=Math.max(1,Math.min(5,Number(rating)||0)); if(!name.trim()||!review.trim()||!n){toast.error("Customer name, review and rating are required.");return;} setSaving(true); try { const payload={customer_name:name.trim(),review_text:review.trim(),rating:n,location,treatment,image_avatar:image}; if(item) await api.update("reviews",item.id,payload); else await api.create("reviews",payload); await onSaved(); toast.success(item?"Review updated.":"Review added."); onClose(); } catch(err:any){toast.error(err?.message||"Unable to save review.");} finally{setSaving(false);} };
  return <AdminModal title={item?"Edit Review":"Add Review"} onClose={onClose}><div className="space-y-4"><AdminImagePicker value={image} onChange={setImage} label="Customer Photo (optional)"/><AdminTextField label="Customer Name" value={name} onChange={setName}/><AdminTextarea label="Review" value={review} onChange={setReview}/><AdminTextField label="Rating (1–5)" value={rating} onChange={setRating}/><AdminTextField label="Location" value={location} onChange={setLocation}/><AdminTextField label="Treatment / Service" value={treatment} onChange={setTreatment}/><div className="flex justify-end gap-3 pt-2"><button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm border border-gray-200">Cancel</button><button disabled={saving} onClick={save} className="px-5 py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-60" style={{background:BLUE}}>{saving?"Saving…":item?"Save Changes":"Add Review"}</button></div></div></AdminModal>;
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("appointments");
  const [sb, setSb] = useState(true);
  const [dentists, setDentists] = useState<ApiDentist[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [gallery, setGallery] = useState<ApiGalleryItem[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [galleryEditor, setGalleryEditor] = useState<{ item?: ApiGalleryItem } | null>(null);
  const [dentistEditor, setDentistEditor] = useState<{ item?: ApiDentist } | null>(null);
  const [reviewEditor, setReviewEditor] = useState<{ item?: ApiReview } | null>(null);
  const cur = SIDEBAR.find(s => s.id === tab);

  const refresh = async () => {
    try {
      const [d, s, g, r, a] = await Promise.all([
        api.list("dentists"), api.list("services"), api.list("gallery"), api.list("reviews"), api.list("appointments"),
      ]);
      setDentists(d as ApiDentist[]); setServices(s as ApiService[]); setGallery(g as ApiGalleryItem[]); setReviews(r as ApiReview[]); setAppointments(a as ApiAppointment[]);
    } catch (err: any) { toast.error(err?.message || "Unable to load admin data from MySQL API."); }
  };
  useEffect(() => { refresh(); }, []);

  const remove = async (resource: string, id: number, label: string) => {
    if (!window.confirm(`Delete this ${label}? This action cannot be undone.`)) return;
    try { await api.remove(resource, id); await refresh(); toast.success(`${label} deleted.`); }
    catch (err: any) { toast.error(err?.message || `Unable to delete ${label}.`); }
  };
  const promptValue = (label: string, current = "") => window.prompt(`Enter ${label}`, current);

  const addDentist = () => setDentistEditor({});
  const editDentist = (d: ApiDentist) => setDentistEditor({ item: d });
  const addService = async () => {
    const name = promptValue("service name"); if (!name) return;
    const description = promptValue("description", "") || "";
    const category = promptValue("category", "Preventive") || "Preventive";
    const image_icon = promptValue("icon key", "sparkles") || "sparkles";
    const price = promptValue("price", "Contact us") || "Contact us";
    try { await api.create("services", { name, description, category, image_icon, price, bg: BLUE }); await refresh(); toast.success("Service added."); } catch (err:any) { toast.error(err?.message || "Unable to add service."); }
  };
  const editService = async (x: ApiService) => {
    const payload = {
      name: promptValue("service name", x.name) ?? x.name,
      description: promptValue("description", x.description) ?? x.description,
      category: promptValue("category", x.category) ?? x.category,
      image_icon: promptValue("icon key", x.icon || "sparkles") ?? x.icon,
      price: promptValue("price", x.price || "Contact us") ?? x.price,
      bg: x.bg || BLUE,
    };
    try { await api.update("services", x.id, payload); await refresh(); toast.success("Service updated."); } catch (err:any) { toast.error(err?.message || "Unable to update service."); }
  };
  const addGallery = () => setGalleryEditor({});
  const editGallery = (x: ApiGalleryItem) => setGalleryEditor({ item: x });
  const addReview = () => setReviewEditor({});
  const editReview = (x: ApiReview) => setReviewEditor({ item: x });
  const updateAppointmentStatus = async (a: ApiAppointment) => {
    const status = promptValue("appointment status", a.status); if (!status) return;
    try { await api.update("appointments", a.id, { status }); await refresh(); toast.success("Appointment status updated."); } catch (err:any) { toast.error(err?.message || "Unable to update appointment."); }
  };

  const Table = ({children}:{children:React.ReactNode}) => <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">{children}</div>;
  const action = (onEdit:()=>void,onDelete:()=>void) => <div className="flex gap-2"><button onClick={onEdit} className="p-2 rounded-lg hover:bg-blue-50" style={{color:BLUE}}><Edit className="w-4 h-4"/></button><button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4"/></button></div>;

  return <div className="min-h-screen flex" style={{ background: "#F4F7FA" }}>
    <aside className={`${sb ? "w-60" : "w-16"} shrink-0 flex flex-col transition-all duration-300 shadow-xl`} style={{background:NAVY}}>
      <div className="p-4 flex items-center gap-3 border-b border-white/10 min-h-[65px]"><div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:BLUE}}><Smile className="w-5 h-5 text-white"/></div>{sb&&<div><div className="text-white font-semibold text-sm">Dental Care</div><div className="text-white/40 text-xs">Admin Panel</div></div>}</div>
      <nav className="flex-1 py-4 px-2 space-y-1">{SIDEBAR.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm" style={{background:tab===item.id?BLUE:"transparent",color:tab===item.id?"#fff":"rgba(255,255,255,.5)"}}><span>{item.icon}</span>{sb&&<span className="text-left">{item.label}</span>}</button>)}</nav>
      <div className="p-3 border-t border-white/10"><button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-300"><LogOut className="w-4 h-4"/>{sb&&<span>Logout</span>}</button></div>
    </aside>
    <main className="flex-1 min-w-0 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={()=>setSb(!sb)} className="p-2 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5"/></button><div><h1 className="font-bold" style={{fontFamily:"Poppins, sans-serif",color:DARK}}>{cur?.label}</h1><p className="text-xs text-gray-400">Dental Care Center — Management Portal</p></div></div><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{background:BLUE}}>A</div><span className="hidden sm:block text-sm font-semibold" style={{color:DARK}}>Admin</span></div></header>
      <div className="flex-1 p-6 overflow-auto">
        {tab === "appointments" && <div className="space-y-4"><div><h2 className="font-bold" style={{color:DARK}}>Appointments</h2><p className="text-sm text-gray-500">View and manage scheduled patient appointments stored in MySQL.</p></div><Table><table className="w-full"><thead><tr className="bg-gray-50">{["Patient","Date / Time","Service","Dentist","Status","Actions"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{appointments.map(a=><tr key={a.id}><td className="px-4 py-3 text-sm font-medium" style={{color:DARK}}>{a.first_name} {a.last_name}<div className="text-xs text-gray-400">{a.phone} · {a.email}</div></td><td className="px-4 py-3 text-sm text-gray-500">{new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, {a.appointment_time}</td><td className="px-4 py-3 text-sm">{a.service}</td><td className="px-4 py-3 text-sm">{a.dentist}</td><td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs text-white" style={{background:APT_STATUS[a.status] || "#D4A017"}}>{a.status}</span></td><td className="px-4 py-3">{action(()=>updateAppointmentStatus(a),()=>remove("appointments",a.id,"appointment"))}</td></tr>)}</tbody></table></Table></div>}
        {tab === "prescriptions" && <PrescriptionsAdmin dentists={dentists} />}
        {tab === "dentists" && <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold" style={{color:DARK}}>Manage Dentists</h2><p className="text-sm text-gray-500">Add, edit and remove dentist profiles in MySQL.</p></div><button onClick={addDentist} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{background:BLUE}}><Plus className="w-4 h-4"/>Add Dentist</button></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{dentists.map(d=><div key={d.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><img src={d.image} alt={d.name} className="w-16 h-16 rounded-xl object-cover mb-3"/><div className="font-semibold" style={{color:DARK}}>{d.name}</div><div className="text-xs mt-1" style={{color:BLUE}}>{d.specialization}</div><div className="text-xs text-gray-500 mt-2">{d.qualification} · {d.experience}</div><div className="flex gap-2 mt-4"><button onClick={()=>editDentist(d)} className="flex-1 py-2 rounded-lg border text-xs" style={{borderColor:BLUE,color:BLUE}}><Edit className="w-3 h-3 inline mr-1"/>Edit</button><button onClick={()=>remove("dentists",d.id,"dentist")} className="px-3 rounded-lg border border-red-100 text-red-400"><Trash2 className="w-4 h-4"/></button></div></div>)}</div></div>}
        {tab === "services" && <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold" style={{color:DARK}}>Services</h2><p className="text-sm text-gray-500">Manage treatments and service categories in MySQL.</p></div><button onClick={addService} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{background:BLUE}}><Plus className="w-4 h-4"/>Add Service</button></div><Table><table className="w-full"><thead><tr className="bg-gray-50"><th className="px-4 py-3 text-left text-xs">Service</th><th className="px-4 py-3 text-left text-xs">Category</th><th className="px-4 py-3 text-left text-xs">Price</th><th className="px-4 py-3 text-right text-xs">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{services.map(x=><tr key={x.id}><td className="px-4 py-3 text-sm font-medium">{x.name}</td><td className="px-4 py-3 text-sm text-gray-500">{x.category}</td><td className="px-4 py-3 text-sm text-gray-500">{x.price}</td><td className="px-4 py-3 text-right">{action(()=>editService(x),()=>remove("services",x.id,"service"))}</td></tr>)}</tbody></table></Table></div>}
        {tab === "gallery" && <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold" style={{color:DARK}}>Gallery</h2><p className="text-sm text-gray-500">Manage clinic gallery images in MySQL.</p></div><button onClick={addGallery} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{background:BLUE}}><Plus className="w-4 h-4"/>Add Photo</button></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{gallery.map(x=><div key={x.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"><img src={x.image} alt={x.title || "Dental clinic image"} className="w-full h-40 object-cover"/><div className="p-4"><div className="text-sm font-medium" style={{color:DARK}}>{x.title}</div><div className="text-xs text-gray-400 mt-1">{x.category}</div><div className="flex justify-end gap-2 mt-3">{action(()=>editGallery(x),()=>remove("gallery",x.id,"gallery item"))}</div></div></div>)}</div></div>}
        {tab === "reviews" && <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold" style={{color:DARK}}>Reviews</h2><p className="text-sm text-gray-500">Manage patient reviews shown on the Home page.</p></div><button onClick={addReview} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{background:BLUE}}><Plus className="w-4 h-4"/>Add Review</button></div><div className="space-y-3">{reviews.map(x=><div key={x.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="font-semibold" style={{color:DARK}}>{x.customer_name}</div><div className="text-xs text-gray-400 mt-1">{x.location} · {x.treatment}</div><div className="flex mt-2">{Array.from({length:x.rating}).map((_,i)=><Star key={i} className="w-4 h-4 fill-current" style={{color:"#F59E0B"}}/>)}</div><p className="text-sm text-gray-600 mt-3">{x.review_text}</p></div><div>{action(()=>editReview(x),()=>remove("reviews",x.id,"review"))}</div></div></div>)}</div></div>}
        {tab === "settings" && <div className="space-y-6 max-w-2xl"><div><h2 className="font-bold" style={{color:DARK}}>Settings</h2><p className="text-sm text-gray-500">Clinic settings and working hours.</p></div><div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">{[{l:"Clinic Name",v:"Dental Care Center"},{l:"Phone",v:"+91 99678 29567"},{l:"Email",v:"info@dentalcarecenter.in"},{l:"Address",v:"Sai Complex, SV Road, Jogeshwari West, Mumbai – 400102"}].map(f=><div key={f.l}><label className="text-sm font-medium text-gray-700 block mb-1.5">{f.l}</label><input defaultValue={f.v} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"/></div>)}<button onClick={()=>toast.success("Settings saved!")} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:BLUE}}>Save Changes</button></div></div>}
      </div>
    </main>
    {galleryEditor && <GalleryEditorModal item={galleryEditor.item} onClose={()=>setGalleryEditor(null)} onSaved={refresh} />}
    {dentistEditor && <DentistEditorModal item={dentistEditor.item} onClose={()=>setDentistEditor(null)} onSaved={refresh} />}
    {reviewEditor && <ReviewEditorModal item={reviewEditor.item} onClose={()=>setReviewEditor(null)} onSaved={refresh} />}
  </div>;
}

// ─── CHATBOT ─────────────────────────────────────────────
interface ChatMsg { id: number; text: string; from: "user" | "bot"; time: string; }

function getBotReply(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/hi|hello|hey|namaste|greet/))             return BOT.greeting;
  if (t.match(/service|treat|offer|provide|what do/))     return BOT.services;
  if (t.match(/hour|time|open|clos|timing|when/))         return BOT.hours;
  if (t.match(/location|address|where|reach|direction/))  return BOT.location;
  if (t.match(/book|appoint|schedul|slot|reserv/))        return BOT.appointment;
  if (t.match(/cost|price|fee|charge|rate|₹|how much/))   return BOT.cost;
  if (t.match(/emergency|urgent|pain|severe|broke|crack/))return BOT.emergency;
  if (t.match(/tip|advice|care|hygiene|brush|floss/))     return BOT.tips;
  return BOT.fallback;
}

const getNow = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function WhatsAppFloat() {
  return (
    <motion.a
      href="https://wa.me/919967829567?text=Hello%20Dental%20Care%20Center%2C%20I%20would%20like%20to%20know%20more%20about%20your%20dental%20services%20and%20book%20an%20appointment."
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-label="Chat on WhatsApp - 99678 29567"
      className="fixed bottom-6 right-[5.5rem] sm:right-24 z-40 flex items-center gap-2.5 h-12 px-4 sm:px-5 rounded-full shadow-lg text-white font-semibold text-sm whitespace-nowrap"
      style={{ background: "#25D366" }}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white/15">
        <svg viewBox="0 0 32 32" className="w-5 h-5 fill-none" aria-hidden="true">
          <path d="M16 4.5A11.4 11.4 0 0 0 6.1 21.6L4.8 27.1l5.7-1.5A11.5 11.5 0 1 0 16 4.5Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.5 10.9c.3-.7.7-.7 1.2-.7h.7c.3 0 .6.1.8.6l.9 2.1c.1.3.1.6-.1.8l-.7.9c-.2.2-.2.5 0 .8.6 1 1.4 1.8 2.3 2.4.3.2.6.3.8 0l.9-.9c.2-.2.5-.3.8-.1l2.1 1c.4.2.6.4.6.8v.7c0 .5-.2.9-.7 1.2-.5.3-1.3.5-2 .3-1.3-.3-3-1.2-4.7-2.9-1.7-1.7-2.6-3.4-2.9-4.7-.2-.7 0-1.5.3-2Z" fill="white" />
        </svg>
      </span>
      <span>Chat on WhatsApp · 99678 29567</span>
    </motion.a>
  );
}
function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ id: 1, text: BOT.greeting, from: "bot", time: getNow() }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs(p => [...p, { id: Date.now(), text: text.trim(), from: "user", time: getNow() }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(p => [...p, { id: Date.now() + 1, text: getBotReply(text), from: "bot", time: getNow() }]);
    }, 900 + Math.random() * 600);
  };

  return (
    <>
      {!open && <div className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full animate-ping opacity-12" style={{ background: BLUE }} />}
      <motion.button onClick={() => setOpen(!open)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white"
        style={{ background: BLUE }}>
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}><X className="w-6 h-6" /></motion.span>
            : <motion.span key="m" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}><MessageCircle className="w-6 h-6" /></motion.span>}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-3xl shadow-2xl overflow-hidden flex flex-col bg-white"
            style={{ maxHeight: "540px" }}>
            <div className="p-4 flex items-center gap-3 shrink-0" style={{ background: BLUE }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
                <Smile className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Dental Assistant</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full animate-pulse bg-green-300" /><span className="text-white/65 text-xs">Online · Replies instantly</span></div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/55 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: 0 }}>
              {msgs.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.from === "bot" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-auto text-white" style={{ background: BLUE }}>
                      <Smile className="w-4 h-4" />
                    </div>
                  )}
                  <div className="max-w-[78%]">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${msg.from === "user" ? "text-white rounded-br-sm" : "text-gray-700 bg-white shadow-sm rounded-bl-sm border border-gray-100"}`}
                      style={msg.from === "user" ? { background: BLUE } : {}}>
                      {msg.text}
                    </div>
                    <div className={`text-[10px] text-gray-400 mt-1 ${msg.from === "user" ? "text-right" : ""}`}>{msg.time}</div>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: BLUE }}><Smile className="w-4 h-4" /></div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s`, background: BLUE }} />)}</div>
                  </div>
                </div>
              )}
              <div ref={bottom} />
            </div>

            <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_REPLIES.map(qr => (
                  <button key={qr.key} onClick={() => send(qr.label)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:text-white transition-all whitespace-nowrap"
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = BLUE; b.style.borderColor = BLUE; b.style.color = "#fff"; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.borderColor = "#E5E7EB"; b.style.color = "#374151"; }}>
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-300 transition-colors" />
                <button type="submit" className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 hover:opacity-90 transition-opacity" style={{ background: BLUE }}>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── PUBLIC PAGE COMPOSITION ─────────────────────────────
function PublicLayout({ children, onAdmin }: { children: React.ReactNode; onAdmin: () => void }) {
  return <div style={{ fontFamily: "Inter, sans-serif" }}><Toaster position="top-right" richColors /><ScrollToTop /><ScrollProgress /><EmergencyStrip /><Navbar onAdmin={onAdmin} /><main className="public-page-content">{children}</main><Footer onAdmin={onAdmin} /><BackToTop /><WhatsAppFloat /><Chatbot /></div>;
}

function useManagedReviews() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  useEffect(() => {
    api.list("reviews").then(data => setReviews(data as ApiReview[])).catch(() => toast.error("Unable to load reviews from the database."));
  }, []);
  return reviews;
}

function ReviewsPreview() {
  const reviews = useManagedReviews();
  return <div className="grid md:grid-cols-3 gap-5">{reviews.slice(0,6).map(r => <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{background:BLUE}}>{r.av}</div><div><div className="font-semibold text-sm" style={{color:DARK}}>{r.name}</div><div className="text-xs text-gray-400">{r.loc}</div></div></div><div className="flex">{Array.from({length:r.rating}).map((_,i)=><Star key={i} className="w-3.5 h-3.5 fill-current" style={{color:"#F59E0B"}}/>)}</div></div><p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{r.review}</p><div className="text-xs font-medium mt-3" style={{color:BLUE}}>{r.treatment}</div></div>)}</div>;
}
function GalleryPreview() {
  const { items: gallery } = useApiCollection<ApiGalleryItem>("gallery");
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{gallery.slice(0,4).map(g => <Link to="/gallery" key={g.id} className="group rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"><img src={g.src} alt={g.alt} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"/><div className="p-3 text-xs font-medium text-gray-600 truncate">{g.alt}</div></Link>)}</div>;
}

function HomePage() {
  return <><HeroSection/><section className="py-24 bg-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><SH tag="Patient Reviews" title="What Our Patients Say" sub="A quick look at recent patient experiences."/><ReviewsPreview/></div></section><WhyChooseSection/><section className="py-24" style={{background:LIGHT}}><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><SH tag="Our Clinic" title="A Look Inside Dental Care Center" sub="Explore a few highlights from our clinic."/><GalleryPreview/><div className="text-center mt-8"><Link to="/gallery" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white" style={{background:BLUE}}>View Full Gallery <ArrowRight className="w-4 h-4"/></Link></div></div></section><section className="py-20 bg-white"><div className="max-w-5xl mx-auto px-4 text-center"><SH tag="Your Smile Starts Here" title="Ready for Better Dental Care?" sub="Book your visit with our dental team today."/><Link to="/appointment" className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-semibold shadow-lg" style={{background:BLUE}}><Calendar className="w-5 h-5"/> Book Appointment</Link></div></section></>;
}
function AboutPage(){ return <><AboutSection/><DentistsSection/><WhyChooseSection/><section className="py-20 bg-white text-center"><SH tag="Next Step" title="Book Your Dental Visit" sub="Meet our team and choose a convenient appointment time."/><Link to="/appointment" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold" style={{background:BLUE}}>Book Appointment <ArrowRight className="w-4 h-4"/></Link></section></>; }
function ServicesPage(){ return <><ServicesSection/><section className="py-20 bg-white text-center"><SH tag="Appointment" title="Find the Right Treatment for You" sub="Our team can help you choose the right dental service."/><Link to="/appointment" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold" style={{background:BLUE}}>Book Appointment <ArrowRight className="w-4 h-4"/></Link></section></>; }
function GalleryPage(){ return <><GallerySection/></>; }
function AppointmentPage(){ return <><AppointmentSection/></>; }

// ─── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<"site" | "login" | "admin">("site");
  if (view === "login") return <><Toaster position="top-right" richColors /><AdminLogin onLogin={() => setView("admin")} onBack={() => setView("site")} /></>;
  if (view === "admin") return <><Toaster position="top-right" richColors /><AdminDashboard onLogout={() => { api.clearAdminToken(); setView("site"); }} /></>;
  return <BrowserRouter><Routes><Route path="*" element={<PublicLayout onAdmin={() => setView("login")}><Routes><Route path="/" element={<HomePage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/services" element={<ServicesPage/>}/><Route path="/gallery" element={<GalleryPage/>}/><Route path="/appointment" element={<AppointmentPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></PublicLayout>} /></Routes></BrowserRouter>;
}
