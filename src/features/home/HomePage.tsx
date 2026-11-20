import { useQuery } from "@tanstack/react-query";
import { Award, CalendarCheck, CheckCircle2, Clock, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { publicApi } from "../../api/public";
import type { Product, Service, ServicePackage } from "../../api/types";
import salonLogo from "../../app/images/salon_logo.webp";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../components/AsyncState";
import { formatAddress } from "../../lib/format";
import { ServiceCard } from "../catalog/CatalogCards";

interface HomePageProps {
  onBook: (service?: Service) => void;
  onInquire: (item: Service | Product | ServicePackage) => void;
}

export function HomePage({ onBook, onInquire }: HomePageProps) {
  const business = useQuery({ queryKey: ["public", "business"], queryFn: publicApi.business, staleTime: 5 * 60_000 });
  const services = useQuery({ queryKey: ["public", "services", "featured"], queryFn: () => publicApi.services({ page: 1, limit: 8 }), staleTime: 2 * 60_000 });

  const overview = business.data;
  const primaryBranch = overview?.branches.find((branch) => branch.isPrimary) || overview?.branches[0];
  const businessName = overview?.profile.name || "Salon Lotus Infinity";

  return (
    <main>
      <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-4 py-20 text-center">
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" /><div className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-[#d4af37]/5 blur-3xl" /></div>
        <div className="relative z-10 mx-auto max-w-4xl">
          <img src={overview?.profile.logoUrl || salonLogo} alt={`${businessName} logo`} className="mx-auto h-48 w-48 object-contain md:h-64 md:w-64" />
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.35em] text-[#d4af37]">Hair · Nails · Beauty</p>
          <h1 className="mt-5 font-serif text-4xl text-white md:text-6xl">{businessName}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">{overview?.profile.legalName ? "Personal care, thoughtful service, and effortless online booking." : "Experience premium salon care, tailored to you."}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => onBook()} className="rounded-xl bg-[#d4af37] px-9 py-4 font-semibold text-black transition hover:bg-[#b8962a]">Book an appointment</button><Link to="/catalog" className="rounded-xl border border-zinc-700 px-9 py-4 font-semibold text-white transition hover:border-[#d4af37]">Explore everything</Link></div>
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-zinc-950/70 px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[{ icon: Award, title: "Professional care", text: "Services from trained salon professionals" }, { icon: CalendarCheck, title: "Live availability", text: "Times shown directly from our booking calendar" }, { icon: ShieldCheck, title: "Secure booking", text: "Your account and appointments stay protected" }, { icon: Sparkles, title: "Made for you", text: "Choose the service and stylist that fit you" }].map(({ icon: Icon, title, text }) => <div key={title} className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]"><Icon className="h-5 w-5 text-black" /></div><h2 className="mt-4 text-lg font-semibold text-white">{title}</h2><p className="mt-2 text-sm text-zinc-500">{text}</p></div>)}
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">Book online</p><h2 className="mt-2 font-serif text-4xl text-white">Popular services</h2></div><Link to="/catalog" className="text-sm text-[#d4af37] hover:text-[#ead277]">View services, products & packages →</Link></div>
          {services.isLoading ? <LoadingBlock label="Loading services" /> : services.isError ? <ErrorBlock error={services.error} onRetry={() => void services.refetch()} /> : services.data?.data.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{services.data.data.map((service) => <ServiceCard key={service._id} service={service} onBook={onBook} onInquire={onInquire} />)}</div> : <EmptyState title="Services are being prepared" message="Please check back soon or contact the salon." />}
        </div>
      </section>

      <section className="border-t border-zinc-900 bg-zinc-950 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">Visit us</p><h2 className="mt-2 font-serif text-4xl text-white">Salon information</h2></div>
          {business.isLoading ? <LoadingBlock label="Loading salon details" /> : business.isError ? <ErrorBlock error={business.error} onRetry={() => void business.refetch()} /> : primaryBranch ? <div className="grid gap-5 md:grid-cols-3">{[{ icon: MapPin, label: primaryBranch.name, value: formatAddress(primaryBranch.address) || "Contact us for directions" }, { icon: Phone, label: "Call us", value: primaryBranch.phone || overview?.profile.phone || "Phone number unavailable" }, { icon: Clock, label: "Opening times", value: "Live availability is shown while booking" }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-zinc-800 bg-black p-6"><Icon className="h-6 w-6 text-[#d4af37]" /><h3 className="mt-4 font-semibold text-white">{label}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{value}</p></div>)}</div> : <EmptyState title="Salon details unavailable" message="The business setup has not been published yet." />}
        </div>
      </section>
      <section className="px-4 py-20 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-[#d4af37]" /><h2 className="mt-5 font-serif text-3xl text-white">Ready for your next appointment?</h2><p className="mt-3 text-zinc-400">Browse without an account. Sign in only when you are ready to reserve your time.</p><button onClick={() => onBook()} className="mt-7 rounded-xl bg-[#d4af37] px-9 py-3.5 font-semibold text-black hover:bg-[#b8962a]">Find a time</button></section>
    </main>
  );
}
