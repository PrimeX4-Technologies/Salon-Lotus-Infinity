import { useState, useMemo } from "react";
import {
  Clock, Scissors, Users, CheckCircle2,
  ChevronDown, LayoutDashboard, CalendarDays, Settings, Bell, Search,
  Menu, DollarSign, TrendingUp, MoreHorizontal, CheckCircle, XCircle, UserX,
  CalendarCheck, UserCheck, Save, AlertCircle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Shared Palette & Helpers ──────────────────────────────────────────────────
const GOLD        = "#D4AF37";
const GOLD_DIM    = "#B8962A";
const GOLD_FAINT  = "rgba(212,175,55,0.08)";
const GOLD_BORDER = "rgba(212,175,55,0.25)";
const CARD_BG     = "#141414";
const BORDER      = "#1E1E1E";
const BORDER2     = "#2A2A2A";

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
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom:"1px solid #1A1A1A" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background:GOLD_FAINT, border:`1px solid ${GOLD_BORDER}` }}><img src="/salon-logo.webp" className="w-4 h-4" /></div>
        {!collapsed && <div className="min-w-0"><p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily:"'Playfair Display', serif" }}>Salon Lotus</p><p className="text-zinc-600 text-xs">Admin Panel</p></div>}
      </div>
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

// ── Main Admin Application Component ─────────────────────────────────────────
export default function AdminApp() {
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