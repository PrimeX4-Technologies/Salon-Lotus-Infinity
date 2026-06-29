import { useState, useRef, useEffect, useMemo } from "react";
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
  service: typeof WEB_SERVICES[0] | null;
  date: Date | null;
  time: string | null;
  name: string; mobile: string; notes: string;
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300"
            style={i < current ? { background: GOLD_DIM, color: "#000" } : i === current ? { background: GOLD, color: "#000", boxShadow: `0 0 0 3px ${GOLD_FAINT}` } : { background: "#27272A", color: "#71717A", border: "1px solid #3F3F46" }}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && <div className="w-5 h-px" style={{ background: i < current ? GOLD : "#3F3F46" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Booking modal ──────────────────────────────────────────────────────────
function BookingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingState>({ service: null, date: null, time: null, name: "", mobile: "", notes: "" });
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5);

  const canNext = [!!booking.service, !!booking.date, !!booking.time, booking.name.trim().length > 1 && booking.mobile.trim().length > 6, true][step];

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
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const toDateKey = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  if (confirmed && booking.service) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(52,211,153,0.1)", border: "2px solid #34D399" }}>
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Confirmed!</h3>
          <p className="text-zinc-400 text-sm max-w-xs">Your <span className="text-white font-semibold">{booking.service.name}</span> appointment is confirmed. We'll send a reminder before your visit.</p>
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
      <StepIndicator current={step} total={5} />
      {/* Step titles */}
      <div className="text-center mb-5">
        <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          {["Choose Your Service","Pick a Date","Select a Time","Your Details","Review & Confirm"][step]}
        </h3>
        <p className="text-zinc-500 text-xs mt-0.5">
          {["Select from our premium offerings","When would you like to visit?","Choose your preferred slot","Tell us about yourself","Finalize your appointment"][step]}
        </p>
      </div>

      <div className="min-h-[260px]">
        {/* Step 0 — Service */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-0.5" style={{ scrollbarWidth: "none" }}>
            {WEB_SERVICES.map(svc => {
              const sel = booking.service?.name === svc.name;
              return (
                <button key={svc.name} onClick={() => setBooking(b => ({ ...b, service: svc, time: null }))}
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
        )}

        {/* Step 1 — Date */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">{DAY_ABBR.map(d => <div key={d} className="text-center text-xs text-zinc-600 font-semibold py-1">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const key = toDateKey(day);
                const past = new Date(key) < new Date("2026-06-22");
                const sel = booking.date?.toISOString().slice(0,10) === key;
                return (
                  <button key={day} disabled={past} onClick={() => setBooking(b => ({ ...b, date: new Date(key), time: null }))}
                    className="aspect-square rounded-xl text-xs font-medium transition-all"
                    style={{ background: sel ? GOLD : "transparent", color: past ? "#3F3F46" : sel ? "#000" : "#A1A1AA", border: sel ? `1px solid ${GOLD}` : "1px solid transparent", cursor: past ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (!sel && !past) e.currentTarget.style.background = "#1E1E1E"; }}
                    onMouseLeave={e => { if (!sel && !past) e.currentTarget.style.background = "transparent"; }}>
                    {day}
                  </button>
                );
              })}
            </div>
            {booking.date && <p className="text-center text-xs mt-3" style={{ color: GOLD }}>{booking.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>}
          </div>
        )}

        {/* Step 2 — Time */}
        {step === 2 && (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {TIME_SLOTS.map(slot => {
                const sel = booking.time === slot.time;
                return (
                  <button key={slot.time} onClick={() => { if (!slot.available) { setAttempted(slot.time); } else { setAttempted(null); setBooking(b => ({ ...b, time: slot.time })); } }}
                    className="py-2.5 px-2 rounded-lg text-xs font-semibold border transition-all"
                    style={sel ? { background: GOLD, color: "#000", border: `1px solid ${GOLD}` } : slot.available ? { background: "#141414", color: "#D4D4D8", border: "1px solid #2A2A2A" } : { background: "#0A0A0A", color: "#3F3F46", border: "1px solid #1A1A1A" }}>
                    {slot.time}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center text-xs mb-3">
              {[["#2A2A2A","#D4D4D8","Available"],["#D4AF37","#000","Selected"],["#1A1A1A","#3F3F46","Unavailable"]].map(([bg,c,l]) => (
                <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: bg }} /><span className="text-zinc-500">{l}</span></div>
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

        {/* Step 3 — Details */}
        {step === 3 && (
          <div className="space-y-3.5">
            {[
              { label: "Full Name", field: "name" as const, icon: User, placeholder: "Your full name", type: "text" },
              { label: "Mobile Number", field: "mobile" as const, icon: Phone, placeholder: "+1 (234) 567-890", type: "tel" },
            ].map(({ label, field, icon: Icon, placeholder, type }) => (
              <div key={field}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{label} <span style={{ color: GOLD }}>*</span></label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input type={type} value={booking[field]} onChange={e => setBooking(b => ({ ...b, [field]: e.target.value }))} placeholder={placeholder}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Notes <span className="text-zinc-700 normal-case font-normal">(optional)</span></label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 w-4 h-4 text-zinc-600" />
                <textarea value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} placeholder="Any special requests…" rows={3} className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Confirm */}
        {step === 4 && booking.service && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GOLD_BORDER}` }}>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD, background: GOLD_FAINT }}>Appointment Summary</div>
              {[["Service", booking.service.name],["Date", booking.date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) ?? ""],["Time", booking.time ?? ""],["Duration", booking.service.duration]].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <span className="text-zinc-500 text-sm">{l}</span>
                  <span className="text-white text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER2}` }}>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500" style={{ background: "#141414" }}>Payment</div>
              {[["Total Price", `$${booking.service.price}`],["Advance Now", `$${booking.service.advance}`],["Remaining at Salon", `$${booking.service.price - booking.service.advance}`]].map(([l, v], i) => (
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
              <CreditCard className="w-4 h-4" /> Pay ${booking.service.advance} &amp; Confirm
            </button>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {step < 4 && (
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
            {step === 3 ? "Review Booking" : "Continue"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {step === 4 && (
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

// ── Website landing page ───────────────────────────────────────────────────
function WebsiteMode({ onSwitchToAdmin }: { onSwitchToAdmin: () => void }) {
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
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-600 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-600 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center">
            <ImageWithFallback 
              src="/src/app/images/salon_logo.webp" 
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
                  <div className="absolute inset-3 bg-gradient-to-t  via-black/20 to-transparent" />
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MODE
// ═══════════════════════════════════════════════════════════════════════════════

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type AppStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "No Show";
type PayStatus = "Paid" | "Advance Paid" | "Pending";
type Category = "Hair" | "Nails" | "Skin" | "Makeup" | "Bridal" | "Wellness";
type ServiceStatus = "Active" | "Inactive";
type AdminView = "dashboard" | "appointments" | "services" | "availability";

const DAYS: DayKey[] = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAY_FULL: Record<DayKey, string> = { Mon:"Monday",Tue:"Tuesday",Wed:"Wednesday",Thu:"Thursday",Fri:"Friday",Sat:"Saturday",Sun:"Sunday" };
const STAFF_LIST = [
  { id:"s1", name:"Nadia Hassan",  initials:"NH", role:"Senior Stylist" },
  { id:"s2", name:"Sofia Reyes",   initials:"SR", role:"Color Specialist" },
  { id:"s3", name:"Arjun Mehta",   initials:"AM", role:"Barber" },
  { id:"s4", name:"Lena Kovacs",   initials:"LK", role:"Nail Technician" },
];
const CATEGORIES: Category[] = ["Hair","Nails","Skin","Makeup","Bridal","Wellness"];
const CAT_CONFIG: Record<Category,{color:string;bg:string;border:string}> = {
  Hair:    { color:"#A78BFA", bg:"rgba(167,139,250,0.1)", border:"rgba(167,139,250,0.3)" },
  Nails:   { color:"#F472B6", bg:"rgba(244,114,182,0.1)", border:"rgba(244,114,182,0.3)" },
  Skin:    { color:"#34D399", bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.3)" },
  Makeup:  { color:"#FB923C", bg:"rgba(251,146,60,0.1)",  border:"rgba(251,146,60,0.3)" },
  Bridal:  { color:GOLD,      bg:GOLD_FAINT,               border:GOLD_BORDER },
  Wellness:{ color:"#60A5FA", bg:"rgba(96,165,250,0.1)",  border:"rgba(96,165,250,0.3)" },
};
const STATUS_CONFIG: Record<AppStatus,{color:string;bg:string;border:string;icon:React.ElementType}> = {
  Pending:   { color:"#F59E0B", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.3)",  icon:Clock },
  Confirmed: { color:"#60A5FA", bg:"rgba(96,165,250,0.1)",  border:"rgba(96,165,250,0.3)",  icon:CalendarCheck },
  Completed: { color:"#34D399", bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.3)",  icon:CheckCircle },
  Cancelled: { color:"#F87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.3)", icon:XCircle },
  "No Show": { color:"#9CA3AF", bg:"rgba(156,163,175,0.1)", border:"rgba(156,163,175,0.3)", icon:UserX },
};
const PAY_CONFIG: Record<PayStatus,{color:string;bg:string}> = {
  Paid:           { color:"#34D399", bg:"rgba(52,211,153,0.1)" },
  "Advance Paid": { color:GOLD,      bg:GOLD_FAINT },
  Pending:        { color:"#F87171", bg:"rgba(248,113,113,0.1)" },
};
const TODAY = "2026-06-22";
const REVENUE_DATA = [
  {day:"Mon",revenue:320},{day:"Tue",revenue:480},{day:"Wed",revenue:390},
  {day:"Thu",revenue:610},{day:"Fri",revenue:740},{day:"Sat",revenue:920},{day:"Sun",revenue:540},
];
const SEED_APPOINTMENTS = [
  { id:"APT-001", customer:{name:"Priya Sharma",phone:"+91 98765 43210"}, service:"Bridal Dressing", stylist:"Nadia Hassan", date:TODAY, time:"9:00 AM", duration:"4 hrs", price:250, advance:80, status:"Confirmed" as AppStatus, paymentStatus:"Advance Paid" as PayStatus },
  { id:"APT-002", customer:{name:"Ayesha Malik",phone:"+91 90001 12345"}, service:"Hair Coloring", stylist:"Sofia Reyes", date:TODAY, time:"10:30 AM", duration:"2 hrs", price:80, advance:25, status:"Completed" as AppStatus, paymentStatus:"Paid" as PayStatus },
  { id:"APT-003", customer:{name:"Rania Al-Farsi",phone:"+91 88776 55443"}, service:"Keratin Treatment", stylist:"Nadia Hassan", date:TODAY, time:"11:00 AM", duration:"3 hrs", price:120, advance:40, status:"Confirmed" as AppStatus, paymentStatus:"Advance Paid" as PayStatus },
  { id:"APT-004", customer:{name:"James Fernandez",phone:"+91 97654 32109"}, service:"Men's Hair Cut", stylist:"Arjun Mehta", date:TODAY, time:"12:00 PM", duration:"30 min", price:30, advance:0, status:"Pending" as AppStatus, paymentStatus:"Pending" as PayStatus },
  { id:"APT-005", customer:{name:"Layla Nour",phone:"+91 91234 56789"}, service:"Facial", stylist:"Sofia Reyes", date:TODAY, time:"1:30 PM", duration:"1 hr", price:60, advance:20, status:"Pending" as AppStatus, paymentStatus:"Advance Paid" as PayStatus },
  { id:"APT-006", customer:{name:"Chen Wei",phone:"+91 89999 00111"}, service:"Ladies Hair Cut", stylist:"Nadia Hassan", date:TODAY, time:"3:00 PM", duration:"45 min", price:45, advance:15, status:"Cancelled" as AppStatus, paymentStatus:"Pending" as PayStatus },
  { id:"APT-007", customer:{name:"Meera Pillai",phone:"+91 95555 67890"}, service:"Nails", stylist:"Sofia Reyes", date:TODAY, time:"4:00 PM", duration:"1 hr", price:35, advance:10, status:"Confirmed" as AppStatus, paymentStatus:"Advance Paid" as PayStatus },
  { id:"APT-008", customer:{name:"David Osei",phone:"+91 96666 11223"}, service:"Makeup", stylist:"Arjun Mehta", date:TODAY, time:"5:30 PM", duration:"1.5 hrs", price:70, advance:25, status:"No Show" as AppStatus, paymentStatus:"Advance Paid" as PayStatus },
];
const SEED_SERVICES = [
  { id:"svc-001", name:"Men's Hair Cut",    category:"Hair" as Category,    duration:30,  price:30,  advance:10, description:"Precision cut for men. Includes wash, cut, and style.", staff:["s1","s3"], status:"Active" as ServiceStatus, bookings:142 },
  { id:"svc-002", name:"Ladies Hair Cut",   category:"Hair" as Category,    duration:45,  price:45,  advance:15, description:"Expert cut and blow-dry. Consultation included.",         staff:["s1","s2"], status:"Active" as ServiceStatus, bookings:218 },
  { id:"svc-003", name:"Hair Coloring",     category:"Hair" as Category,    duration:120, price:80,  advance:25, description:"Full color, highlights, or balayage.",                    staff:["s2"],     status:"Active" as ServiceStatus, bookings:89 },
  { id:"svc-004", name:"Keratin Treatment", category:"Hair" as Category,    duration:180, price:120, advance:40, description:"Smoothing treatment for frizz control. Lasts 3–5 months.",staff:["s1","s2"], status:"Active" as ServiceStatus, bookings:54 },
  { id:"svc-005", name:"Classic Facial",    category:"Skin" as Category,    duration:60,  price:60,  advance:20, description:"Deep cleanse, mask and moisturising for all skin types.",  staff:["s2","s4"], status:"Active" as ServiceStatus, bookings:76 },
  { id:"svc-006", name:"Luxury Manicure",   category:"Nails" as Category,   duration:60,  price:35,  advance:10, description:"Shaping, cuticle care, hand massage and polish.",          staff:["s2","s4"], status:"Active" as ServiceStatus, bookings:131 },
  { id:"svc-007", name:"Bridal Makeup",     category:"Makeup" as Category,  duration:120, price:150, advance:50, description:"Full bridal glam with airbrush option.",                  staff:["s2"],     status:"Active" as ServiceStatus, bookings:37 },
  { id:"svc-008", name:"Bridal Dressing",   category:"Bridal" as Category,  duration:240, price:250, advance:80, description:"Complete bridal package: hair, makeup, draping.",          staff:["s1","s2"], status:"Active" as ServiceStatus, bookings:22 },
  { id:"svc-009", name:"Anti-Aging Facial", category:"Skin" as Category,    duration:90,  price:95,  advance:30, description:"Advanced facial with serums and LED therapy.",             staff:["s4"],     status:"Inactive" as ServiceStatus, bookings:18 },
];

// ── Admin shared small components ─────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{ width:44, height:24 }} className="relative shrink-0">
      <div className="absolute inset-0 rounded-full transition-colors duration-200" style={{ background: on ? "#34D399" : "#3F3F46" }} />
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow" style={{ left: on ? "calc(100% - 20px)" : 4 }} />
    </button>
  );
}
function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status]; const Icon = cfg.icon;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}><Icon className="w-3 h-3" />{status}</span>;
}
function PayBadge({ status }: { status: PayStatus }) {
  const cfg = PAY_CONFIG[status];
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color:cfg.color, background:cfg.bg }}>{status}</span>;
}
function CatBadge({ cat }: { cat: Category }) {
  const c = CAT_CONFIG[cat];
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color:c.color, background:c.bg, border:`1px solid ${c.border}` }}>{cat}</span>;
}
function StaffAvatars({ ids }: { ids: string[] }) {
  return (
    <div className="flex -space-x-1.5">
      {ids.slice(0,3).map(id => { const s = STAFF_LIST.find(x => x.id===id); if(!s) return null; return <div key={id} title={s.name} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:GOLD_FAINT, color:GOLD, boxShadow:"0 0 0 1.5px #0A0A0A" }}>{s.initials}</div>; })}
      {ids.length > 3 && <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background:"#1E1E1E", color:"#6B7280", boxShadow:"0 0 0 1.5px #0A0A0A" }}>+{ids.length-3}</div>}
    </div>
  );
}

// ── Dashboard view ─────────────────────────────────────────────────────────
function DashboardView({ appointments }: { appointments: typeof SEED_APPOINTMENTS }) {
  const today = appointments.filter(a => a.date === TODAY);
  const pending = appointments.filter(a => a.status === "Pending").length;
  const completed = appointments.filter(a => a.status === "Completed").length;
  const revenue = appointments.filter(a => a.paymentStatus === "Paid").reduce((s,a) => s+a.price, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Today's Appointments", value:today.length,    icon:CalendarCheck, accent:GOLD },
          { label:"Pending Payments",      value:pending,         icon:AlertCircle,   accent:"#F59E0B" },
          { label:"Completed",             value:completed,       icon:CheckCircle,   accent:"#34D399" },
          { label:"Total Revenue",         value:`$${revenue}`,   icon:DollarSign,    accent:"#60A5FA" },
        ].map(({ label, value, icon:Icon, accent }) => (
          <div key={label} className="rounded-2xl px-5 py-4 flex flex-col gap-3" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${accent}18`, border:`1px solid ${accent}28` }}><Icon className="w-5 h-5" style={{ color:accent }} /></div>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white" style={{ fontFamily:"'DM Mono', monospace" }}>{value}</p>
              <p className="text-zinc-400 text-sm mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-white font-semibold" style={{ fontFamily:"'Playfair Display', serif" }}>Weekly Revenue</h3><p className="text-zinc-500 text-xs mt-0.5">Jun 16 – Jun 22, 2026</p></div>
          <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ color:GOLD, background:GOLD_FAINT }}>$4,000 total</span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={REVENUE_DATA} margin={{ top:4, right:4, bottom:0, left:-20 }}>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GOLD} stopOpacity={0.25} /><stop offset="95%" stopColor={GOLD} stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" tick={{ fill:"#6B6B6B", fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#6B6B6B", fontSize:11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:8, color:"#fff", fontSize:12 }} cursor={{ stroke:GOLD_BORDER }} />
            <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} fill="url(#g)" dot={false} activeDot={{ r:4, fill:GOLD, strokeWidth:0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${BORDER}` }}>
          <h3 className="text-white font-semibold" style={{ fontFamily:"'Playfair Display', serif" }}>Today — {new Date(TODAY).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</h3>
          <span className="text-zinc-500 text-xs">{today.length} appointments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom:`1px solid ${BORDER}` }}>{["Customer","Service","Time","Status","Payment"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">{h}</th>)}</tr></thead>
            <tbody>
              {today.map((a,i) => (
                <tr key={a.id} style={{ borderBottom: i<today.length-1 ? `1px solid #181818` : "none" }} onMouseEnter={e=>(e.currentTarget.style.background="#181818")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="px-4 py-3"><p className="text-white font-medium text-sm">{a.customer.name}</p><p className="text-zinc-500 text-xs">{a.customer.phone}</p></td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{a.service}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{a.time}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><PayBadge status={a.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Appointments view ──────────────────────────────────────────────────────
function AppointmentsView({ appointments, onStatusChange }: { appointments: typeof SEED_APPOINTMENTS; onStatusChange:(id:string,s:AppStatus)=>void }) {
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState<AppStatus|"All">("All");
  const [openMenu, setOpenMenu] = useState<string|null>(null);
  const filtered = useMemo(() => appointments.filter(a => {
    const q = search.toLowerCase();
    return (!search || a.customer.name.toLowerCase().includes(q) || a.service.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)) && (sf==="All" || a.status===sf);
  }), [appointments,search,sf]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5" style={{ background:CARD_BG, border:`1px solid ${BORDER2}` }}>
          <Search className="w-4 h-4 text-zinc-600 shrink-0" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer, service, ID…" className="bg-transparent outline-none text-white text-sm flex-1 placeholder:text-zinc-600" />
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {(["All","Pending","Confirmed","Completed","Cancelled","No Show"] as (AppStatus|"All")[]).map(tab => {
          const active = sf===tab; const cfg = tab!=="All" ? STATUS_CONFIG[tab] : null;
          return <button key={tab} onClick={()=>setSf(tab)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={active ? { background:tab==="All"?GOLD_FAINT:cfg!.bg, color:tab==="All"?GOLD:cfg!.color, border:`1px solid ${tab==="All"?GOLD_BORDER:cfg!.border}` } : { background:CARD_BG, color:"#6B6B6B", border:`1px solid ${BORDER}` }}>{tab} <span className="ml-1 opacity-50">{tab==="All"?appointments.length:appointments.filter(a=>a.status===tab).length}</span></button>;
        })}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom:`1px solid ${BORDER}` }}>{["Customer","Service","Stylist","Date & Time","Status","Payment","Actions"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((a,i) => (
                <tr key={a.id} style={{ borderBottom:i<filtered.length-1?`1px solid #181818`:"none" }} onMouseEnter={e=>(e.currentTarget.style.background="#181818")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="px-4 py-3"><p className="text-white font-medium">{a.customer.name}</p><p className="text-zinc-500 text-xs">{a.customer.phone}</p></td>
                  <td className="px-4 py-3 text-zinc-300">{a.service}<p className="text-zinc-600 text-xs">{a.duration}</p></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:GOLD_FAINT, color:GOLD }}>{a.stylist.split(" ").map(n=>n[0]).join("")}</div><span className="text-zinc-400 text-xs">{a.stylist}</span></div></td>
                  <td className="px-4 py-3"><p className="text-zinc-300 font-mono text-xs">{a.time}</p><p className="text-zinc-600 text-xs">{new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</p></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><PayBadge status={a.paymentStatus} /><p className="text-zinc-600 text-xs font-mono mt-0.5">${a.price}</p></td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button onClick={()=>setOpenMenu(openMenu===a.id?null:a.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      {openMenu===a.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 rounded-xl py-1.5 w-40 shadow-2xl" style={{ background:"#1A1A1A", border:`1px solid ${BORDER2}` }}>
                          {(["Confirmed","Completed","Cancelled","No Show"] as AppStatus[]).filter(s=>s!==a.status).map(s=>{const cfg=STATUS_CONFIG[s];const Icon=cfg.icon;return(
                            <button key={s} onClick={()=>{onStatusChange(a.id,s);setOpenMenu(null);}} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors" style={{ color:cfg.color }}><Icon className="w-3 h-3" />{s}</button>
                          );})}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Services view ──────────────────────────────────────────────────────────
function ServicesView() {
  const [services, setServices] = useState(SEED_SERVICES);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Category|"All">("All");
  const filtered = useMemo(()=>services.filter(s=>{
    const q=search.toLowerCase();
    return (!search||s.name.toLowerCase().includes(q)) && (catFilter==="All"||s.category===catFilter);
  }),[services,search,catFilter]);
  const toggleStatus = (id:string) => setServices(prev=>prev.map(s=>s.id===id?{...s,status:s.status==="Active"?"Inactive":"Active" as ServiceStatus}:s));
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5" style={{ background:CARD_BG, border:`1px solid ${BORDER2}` }}>
          <Search className="w-4 h-4 text-zinc-600 shrink-0" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services…" className="bg-transparent outline-none text-white text-sm flex-1 placeholder:text-zinc-600" />
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {(["All",...CATEGORIES] as (Category|"All")[]).map(cat=>{
          const active=catFilter===cat; const cfg=cat!=="All"?CAT_CONFIG[cat]:null;
          return <button key={cat} onClick={()=>setCatFilter(cat)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={active?{background:cat==="All"?GOLD_FAINT:cfg!.bg,color:cat==="All"?GOLD:cfg!.color,border:`1px solid ${cat==="All"?GOLD_BORDER:cfg!.border}`}:{background:CARD_BG,color:"#6B6B6B",border:`1px solid ${BORDER}`}}>{cat}</button>;
        })}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom:`1px solid ${BORDER}` }}>{["Service","Category","Duration","Price","Staff","Status"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s,i)=>(
                <tr key={s.id} style={{ borderBottom:i<filtered.length-1?`1px solid #181818`:"none" }} onMouseEnter={e=>(e.currentTarget.style.background="#181818")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="px-4 py-3.5"><p className="text-white font-semibold text-sm">{s.name}</p><p className="text-zinc-600 text-xs mt-0.5 max-w-[180px] truncate">{s.description}</p></td>
                  <td className="px-4 py-3.5"><CatBadge cat={s.category} /></td>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-1.5 text-zinc-400 text-xs"><Clock className="w-3.5 h-3.5 text-zinc-600" />{fmtDuration(s.duration)}</div></td>
                  <td className="px-4 py-3.5"><p className="text-white font-semibold font-mono text-sm">${s.price}</p>{s.advance>0&&<p className="text-zinc-600 text-xs">Adv. ${s.advance}</p>}</td>
                  <td className="px-4 py-3.5"><StaffAvatars ids={s.staff} /></td>
                  <td className="px-4 py-3.5"><button onClick={()=>toggleStatus(s.id)} className="transition-opacity hover:opacity-75"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color:s.status==="Active"?"#34D399":"#6B7280", background:s.status==="Active"?"rgba(52,211,153,0.1)":"rgba(107,114,128,0.1)", border:`1px solid ${s.status==="Active"?"rgba(52,211,153,0.3)":"rgba(107,114,128,0.2)"}` }}><span className="w-1.5 h-1.5 rounded-full" style={{ background:s.status==="Active"?"#34D399":"#6B7280" }} />{s.status}</span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Availability view (abbreviated) ───────────────────────────────────────
function AvailabilityView() {
  const [schedule, setSchedule] = useState<Record<DayKey,{open:boolean;openTime:string;closeTime:string}>>({
    Mon:{open:true,openTime:"09:00",closeTime:"20:00"}, Tue:{open:true,openTime:"09:00",closeTime:"20:00"},
    Wed:{open:true,openTime:"09:00",closeTime:"20:00"}, Thu:{open:true,openTime:"09:00",closeTime:"20:00"},
    Fri:{open:true,openTime:"09:00",closeTime:"21:00"}, Sat:{open:true,openTime:"09:00",closeTime:"21:00"},
    Sun:{open:false,openTime:"10:00",closeTime:"18:00"},
  });
  const [buffer, setBuffer] = useState(15);
  const [maxSlot, setMaxSlot] = useState(2);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-sm">Configure opening hours and booking rules</p>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background:saved?"#34D399":GOLD, color:"#000" }} onMouseEnter={e=>{if(!saved)e.currentTarget.style.background=GOLD_DIM;}} onMouseLeave={e=>{if(!saved)e.currentTarget.style.background=GOLD;}}>
          {saved?<><CheckCircle2 className="w-4 h-4"/>Saved!</>:<><Save className="w-4 h-4"/>Save Changes</>}
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}>
        <div className="px-5 py-4" style={{ borderBottom:`1px solid ${BORDER}` }}><h3 className="text-white font-semibold" style={{ fontFamily:"'Playfair Display', serif" }}>Working Hours</h3></div>
        <div className="divide-y" style={{ divideColor:BORDER }}>
          {DAYS.map(day=>{
            const d = schedule[day];
            return (
              <div key={day} className="flex items-center gap-4 px-5 py-3.5 flex-wrap">
                <Toggle on={d.open} onChange={v=>setSchedule(s=>({...s,[day]:{...s[day],open:v}}))} />
                <span className="text-white text-sm font-medium w-24">{DAY_FULL[day]}</span>
                {d.open ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative"><select value={d.openTime} onChange={e=>setSchedule(s=>({...s,[day]:{...s[day],openTime:e.target.value}}))} className="bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-lg px-3 py-1.5 text-white text-xs outline-none appearance-none pr-7 cursor-pointer" style={{ colorScheme:"dark" }}>{TIME_OPTS.map(t=><option key={t} value={t}>{fmtTime(t)}</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none"/></div>
                    <span className="text-zinc-600 text-xs">to</span>
                    <div className="relative"><select value={d.closeTime} onChange={e=>setSchedule(s=>({...s,[day]:{...s[day],closeTime:e.target.value}}))} className="bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-lg px-3 py-1.5 text-white text-xs outline-none appearance-none pr-7 cursor-pointer" style={{ colorScheme:"dark" }}>{TIME_OPTS.map(t=><option key={t} value={t}>{fmtTime(t)}</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none"/></div>
                  </div>
                ) : <span className="text-zinc-600 text-xs px-2.5 py-1 rounded-full" style={{ background:"#1A1A1A", border:"1px solid #282828" }}>Closed</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{label:"Buffer Between Appointments",sub:"Minutes gap between bookings",val:buffer,set:setBuffer,min:0,max:60,unit:"min",accent:"#60A5FA"},
          {label:"Max Appointments Per Slot",sub:"Simultaneous clients allowed",val:maxSlot,set:setMaxSlot,min:1,max:10,unit:"clients",accent:"#A78BFA"}].map(({label,sub,val,set:setV,min,max,unit,accent})=>(
          <div key={label} className="rounded-xl p-4 flex items-center gap-4" style={{ background:CARD_BG, border:`1px solid ${BORDER2}` }}>
            <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold">{label}</p><p className="text-zinc-500 text-xs mt-0.5">{sub}</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={()=>setV(Math.max(min,val-1))} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors text-zinc-400 hover:text-white" style={{ background:"#1E1E1E", border:`1px solid ${BORDER2}` }}>−</button>
              <div className="w-16 text-center"><span className="text-white font-bold font-mono">{val}</span><span className="text-zinc-500 text-xs ml-1">{unit}</span></div>
              <button onClick={()=>setV(Math.min(max,val+1))} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors text-zinc-400 hover:text-white" style={{ background:"#1E1E1E", border:`1px solid ${BORDER2}` }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin sidebar ──────────────────────────────────────────────────────────
const ADMIN_NAV: {id:AdminView;label:string;icon:React.ElementType}[] = [
  { id:"dashboard",    label:"Dashboard",    icon:LayoutDashboard },
  { id:"appointments", label:"Appointments", icon:CalendarDays },
  { id:"services",     label:"Services",     icon:Scissors },
  { id:"availability", label:"Availability", icon:Clock },
];

function AdminSidebar({ active, onNav, collapsed }: { active:AdminView; onNav:(v:AdminView)=>void; collapsed:boolean }) {
  return (
    <aside className="flex flex-col h-full" style={{ background:"#0A0A0A", borderRight:"1px solid #1A1A1A" }}>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {!collapsed && <p className="text-zinc-700 text-xs font-semibold uppercase tracking-widest px-2 mb-3">Main</p>}
        {ADMIN_NAV.map(({id,label,icon:Icon})=>{
          const active_ = active===id;
          return <button key={id} onClick={()=>onNav(id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all" style={active_?{background:GOLD_FAINT,color:GOLD,border:`1px solid ${GOLD_BORDER}`}:{color:"#6B6B6B",border:"1px solid transparent"}} onMouseEnter={e=>{if(!active_){e.currentTarget.style.background="#141414";e.currentTarget.style.color="#A1A1AA";}}} onMouseLeave={e=>{if(!active_){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6B6B6B";}}}><Icon className="w-4 h-4 shrink-0"/>{!collapsed&&label}</button>;
        })}
        <div className="pt-4" style={{ borderTop:"1px solid #1A1A1A" }}>
          {!collapsed&&<p className="text-zinc-700 text-xs font-semibold uppercase tracking-widest px-2 mb-3">Manage</p>}
          {[{label:"Customers",icon:Users},{label:"Stylists",icon:UserCheck},{label:"Settings",icon:Settings}].map(({label,icon:Icon})=>(
            <button key={label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-zinc-700" style={{ border:"1px solid transparent" }} onMouseEnter={e=>{e.currentTarget.style.background="#141414";e.currentTarget.style.color="#6B6B6B";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#4B4B4B";}}><Icon className="w-4 h-4 shrink-0"/>{!collapsed&&label}</button>
          ))}
        </div>
      </nav>
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderTop:"1px solid #1A1A1A" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background:GOLD_FAINT, color:GOLD, border:`1px solid ${GOLD_BORDER}` }}>LA</div>
        {!collapsed&&<div className="min-w-0 flex-1"><p className="text-white text-xs font-semibold truncate">Lotus Admin</p><p className="text-zinc-600 text-xs truncate">admin@salonlotus.com</p></div>}
      </div>
    </aside>
  );
}

function AdminMode({ onSwitchToWebsite }: { onSwitchToWebsite: () => void }) {
  const [view, setView] = useState<AdminView>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appointments, setAppointments] = useState(SEED_APPOINTMENTS);

  const handleStatusChange = (id: string, status: AppStatus) => {
    setAppointments(prev => prev.map(a => a.id===id ? { ...a, status, paymentStatus: status==="Completed" && a.paymentStatus!=="Paid" ? "Paid" as PayStatus : a.paymentStatus } : a));
  };

  const titles: Record<AdminView,string> = { dashboard:"Dashboard", appointments:"All Appointments", services:"Services", availability:"Availability Settings" };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background:"#0A0A0A", fontFamily:"'DM Sans', sans-serif" }}>
      <div className="hidden md:flex flex-col shrink-0 transition-all duration-300" style={{ width:collapsed?64:220 }}>
        <AdminSidebar active={view} onNav={setView} collapsed={collapsed} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background:"rgba(0,0,0,0.7)" }} onClick={()=>setMobileOpen(false)}>
          <div className="w-56 h-full flex flex-col" style={{ background:"#0A0A0A" }} onClick={e=>e.stopPropagation()}>
            <AdminSidebar active={view} onNav={v=>{setView(v);setMobileOpen(false);}} collapsed={false} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background:"#0A0A0A", borderBottom:"1px solid #1A1A1A" }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors" onClick={()=>setMobileOpen(true)}><Menu className="w-4 h-4" /></button>
            <button className="hidden md:flex p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors" onClick={()=>setCollapsed(!collapsed)}><Menu className="w-4 h-4" /></button>
            <div>
              <h1 className="text-white font-semibold" style={{ fontFamily:"'Playfair Display', serif" }}>{titles[view]}</h1>
              <p className="text-zinc-600 text-xs hidden sm:block">Monday, June 22, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Switch to website button */}
            <button
              onClick={onSwitchToWebsite}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background:GOLD_FAINT, color:GOLD, border:`1px solid ${GOLD_BORDER}` }}
              onMouseEnter={e=>{e.currentTarget.style.background=GOLD;e.currentTarget.style.color="#000";}}
              onMouseLeave={e=>{e.currentTarget.style.background=GOLD_FAINT;e.currentTarget.style.color=GOLD;}}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Website</span>
            </button>
            <button className="p-2 rounded-xl text-zinc-500 hover:text-white transition-colors" style={{ background:CARD_BG, border:`1px solid ${BORDER}` }}><Bell className="w-4 h-4" /></button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:GOLD_FAINT, color:GOLD, border:`1px solid ${GOLD_BORDER}` }}>LA</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5">
          {view==="dashboard"    && <DashboardView appointments={appointments} />}
          {view==="appointments" && <AppointmentsView appointments={appointments} onStatusChange={handleStatusChange} />}
          {view==="services"     && <ServicesView />}
          {view==="availability" && <AvailabilityView />}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — mode toggle
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState<"website" | "admin">("website");
  return mode === "website"
    ? <WebsiteMode onSwitchToAdmin={() => setMode("admin")} />
    : <AdminMode   onSwitchToWebsite={() => setMode("website")} />;
}
