import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CircleUserRound, LoaderCircle, LogIn, MessageSquareText, X } from "lucide-react";

import { apiErrorMessage } from "../../api/client";
import { customerApi } from "../../api/customer";
import { publicApi } from "../../api/public";
import type { Booking, Customer } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../components/AsyncState";
import { formatDateTime, formatMoney } from "../../lib/format";

type Tab = "bookings" | "inquiries" | "profile";

const statusStyle: Record<string, string> = {
  requested: "border-amber-800 bg-amber-950/30 text-amber-300",
  pending_advance: "border-orange-800 bg-orange-950/30 text-orange-300",
  confirmed: "border-blue-800 bg-blue-950/30 text-blue-300",
  checked_in: "border-violet-800 bg-violet-950/30 text-violet-300",
  in_progress: "border-purple-800 bg-purple-950/30 text-purple-300",
  completed: "border-emerald-800 bg-emerald-950/30 text-emerald-300",
  cancelled: "border-red-900 bg-red-950/30 text-red-300",
  no_show: "border-zinc-700 bg-zinc-900 text-zinc-400",
  new: "border-amber-800 bg-amber-950/30 text-amber-300",
  reviewing: "border-blue-800 bg-blue-950/30 text-blue-300",
  quoted: "border-violet-800 bg-violet-950/30 text-violet-300",
  accepted: "border-emerald-800 bg-emerald-950/30 text-emerald-300",
  declined: "border-red-900 bg-red-950/30 text-red-300",
  expired: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

const StatusBadge = ({ status }: { status: string }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[status] || statusStyle.no_show}`}>{status.replaceAll("_", " ")}</span>;

function CancelBookingDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => customerApi.cancelBooking(booking!._id, reason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
      onClose();
    },
  });
  if (!booking) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onMouseDown={onClose}><div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6" onMouseDown={(event) => event.stopPropagation()}><div className="flex justify-between"><div><p className="text-xs uppercase tracking-wider text-red-400">Cancel appointment</p><h2 className="mt-1 font-serif text-xl text-white">{booking.reference}</h2></div><button onClick={onClose}><X className="h-5 w-5 text-zinc-500" /></button></div><label className="mt-5 block text-sm text-zinc-300">Reason<textarea required maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-700" /></label>{mutation.error && <p className="mt-3 text-sm text-red-300">{apiErrorMessage(mutation.error)}</p>}<button disabled={!reason.trim() || mutation.isPending} onClick={() => mutation.mutate()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 py-3 font-semibold text-white disabled:opacity-50">{mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}Cancel appointment</button></div></div>;
}

function ProfileForm({ profile }: { profile: Customer }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: profile.name, preferredName: profile.preferredName || "", gender: profile.gender, dateOfBirth: profile.dateOfBirth || "", preferredBranchId: profile.preferredBranchId || "" });
  const branches = useQuery({ queryKey: ["public", "branches"], queryFn: publicApi.branches, staleTime: 5 * 60_000 });
  useEffect(() => setForm({ name: profile.name, preferredName: profile.preferredName || "", gender: profile.gender, dateOfBirth: profile.dateOfBirth || "", preferredBranchId: profile.preferredBranchId || "" }), [profile]);
  const mutation = useMutation({
    mutationFn: () => customerApi.updateProfile({ name: form.name.trim(), preferredName: form.preferredName.trim() || null, gender: form.gender, dateOfBirth: form.dateOfBirth || null, preferredBranchId: form.preferredBranchId || null }),
    onSuccess: (data) => queryClient.setQueryData(["customer", "profile"], data),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate(); };
  return <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-zinc-300">Full name<input required minLength={2} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white" /></label><label className="text-sm text-zinc-300">Preferred name<input value={form.preferredName} onChange={(event) => setForm((value) => ({ ...value, preferredName: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white" /></label><label className="text-sm text-zinc-300">Gender<select value={form.gender} onChange={(event) => setForm((value) => ({ ...value, gender: event.target.value as Customer["gender"] }))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white"><option value="unspecified">Not specified</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><label className="text-sm text-zinc-300">Date of birth<input type="date" value={form.dateOfBirth} onChange={(event) => setForm((value) => ({ ...value, dateOfBirth: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white" /></label><label className="text-sm text-zinc-300 sm:col-span-2">Preferred branch<select value={form.preferredBranchId} onChange={(event) => setForm((value) => ({ ...value, preferredBranchId: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white"><option value="">No preference</option>{branches.data?.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}</select></label></div><div className="rounded-xl border border-zinc-900 bg-black p-4 text-sm text-zinc-500"><p>Email: <span className="text-zinc-300">{profile.email || "Not set"}</span></p><p className="mt-1">Mobile: <span className="text-zinc-300">{profile.phone || "Not set"}</span></p><p className="mt-2 text-xs">Login identifiers are managed by your secure account and cannot be changed from the profile form.</p></div>{mutation.error && <p className="text-sm text-red-300">{apiErrorMessage(mutation.error)}</p>}{mutation.isSuccess && <p className="text-sm text-emerald-400">Profile saved.</p>}<button disabled={mutation.isPending} className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3 font-semibold text-black disabled:opacity-50">{mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}Save profile</button></form>;
}

export function AccountPage({ onLogin, onBook }: { onLogin: () => void; onBook: () => void }) {
  const { user, isBootstrapping } = useAuth();
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookingPage, setBookingPage] = useState(1);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const profile = useQuery({ queryKey: ["customer", "profile"], queryFn: customerApi.profile, enabled: Boolean(user) });
  const bookings = useQuery({ queryKey: ["customer", "bookings", bookingPage], queryFn: () => customerApi.bookings(bookingPage), enabled: Boolean(user) && tab === "bookings", placeholderData: (previous) => previous });
  const inquiries = useQuery({ queryKey: ["customer", "inquiries", inquiryPage], queryFn: () => customerApi.inquiries(inquiryPage), enabled: Boolean(user) && tab === "inquiries", placeholderData: (previous) => previous });
  const business = useQuery({ queryKey: ["public", "business"], queryFn: publicApi.business, staleTime: 5 * 60_000 });
  const timeZone = "Asia/Colombo";

  if (isBootstrapping) return <main className="min-h-[70vh] px-4 py-20"><LoadingBlock label="Restoring your session" /></main>;
  if (!user) return <main className="flex min-h-[70vh] items-center justify-center px-4 py-20"><div className="max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center"><LogIn className="mx-auto h-12 w-12 text-[#d4af37]" /><h1 className="mt-5 font-serif text-3xl text-white">Sign in to your account</h1><p className="mt-3 text-zinc-400">View appointments, consultation requests, and your salon profile.</p><button onClick={onLogin} className="mt-7 w-full rounded-xl bg-[#d4af37] py-3 font-semibold text-black">Sign in or register</button></div></main>;

  const branchName = (id?: string) => business.data?.branches.find((branch) => branch._id === id)?.name || "Salon branch";
  return <main className="min-h-[75vh] px-4 py-12 lg:px-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Customer account</p><h1 className="mt-2 font-serif text-4xl text-white">Hello, {profile.data?.preferredName || user.name}</h1></div><button onClick={onBook} className="rounded-xl bg-[#d4af37] px-5 py-3 font-semibold text-black">Book another visit</button></div><div className="mb-8 flex gap-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1">{([{ value: "bookings", label: "Appointments", icon: CalendarDays }, { value: "inquiries", label: "Consultations", icon: MessageSquareText }, { value: "profile", label: "Profile", icon: CircleUserRound }] as const).map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setTab(value)} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm ${tab === value ? "bg-[#d4af37] font-semibold text-black" : "text-zinc-400 hover:text-white"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>

  {tab === "bookings" && (bookings.isLoading ? <LoadingBlock label="Loading appointments" /> : bookings.isError ? <ErrorBlock error={bookings.error} onRetry={() => void bookings.refetch()} /> : !bookings.data?.data.length ? <EmptyState title="No appointments yet" message="When you make a booking, it will appear here." /> : <div className="space-y-4">{bookings.data.data.map((booking) => { const canCancel = ["requested", "pending_advance", "confirmed"].includes(booking.status); const amount = booking.pricingSnapshot.estimatedTotalMinor; return <article key={booking._id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-xl text-white">{booking.items[0]?.serviceSnapshot?.name || "Salon appointment"}</h2><StatusBadge status={booking.status} /></div><p className="mt-2 text-sm text-zinc-400">{formatDateTime(booking.startAt, timeZone)} · {branchName(booking.branchId)}</p><p className="mt-1 font-mono text-xs text-zinc-600">{booking.reference}</p></div><div className="text-left sm:text-right">{typeof amount === "number" && <p className="font-semibold text-[#d4af37]">{formatMoney(amount, booking.pricingSnapshot.currency || "LKR")}</p>}{booking.pricingSnapshot.advanceRequirement === "required" && <p className="mt-1 text-xs text-amber-300">Advance due: {formatMoney(booking.pricingSnapshot.advanceDueMinor || 0, booking.pricingSnapshot.currency || "LKR")}</p>}</div></div>{booking.customerNote && <p className="mt-4 rounded-lg bg-black px-3 py-2 text-sm text-zinc-500">{booking.customerNote}</p>}{canCancel && <button onClick={() => setCancelBooking(booking)} className="mt-4 rounded-lg border border-red-900 px-3 py-2 text-xs text-red-300 hover:bg-red-950/30">Cancel appointment</button>}</article>; })}<Pagination pagination={bookings.data.meta.pagination} onPage={setBookingPage} /></div>)}

  {tab === "inquiries" && (inquiries.isLoading ? <LoadingBlock label="Loading consultation requests" /> : inquiries.isError ? <ErrorBlock error={inquiries.error} onRetry={() => void inquiries.refetch()} /> : !inquiries.data?.data.length ? <EmptyState title="No consultation requests" message="Wedding, event, package, and quote requests will appear here." /> : <div className="space-y-4">{inquiries.data.data.map((inquiry) => <article key={inquiry._id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-xl capitalize text-white">{inquiry.type} consultation</h2><p className="mt-1 text-sm text-zinc-500">Requested {formatDateTime(inquiry.createdAt, timeZone)} · {branchName(inquiry.branchId)}</p></div><StatusBadge status={inquiry.status} /></div>{inquiry.customerNote && <p className="mt-4 text-sm text-zinc-400">{inquiry.customerNote}</p>}</article>)}<Pagination pagination={inquiries.data.meta.pagination} onPage={setInquiryPage} /></div>)}

  {tab === "profile" && (profile.isLoading ? <LoadingBlock label="Loading profile" /> : profile.isError ? <ErrorBlock error={profile.error} onRetry={() => void profile.refetch()} /> : profile.data ? <ProfileForm profile={profile.data} /> : null)}
  </div><CancelBookingDialog booking={cancelBooking} onClose={() => setCancelBooking(null)} /></main>;
}

function Pagination({ pagination, onPage }: { pagination: { page: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }; onPage: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return <div className="flex items-center justify-center gap-4 pt-5"><button disabled={!pagination.hasPreviousPage} onClick={() => onPage(pagination.page - 1)} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 disabled:opacity-30">Previous</button><span className="text-sm text-zinc-500">{pagination.page} / {pagination.totalPages}</span><button disabled={!pagination.hasNextPage} onClick={() => onPage(pagination.page + 1)} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 disabled:opacity-30">Next</button></div>;
}
