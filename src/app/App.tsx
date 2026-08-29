import { useState, useRef, useEffect, useMemo } from "react";
import salonLogo from "./images/salon_logo.webp";

import {
  Sparkles, Phone, MapPin, Clock, Star, Scissors, Award, Users, CheckCircle2,
  Calendar, CreditCard, MessageCircle, X, ChevronLeft, ChevronRight, AlertCircle,
  User, FileText, Check, LayoutDashboard, CalendarDays, Settings, Bell, Search,
  Menu, ChevronDown, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, DollarSign,
  AlertTriangle, ChevronUp, CalendarCheck, SlidersHorizontal, UserCheck, Package,
  Star as StarIcon, Save, RefreshCw, Coffee, Shield, Info, Zap, CalendarX, Timer,
  Layers, Ban, TrendingUp, MoreHorizontal, Eye, XCircle, UserX, Banknote,
  CheckCircle, ToggleRight as TR, ExternalLink, LayoutGrid,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD        = "#D4AF37";
const GOLD_DIM    = "#B8962A";
const GOLD_FAINT  = "rgba(212,175,55,0.08)";
const GOLD_BORDER = "rgba(212,175,55,0.25)";
const CARD_BG     = "#141414";
const SURFACE     = "#0E0E0E";
const BORDER      = "#1E1E1E";
const BORDER2     = "#2A2A2A";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function timeToMins(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}
function generateTimeOptions() {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30)
    opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  return opts;
}
const TIME_OPTS = generateTimeOptions();
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_ABBR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSITE MODE
// ═══════════════════════════════════════════════════════════════════════════════

