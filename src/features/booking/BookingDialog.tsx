import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, LoaderCircle, Scissors, UserRound, X } from "lucide-react";

import { apiErrorMessage } from "../../api/client";
import { customerApi } from "../../api/customer";
import { publicApi } from "../../api/public";
import type { AvailabilitySlot, Booking, Service } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../components/AsyncState";
import { formatDateTime, formatDuration, formatPrice, formatTime, futureDate, localDateInput } from "../../lib/format";

interface SelectedSlot {
  employee: { id: string; name: string; title?: string; avatarUrl?: string };
  slot: AvailabilitySlot;
}

export function BookingDialog({ open, initialService, onClose, onLogin }: { open: boolean; initialService?: Service; onClose: () => void; onLogin: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(futureDate(1));
  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const [note, setNote] = useState("");
  const [acceptVariablePrice, setAcceptVariablePrice] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const business = useQuery({ queryKey: ["public", "business"], queryFn: publicApi.business, enabled: open, staleTime: 5 * 60_000 });
  const branches = business.data?.branches.filter((branch) => branch.bookingsEnabled) || [];
  const services = useQuery({
    queryKey: ["public", "services", "booking", branchId],
    queryFn: () => publicApi.services({ branchId, page: 1, limit: 100 }),
    enabled: open && Boolean(branchId),
    staleTime: 2 * 60_000,
  });
  const selectedService = useMemo(() => services.data?.data.find((service) => service._id === serviceId) || (initialService?._id === serviceId ? initialService : undefined), [services.data, serviceId, initialService]);
  const availability = useQuery({
    queryKey: ["public", "availability", branchId, serviceId, date],
    queryFn: () => publicApi.availability({ branchId, serviceId, date }),
    enabled: open && Boolean(branchId && serviceId && date),
    staleTime: 20_000,
    retry: 1,
  });

  useEffect(() => {
    if (!open || !business.data) return;
    const preferred = business.data.settings?.primaryBranchId;
    setBranchId((current) => current || branches.find((branch) => branch._id === preferred)?._id || branches[0]?._id || "");
  }, [open, business.data, branches]);

  useEffect(() => {
    if (!open) return;
    if (initialService) setServiceId(initialService._id);
  }, [open, initialService]);

  useEffect(() => {
    setSelected(null);
    idempotencyKey.current = crypto.randomUUID();
  }, [branchId, serviceId, date]);

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!selected || !selectedService) throw new Error("Choose an available time first.");
      const selectedPrice = selected.slot.price || selectedService.branchService?.priceOverride || selectedService.price;
      return customerApi.createBooking({
        branchId,
        items: [{ serviceId: selectedService._id, employeeId: selected.employee.id, startAt: selected.slot.startAt }],
        ...(selectedPrice.mode !== "fixed" ? { customerAcceptedVariablePricing: true as const } : {}),
        ...(note.trim() ? { customerNote: note.trim() } : {}),
      }, idempotencyKey.current);
    },
    onSuccess: (booking) => {
      setCreated(booking);
      void queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
      void availability.refetch();
    },
  });

  const price = selected?.slot.price || selectedService?.branchService?.priceOverride || selectedService?.price;
  const variablePrice = price?.mode !== "fixed";
  const maxDate = futureDate(business.data?.settings?.booking?.maximumAdvanceDays || 90);

  const dismiss = () => {
    setCreated(null);
    setSelected(null);
    setNote("");
    setAcceptVariablePrice(false);
    createBooking.reset();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={dismiss}>
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#0e0e0e] p-5 shadow-2xl sm:rounded-3xl sm:p-7" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">Live calendar</p><h2 id="booking-title" className="mt-1 font-serif text-2xl text-white">{created ? "Appointment reserved" : "Book an appointment"}</h2></div><button onClick={dismiss} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button></div>

        {created ? (
          <div className="py-8 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/10"><CheckCircle2 className="h-10 w-10 text-emerald-400" /></div><h3 className="mt-5 font-serif text-2xl text-white">Your booking is {created.status === "pending_advance" ? "being held" : "confirmed"}</h3><p className="mt-2 text-zinc-400">Reference <span className="font-mono text-[#d4af37]">{created.reference}</span></p><div className="mx-auto mt-6 max-w-md rounded-2xl border border-zinc-800 bg-black p-5 text-left text-sm"><p className="text-white">{created.items[0]?.serviceSnapshot?.name || selectedService?.name}</p><p className="mt-1 text-zinc-400">{formatDateTime(created.startAt, availability.data?.timeZone)}</p>{created.status === "pending_advance" && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-amber-300">An advance is required. Complete it before the hold expires from your account.</p>}</div><button onClick={dismiss} className="mt-7 rounded-xl bg-[#d4af37] px-8 py-3 font-semibold text-black">Done</button></div>
        ) : business.isLoading ? <LoadingBlock label="Loading booking options" /> : business.isError ? <ErrorBlock error={business.error} onRetry={() => void business.refetch()} /> : !branches.length ? <EmptyState title="Online booking is unavailable" message="No branch is currently accepting online appointments." /> : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm text-zinc-300">Branch<select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-white outline-none focus:border-[#d4af37]">{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}</select></label>
              <label className="text-sm text-zinc-300">Service<select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-white outline-none focus:border-[#d4af37]"><option value="">Choose a service</option>{services.data?.data.filter((service) => service.bookingMode !== "consultation_required").map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}</select></label>
              <label className="text-sm text-zinc-300">Date<input type="date" min={localDateInput()} max={maxDate} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white outline-none focus:border-[#d4af37]" /></label>
            </div>

            {selectedService && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-black p-4 text-sm"><Scissors className="h-5 w-5 text-[#d4af37]" /><span className="font-semibold text-white">{selectedService.name}</span><span className="text-zinc-500">{formatDuration(selectedService.branchService?.durationOverride || selectedService.duration)}</span><span className="ml-auto text-[#d4af37]">{formatPrice(selectedService.branchService?.priceOverride || selectedService.price)}</span></div>}

            {!serviceId ? <EmptyState title="Choose a service" message="Available stylists and times will appear here." /> : availability.isLoading || services.isLoading ? <LoadingBlock label="Checking live availability" /> : availability.isError ? <ErrorBlock error={availability.error} onRetry={() => void availability.refetch()} /> : availability.data?.totalSlots ? (
              <div className="space-y-5"><div><h3 className="font-semibold text-white">Available times</h3><p className="text-xs text-zinc-500">Times are shown for {availability.data.timeZone}.</p></div>{availability.data.employees.filter((entry) => entry.slots.length).map(({ employee, slots }) => <section key={employee.id} className="rounded-2xl border border-zinc-800 bg-black p-4"><div className="mb-4 flex items-center gap-3">{employee.avatarUrl ? <img src={employee.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d4af37]/10"><UserRound className="h-5 w-5 text-[#d4af37]" /></div>}<div><h4 className="font-semibold text-white">{employee.name}</h4><p className="text-xs text-zinc-500">{employee.title || "Salon professional"}</p></div></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{slots.map((slot) => { const active = selected?.employee.id === employee.id && selected.slot.startAt === slot.startAt; return <button key={slot.startAt} onClick={() => { setSelected({ employee, slot }); idempotencyKey.current = crypto.randomUUID(); }} className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${active ? "border-[#d4af37] bg-[#d4af37] text-black" : "border-emerald-900/70 bg-emerald-950/20 text-emerald-300 hover:border-emerald-600"}`}>{formatTime(slot.startAt, availability.data.timeZone)}</button>; })}</div></section>)}</div>
            ) : <EmptyState title="No times on this date" message="Choose another date to see the next available appointments." />}

            {selected && <div className="space-y-4 rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="font-semibold text-white">{selected.employee.name}</p><p className="text-sm text-zinc-400">{formatDateTime(selected.slot.startAt, availability.data?.timeZone)}</p></div><p className="font-semibold text-[#d4af37]">{formatPrice(selected.slot.price)}</p></div><label className="block text-sm text-zinc-300">Note for the salon<textarea maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="mt-1.5 w-full resize-none rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#d4af37]" placeholder="Optional requests or information" /></label>{variablePrice && <label className="flex items-start gap-3 text-sm text-zinc-300"><input type="checkbox" checked={acceptVariablePrice} onChange={(event) => setAcceptVariablePrice(event.target.checked)} className="mt-1 accent-[#d4af37]" /><span>I understand the shown price is an estimate or starting price, and the final price may be confirmed after consultation/service.</span></label>}{createBooking.error && <p className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300">{apiErrorMessage(createBooking.error)}</p>}{user ? <button disabled={createBooking.isPending || (variablePrice && !acceptVariablePrice)} onClick={() => createBooking.mutate()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">{createBooking.isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}Confirm appointment</button> : <button onClick={onLogin} className="w-full rounded-xl bg-[#d4af37] py-3 font-semibold text-black">Sign in to confirm</button>}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
