import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, MessageCircle, X } from "lucide-react";

import { apiErrorMessage } from "../../api/client";
import { customerApi } from "../../api/customer";
import { publicApi } from "../../api/public";
import type { Product, Service, ServicePackage } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { futureDate, localDateInput } from "../../lib/format";

type InquiryItem = Service | Product | ServicePackage;

const itemKind = (item: InquiryItem): "service" | "product" | "package" => {
  if ("kind" in item) return "package";
  if ("purchaseMode" in item) return "product";
  return "service";
};

export function InquiryDialog({ item, onClose, onLogin }: { item: InquiryItem | null; onClose: () => void; onLogin: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["public", "business"], queryFn: publicApi.business, enabled: Boolean(item), staleTime: 5 * 60_000 });
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState(futureDate(7));
  const [dateTo, setDateTo] = useState(futureDate(14));
  const [partySize, setPartySize] = useState(1);
  const [offsite, setOffsite] = useState(false);
  const [venueAddress, setVenueAddress] = useState("");
  const [note, setNote] = useState("");
  const [complete, setComplete] = useState(false);
  const branches = business.data?.branches.filter((branch) => branch.bookingsEnabled) || [];

  useEffect(() => {
    if (!business.data) return;
    setBranchId((current) => current || business.data.settings?.primaryBranchId || branches[0]?._id || "");
  }, [business.data, branches]);

  const kind = useMemo(() => item ? itemKind(item) : "service", [item]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("Choose something to inquire about.");
      const type = kind === "package" && "kind" in item && item.kind !== "bundle" ? item.kind : kind;
      return customerApi.createInquiry({
        branchId: branchId || undefined,
        type,
        ...(kind === "service" ? { serviceIds: [item._id] } : {}),
        ...(kind === "product" ? { productIds: [item._id] } : {}),
        ...(kind === "package" ? { packageId: item._id } : {}),
        preferredDateFrom: dateFrom,
        preferredDateTo: dateTo,
        partySize,
        offsite,
        ...(offsite ? { venueAddress: venueAddress.trim() } : {}),
        ...(note.trim() ? { customerNote: note.trim() } : {}),
      });
    },
    onSuccess: () => {
      setComplete(true);
      void queryClient.invalidateQueries({ queryKey: ["customer", "inquiries"] });
    },
  });

  const dismiss = () => {
    setComplete(false);
    setNote("");
    mutation.reset();
    onClose();
  };

  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={dismiss}>
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#0e0e0e] p-6 sm:rounded-3xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Consultation request</p><h2 className="mt-1 font-serif text-2xl text-white">{item.name}</h2></div><button onClick={dismiss} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white"><X className="h-5 w-5" /></button></div>
        {complete ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" /><h3 className="mt-5 font-serif text-2xl text-white">Request received</h3><p className="mt-2 text-sm text-zinc-400">The salon team can now review your request and prepare a quote.</p><button onClick={dismiss} className="mt-7 rounded-xl bg-[#d4af37] px-8 py-3 font-semibold text-black">Done</button></div> : <div className="mt-6 space-y-4"><label className="block text-sm text-zinc-300">Preferred branch<select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-white">{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm text-zinc-300">From<input type="date" min={localDateInput()} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white" /></label><label className="text-sm text-zinc-300">To<input type="date" min={dateFrom} value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white" /></label></div><label className="block text-sm text-zinc-300">Party size<input type="number" min={1} max={500} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-white" /></label>{"allowsOffsite" in item && item.allowsOffsite && <label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={offsite} onChange={(event) => setOffsite(event.target.checked)} className="accent-[#d4af37]" />This event is off-site</label>}{offsite && <label className="block text-sm text-zinc-300">Venue address<textarea required value={venueAddress} onChange={(event) => setVenueAddress(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-black p-3 text-white" /></label>}<label className="block text-sm text-zinc-300">Tell us what you need<textarea maxLength={5000} rows={4} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1.5 w-full resize-none rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#d4af37]" /></label>{mutation.error && <p className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300">{apiErrorMessage(mutation.error)}</p>}{user ? <button disabled={mutation.isPending || !branchId || dateTo < dateFrom || (offsite && !venueAddress.trim())} onClick={() => mutation.mutate()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-3 font-semibold text-black disabled:opacity-50">{mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}Send request</button> : <button onClick={onLogin} className="w-full rounded-xl bg-[#d4af37] py-3 font-semibold text-black">Sign in to send request</button>}</div>}
      </div>
    </div>
  );
}