const WEB_SERVICES = [
  { name: "Men's Hair Cut",    price: 30,  advance: 10,  duration: "30 min", img: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop&auto=format" },
  { name: "Ladies Hair Cut",   price: 45,  advance: 15,  duration: "45 min", img: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&h=300&fit=crop&auto=format" },
  { name: "Hair Coloring",     price: 80,  advance: 25,  duration: "2 hrs",  img: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=300&fit=crop&auto=format" },
  { name: "Keratin Treatment", price: 120, advance: 40,  duration: "3 hrs",  img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&auto=format" },
  { name: "Facial",            price: 60,  advance: 20,  duration: "1 hr",   img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&auto=format" },
  { name: "Nails",             price: 35,  advance: 10,  duration: "1 hr",   img: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=300&fit=crop&auto=format" },
  { name: "Makeup",            price: 70,  advance: 25,  duration: "1.5 hrs",img: "https://images.unsplash.com/photo-1622336889416-8d790ad807d7?w=400&h=300&fit=crop&auto=format" },
  { name: "Bridal Dressing",   price: 250, advance: 80,  duration: "4 hrs",  img: "https://images.unsplash.com/photo-1610047614301-13c63f00c032?w=400&h=300&fit=crop&auto=format" },
];

const WEB_STAFF = [
  { id: "s1", name: "Nadia Hassan", role: "Senior Stylist",   initials: "NH", color: "#A78BFA", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", services: ["Men's Hair Cut","Ladies Hair Cut","Keratin Treatment","Bridal Dressing"] },
  { id: "s2", name: "Sofia Reyes",  role: "Color Specialist", initials: "SR", color: "#F472B6", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format", services: ["Hair Coloring","Facial","Makeup","Bridal Dressing","Ladies Hair Cut"] },
  { id: "s3", name: "Arjun Mehta",  role: "Barber",           initials: "AM", color: "#34D399", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", services: ["Men's Hair Cut","Makeup"] },
  { id: "s4", name: "Lena Kovacs",  role: "Nail Technician",  initials: "LK", color: "#60A5FA", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&auto=format", services: ["Nails","Facial"] },
];

const FULLY_BOOKED = new Set(["2026-07-18","2026-07-22","2026-07-25","2026-07-30","2026-08-05"]);

const TIME_SLOTS = [
  { time: "9:00 AM",  available: true  }, { time: "9:30 AM",  available: true  },
  { time: "10:00 AM", available: false }, { time: "10:30 AM", available: true  },
  { time: "11:00 AM", available: false }, { time: "11:30 AM", available: true  },
  { time: "12:00 PM", available: false }, { time: "12:30 PM", available: true  },
  { time: "1:00 PM",  available: true  }, { time: "1:30 PM",  available: true  },
  { time: "2:00 PM",  available: false }, { time: "2:30 PM",  available: true  },
  { time: "3:00 PM",  available: true  }, { time: "3:30 PM",  available: false },
  { time: "4:00 PM",  available: true  }, { time: "4:30 PM",  available: true  },
  { time: "5:00 PM",  available: true  }, { time: "5:30 PM",  available: false },
];

interface BookingState {
  services: typeof WEB_SERVICES;
  staffMap: Record<string, string>;
  date: Date | null;
  time: string | null;
  name: string;
  mobile: string;
  notes: string;
}

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all duration-300"
            style={i < current ? { background: GOLD_DIM, color: "#000" } : i === current ? { background: GOLD, color: "#000", boxShadow: `0 0 0 3px ${GOLD_FAINT}` } : { background: "#27272A", color: "#71717A", border: "1px solid #3F3F46" }}>
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < total - 1 && <div className="w-4 h-px" style={{ background: i < current ? GOLD : "#3F3F46" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Booking modal ──────────────────────────────────────────────────────────
function BookingModal({ onClose }: { onClose: () => void }) {
  const STEPS = ["Choose Services","Select Stylists","Pick a Date","Select Time","Your Details","Review & Confirm"];
  const DESCS = ["Select one or more services","Choose your preferred stylist","Only dates with open slots shown","Pick your preferred slot","Tell us about yourself","Finalize your appointment"];
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingState>({ services: [], staffMap: {}, date: null, time: null, name: "", mobile: "", notes: "" });
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(6);

  const totalPrice = booking.services.reduce((s, v) => s + v.price, 0);
  const totalAdvance = booking.services.reduce((s, v) => s + v.advance, 0);
  const totalDurationLabel = booking.services.map(s => s.duration).join(" + ");
  const allStaffPicked = booking.services.every(s => booking.staffMap[s.name]);

  const canNext = [
    booking.services.length > 0,
    allStaffPicked,
    !!booking.date,
    !!booking.time,
    booking.name.trim().length > 1 && /^\d{10}$/.test(booking.mobile.trim()),
    true,
  ][step];

  const getSuggestions = (t: string) => {
    const idx = TIME_SLOTS.findIndex(s => s.time === t);
    const res: string[] = []; let b = idx - 1, a = idx + 1;
    while (res.length < 3 && (b >= 0 || a < TIME_SLOTS.length)) {
      if (a < TIME_SLOTS.length && TIME_SLOTS[a].available) res.push(TIME_SLOTS[a].time);
      if (res.length < 3 && b >= 0 && TIME_SLOTS[b].available) res.push(TIME_SLOTS[b].time);
      b--; a++;
    }
    return res.slice(0, 3);
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const toDateKey = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const todayDate = new Date(); todayDate.setHours(0,0,0,0);

  if (confirmed && booking.services.length > 0) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(52,211,153,0.1)", border: "2px solid #34D399" }}>
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Confirmed!</h3>
          <p className="text-zinc-400 text-sm max-w-xs">Your <span className="text-white font-semibold">{booking.services.map(s => s.name).join(", ")}</span> appointment is confirmed. We'll send a reminder before your visit.</p>
          <div className="rounded-xl px-5 py-3 text-sm" style={{ background: "#141414", border: `1px solid ${BORDER}` }}>
            <p className="font-semibold" style={{ color: GOLD }}>{booking.date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="text-zinc-400">{booking.time}</p>
          </div>
          <button onClick={onClose} className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-colors" style={{ background: "#1E1E1E", border: "1px solid #2A2A2A" }}>Done</button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
          <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Book Appointment</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <StepIndicator current={step} total={6} />
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{STEPS[step]}</h3>
        <p className="text-zinc-400 text-xs mt-0.5">{DESCS[step]}</p>
      </div>

      <div className="min-h-[260px]">
        {/* Step 0 — Services (multi) */}
        {step === 0 && (
          <div>
            {booking.services.length > 0 && <p className="text-xs mb-2" style={{ color: GOLD }}>{booking.services.length} service{booking.services.length > 1 ? "s" : ""} selected — ${totalPrice} total</p>}
            <div className="grid grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-0.5" style={{ scrollbarWidth: "none" }}>
              {WEB_SERVICES.map(svc => {
                const sel = booking.services.some(s => s.name === svc.name);
                return (
                  <button key={svc.name} onClick={() => setBooking(b => {
                    const newSvcs = sel ? b.services.filter(s => s.name !== svc.name) : [...b.services, svc];
                    const newMap = { ...b.staffMap }; if (sel) delete newMap[svc.name];
                    return { ...b, services: newSvcs, staffMap: newMap };
                  })}
                    className="text-left rounded-xl border overflow-hidden transition-all group"
                    style={{ background: "#0E0E0E", border: `1px solid ${sel ? GOLD : "#2A2A2A"}`, boxShadow: sel ? `0 0 0 1px ${GOLD_BORDER}` : "none" }}>
                    <div className="relative h-20 overflow-hidden bg-zinc-900">
                      <ImageWithFallback src={svc.img} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Check className="w-3 h-3 text-black" /></div>}
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-xs" style={{ color: sel ? GOLD : "#fff" }}>{svc.name}</p>
                      <div className="flex justify-between text-xs mt-0.5">
                        <span className="text-zinc-500">{svc.duration}</span>
                        <span style={{ color: GOLD }}>${svc.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1 — Staff per service */}
        {step === 1 && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-0.5" style={{ scrollbarWidth: "none" }}>
            {booking.services.map(svc => {
              const available = WEB_STAFF.filter(s => s.services.includes(svc.name));
              const picked = booking.staffMap[svc.name];
              return (
                <div key={svc.name}>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{svc.name}</p>
                  <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {available.map(staff => {
                      const sel = picked === staff.id;
                      return (
                        <button key={staff.id} onClick={() => setBooking(b => ({ ...b, staffMap: { ...b.staffMap, [svc.name]: staff.id } }))}
                          className="flex flex-col items-center gap-1.5 min-w-[72px] py-2 px-2 rounded-xl transition-all"
                          style={{ background: sel ? GOLD_FAINT : "#141414", border: `1px solid ${sel ? GOLD : "#2A2A2A"}` }}>
                          <div className="relative">
                            <ImageWithFallback src={staff.photo} alt={staff.name}
                              className="w-12 h-12 rounded-full object-cover"
                              style={{ border: `2px solid ${sel ? GOLD : "#3F3F46"}` }} />
                            {sel && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Check className="w-2.5 h-2.5 text-black" /></div>}
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-semibold truncate w-16" style={{ color: sel ? GOLD : "#fff" }}>{staff.name.split(" ")[0]}</p>
                            <p className="text-[10px] text-zinc-500 truncate w-16">{staff.role}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2 — Date (fully booked dates disabled) */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">{DAY_ABBR.map(d => <div key={d} className="text-center text-xs text-zinc-600 font-semibold py-1">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const key = toDateKey(day);
                const d = new Date(key); d.setHours(0,0,0,0);
                const past = d < todayDate;
                const fullyBooked = FULLY_BOOKED.has(key);
                const disabled = past || fullyBooked;
                const sel = booking.date?.toISOString().slice(0,10) === key;
                return (
                  <button key={day} disabled={disabled} onClick={() => setBooking(b => ({ ...b, date: new Date(key), time: null }))}
                    className="aspect-square rounded-xl text-xs font-medium transition-all relative"
                    style={{ background: sel ? GOLD : "transparent", color: disabled ? "#3F3F46" : sel ? "#000" : "#A1A1AA", border: sel ? `1px solid ${GOLD}` : "1px solid transparent", cursor: disabled ? "not-allowed" : "pointer", textDecoration: fullyBooked && !past ? "line-through" : "none" }}
                    onMouseEnter={e => { if (!sel && !disabled) e.currentTarget.style.background = "#1E1E1E"; }}
                    onMouseLeave={e => { if (!sel && !disabled) e.currentTarget.style.background = "transparent"; }}>
                    {day}
                    {fullyBooked && !past && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 justify-center mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Fully booked</span>
            </div>
            {booking.date && <p className="text-center text-xs mt-2" style={{ color: GOLD }}>{booking.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>}
          </div>
        )}

        {/* Step 3 — Time */}
        {step === 3 && (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {TIME_SLOTS.map(slot => {
                const sel = booking.time === slot.time;
                return (
                  <button key={slot.time} onClick={() => { if (!slot.available) { setAttempted(slot.time); } else { setAttempted(null); setBooking(b => ({ ...b, time: slot.time })); } }}
                    className="py-2.5 px-2 rounded-lg text-xs font-semibold border transition-all"
                    style={sel ? { background: GOLD, color: "#000", border: `1px solid ${GOLD}` } : slot.available ? { background: "rgba(52,211,153,0.08)", color: "#86EFAC", border: "1px solid rgba(52,211,153,0.25)" } : { background: "rgba(248,113,113,0.06)", color: "#525252", border: "1px solid rgba(248,113,113,0.15)", textDecoration: "line-through" }}>
                    {slot.time}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center text-xs mb-3">
              {[["rgba(52,211,153,0.08)","Available","rgba(52,211,153,0.25)"],["#D4AF37","Selected",""],["rgba(248,113,113,0.06)","Unavailable","rgba(248,113,113,0.15)"]].map(([bg,l,bd]) => (
                <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: bg, border: bd ? `1px solid ${bd}` : "none" }} /><span className="text-zinc-500">{l}</span></div>
              ))}
            </div>
            {attempted && (
              <div className="rounded-xl p-3" style={{ background: "#141414", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-amber-400 text-xs"><span className="font-semibold">{attempted}</span> is not available. Nearby open slots:</p>
                </div>
                <div className="flex gap-2">
                  {getSuggestions(attempted).map(t => (
                    <button key={t} onClick={() => { setBooking(b => ({ ...b, time: t })); setAttempted(null); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ background: GOLD_FAINT, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Details */}
        {step === 4 && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Full Name <span style={{ color: GOLD }}>*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input type="text" value={booking.name} onChange={e => setBooking(b => ({ ...b, name: e.target.value }))} placeholder="e.g. Kasun Perera"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Mobile Number <span style={{ color: GOLD }}>*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input type="tel" inputMode="numeric" value={booking.mobile} maxLength={10}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setBooking(b => ({ ...b, mobile: v })); }}
                  placeholder="0771234567"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors" />
              </div>
              {booking.mobile.length > 0 && booking.mobile.length < 10 && <p className="text-xs mt-1 text-amber-400">Must be exactly 10 digits ({10 - booking.mobile.length} more)</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Notes <span className="text-zinc-700 normal-case font-normal">(optional)</span></label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 w-4 h-4 text-zinc-600" />
                <textarea value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} placeholder="Any special requests…" rows={3} className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Confirm */}
        {step === 5 && booking.services.length > 0 && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GOLD_BORDER}` }}>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD, background: GOLD_FAINT }}>Appointment Summary</div>
              <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="text-zinc-500 text-sm">Services & Stylists</span>
                {booking.services.map(s => {
                  const staff = WEB_STAFF.find(st => st.id === booking.staffMap[s.name]);
                  return (
                    <div key={s.name} className="flex justify-between text-sm mt-1">
                      <span className="text-white font-semibold">{s.name}</span>
                      <span className="text-zinc-400 text-xs">{staff?.name ?? "—"} · {s.duration} · ${s.price}</span>
                    </div>
                  );
                })}
              </div>
              {[["Date", booking.date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) ?? ""],["Time", booking.time ?? ""],["Duration", totalDurationLabel]].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <span className="text-zinc-500 text-sm">{l}</span>
                  <span className="text-white text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER2}` }}>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500" style={{ background: "#141414" }}>Payment</div>
              {[["Total Price", `$${totalPrice}`],["Advance Now", `$${totalAdvance}`],["Remaining at Salon", `$${totalPrice - totalAdvance}`]].map(([l, v], i) => (
                <div key={l} className="flex justify-between items-center px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}`, color: i === 1 ? GOLD : "#fff" }}>
                  <span className="text-zinc-500 text-sm">{l}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: i === 1 ? GOLD : "#fff" }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setConfirmed(true)}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: GOLD, color: "#000" }}
              onMouseEnter={e => (e.currentTarget.style.background = GOLD_DIM)}
              onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>
              <CreditCard className="w-4 h-4" /> Pay ${totalAdvance} &amp; Confirm
            </button>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {step < 5 && (
        <div className="flex gap-2.5 mt-5">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors" style={{ border: "1px solid #2A2A2A", background: "#141414" }}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button onClick={() => { if (canNext) setStep(s => s + 1); }} disabled={!canNext}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: canNext ? GOLD : "#1E1E1E", color: canNext ? "#000" : "#4B4B4B", cursor: canNext ? "pointer" : "not-allowed" }}
            onMouseEnter={e => { if (canNext) e.currentTarget.style.background = GOLD_DIM; }}
            onMouseLeave={e => { if (canNext) e.currentTarget.style.background = GOLD; }}>
            {step === 4 ? "Review Booking" : "Continue"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {step === 5 && (
        <button onClick={() => setStep(s => s - 1)} className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-zinc-500 hover:text-white text-sm transition-colors" style={{ border: "1px solid #1E1E1E" }}>
          <ChevronLeft className="w-4 h-4" /> Edit Details
        </button>
      )}
    </ModalShell>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-[#0E0E0E] border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6" style={{ scrollbarWidth: "none", fontFamily: "'DM Sans', sans-serif" }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />
        {children}
      </div>
    </div>
  );
}

import AdminApp from "./admin";

// ── Website landing page ───────────────────────────────────────────────────
export default function App() {
  if (window.location.search.includes("admin=true")) {
    return <AdminApp />;
  }
  const [bookingOpen, setBookingOpen] = useState(false);

  const whyUs = [
    { icon: Award, title: "Expert Stylists", desc: "Certified professionals with years of experience" },
    { icon: Sparkles, title: "Premium Products", desc: "Only the finest luxury beauty brands" },
    { icon: Users, title: "Personalized Care", desc: "Tailored services for every client" },
    { icon: CheckCircle2, title: "Hygiene First", desc: "Sanitized tools and clean environment" },
  ];
  const steps = [
    { icon: Scissors, title: "Select Service", desc: "Choose from our range of premium services" },
    { icon: Calendar, title: "Choose Time", desc: "Pick your preferred date and time slot" },
    { icon: CreditCard, title: "Pay Advance", desc: "Secure your booking with a small deposit" },
    { icon: CheckCircle2, title: "Confirm Booking", desc: "Receive instant confirmation via SMS" },
  ];
  const reviews = [
    { name: "Sarah Johnson", text: "Absolutely amazing experience! The staff is professional and the ambiance is so luxurious.", date: "2 weeks ago" },
    { name: "Michael Chen", text: "I've been coming here for months. The haircuts are always perfect and the service is top-notch.", date: "1 month ago" },
    { name: "Emily Davis", text: "Got my bridal makeup done here and I looked stunning! Thank you for making my special day beautiful.", date: "3 weeks ago" },
  ];
  const gallery = [
    "https://images.unsplash.com/photo-1773904215697-e6c21fc27ac2?w=600&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1622336889416-8d790ad807d7?w=600&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1610047614301-13c63f00c032?w=600&h=600&fit=crop&auto=format",
  ];

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <button 
        onClick={() => {
          const url = new URL(window.location.href);
          url.searchParams.set('admin', 'true');
          window.location.href = url.toString();
        }} 
        className="absolute top-4 right-4 z-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors border"
        style={{ borderColor: GOLD, color: GOLD, background: "rgba(212,175,55,0.1)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.2)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(212,175,55,0.1)")}
      >
        Admin Panel
      </button>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-600 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-600 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center">
            <ImageWithFallback 
              src={salonLogo} 
              alt="Salon Lotus Infinity Logo" 
              className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-yellow-600 text-lg"><span>Hair</span><span>•</span><span>Nails</span><span>•</span><span>Beauty</span></div>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">Experience the epitome of luxury and elegance. Where beauty meets perfection, and every visit transforms you into your most radiant self.</p>
          <button onClick={() => setBookingOpen(true)} className="px-12 py-4 rounded-xl font-bold text-lg transition-all" style={{ background: GOLD, color: "#000" }} onMouseEnter={e => (e.currentTarget.style.background = GOLD_DIM)} onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>Book Appointment</button>
        </div>
      </section>

    
      {/* Services */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Popular Services</h2><div className="w-24 h-1 mx-auto" style={{ background: GOLD }} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WEB_SERVICES.map(svc => (
              <div key={svc.name} onClick={() => setBookingOpen(true)} className="group bg-zinc-900 border border-gray-800 hover:border-yellow-600 transition-all duration-300 overflow-hidden cursor-pointer rounded-xl">
                <div className="relative h-48 overflow-hidden bg-zinc-800">
                  <ImageWithFallback src={svc.img} alt={svc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute top-4 right-4"><div className="p-2 rounded-full" style={{ background: GOLD }}><Scissors className="w-4 h-4 text-black" /></div></div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-1">{svc.name}</h3>
                  <p style={{ color: GOLD }}>${svc.price}+</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 px-4 bg-zinc-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Why Choose Us</h2><div className="w-24 h-1 mx-auto" style={{ background: GOLD }} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center space-y-4">
                <div className="flex justify-center"><div className="p-4 rounded-full" style={{ background: GOLD }}><Icon className="w-8 h-8 text-black" /></div></div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to book */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>How to Book</h2><div className="w-24 h-1 mx-auto mb-4" style={{ background: GOLD }} /><p className="text-gray-400">Simple booking in 4 steps</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-zinc-900 border border-gray-800 hover:border-yellow-600 rounded-xl p-6 transition-colors text-center">
                <div className="flex justify-center mb-5 relative">
                  <div className="p-4 rounded-full" style={{ background: GOLD }}><Icon className="w-7 h-7 text-black" /></div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-black border-2 text-white" style={{ borderColor: GOLD }}>{i + 1}</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => setBookingOpen(true)} className="px-10 py-4 rounded-xl font-bold text-lg transition-all" style={{ background: GOLD, color: "#000" }} onMouseEnter={e => (e.currentTarget.style.background = GOLD_DIM)} onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>Start Booking</button>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 px-4 bg-zinc-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Our Gallery</h2><div className="w-24 h-1 mx-auto mb-4" style={{ background: GOLD }} /><p className="text-gray-400">Glimpse of our work and luxury ambiance</p></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl aspect-square group cursor-pointer border border-gray-800 hover:border-yellow-600 transition-colors">
                <ImageWithFallback src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Sparkles className="w-10 h-10 text-yellow-600" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>What Clients Say</h2><div className="w-24 h-1 mx-auto" style={{ background: GOLD }} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(r => (
              <div key={r.name} className="bg-zinc-900 border border-gray-800 rounded-xl p-6">
                <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-600 text-yellow-600" />)}</div>
                <p className="text-gray-300 mb-4 leading-relaxed text-sm">{r.text}</p>
                <div className="pt-4 border-t border-gray-800"><p className="font-semibold text-sm">{r.name}</p><p className="text-xs text-gray-500">{r.date}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-zinc-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Get In Touch</h2><div className="w-24 h-1 mx-auto" style={{ background: GOLD }} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[{ icon: Phone, title: "Phone", content: "+1 (234) 567-890" },{ icon: MessageCircle, title: "WhatsApp", content: "+1 (234) 567-890" },{ icon: MapPin, title: "Address", content: "123 Luxury Street, Beauty District, New York, NY 10001" },{ icon: Clock, title: "Hours", content: "Mon–Sat: 9:00 AM–8:00 PM · Sun: 10:00 AM–6:00 PM" }].map(({ icon: Icon, title, content }) => (
                <div key={title} className="bg-zinc-900 border border-gray-800 hover:border-yellow-600 rounded-xl p-5 transition-colors flex items-start gap-4">
                  <div className="p-3 rounded-full shrink-0" style={{ background: GOLD }}><Icon className="w-5 h-5 text-black" /></div>
                  <div><h3 className="font-semibold mb-1">{title}</h3><p className="text-gray-400 text-sm">{content}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-zinc-900 border border-gray-800 rounded-xl min-h-[350px] flex items-center justify-center">
              <div className="text-center space-y-3"><MapPin className="w-12 h-12 mx-auto" style={{ color: GOLD }} /><p className="text-gray-400">Google Maps Integration</p><p className="text-gray-600 text-sm">Embed your location here</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800 text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: GOLD }} />
        <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Salon Lotus Infinity</h3>
        <p className="text-gray-500 text-sm mb-4">Where Beauty Meets Perfection</p>
        <p className="text-gray-700 text-xs">© 2026 Salon Lotus Infinity. All rights reserved.</p>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent md:hidden z-40">
        <button onClick={() => setBookingOpen(true)} className="w-full py-4 rounded-xl font-bold text-lg shadow-2xl" style={{ background: GOLD, color: "#000" }}>Book Now</button>
      </div>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
