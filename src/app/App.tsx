import { lazy, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { publicApi } from "../api/public";
import type { Product, Service, ServicePackage } from "../api/types";
import { SiteHeader } from "../components/SiteHeader";
import { HomePage } from "../features/home/HomePage";

const AuthDialog = lazy(() => import("../auth/AuthDialog").then((module) => ({ default: module.AuthDialog })));
const AccountPage = lazy(() => import("../features/account/AccountPage").then((module) => ({ default: module.AccountPage })));
const BookingDialog = lazy(() => import("../features/booking/BookingDialog").then((module) => ({ default: module.BookingDialog })));
const CatalogPage = lazy(() => import("../features/catalog/CatalogPage").then((module) => ({ default: module.CatalogPage })));
const InquiryDialog = lazy(() => import("../features/inquiries/InquiryDialog").then((module) => ({ default: module.InquiryDialog })));

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<Service | undefined>();
  const [inquiryItem, setInquiryItem] = useState<Service | Product | ServicePackage | null>(null);
  const business = useQuery({ queryKey: ["public", "business"], queryFn: publicApi.business, staleTime: 5 * 60_000 });

  const openBooking = (service?: Service) => {
    setBookingService(service);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader onLogin={() => setAuthOpen(true)} onBook={() => openBooking()} />
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-500">Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage onBook={openBooking} onInquire={setInquiryItem} />} />
          <Route path="/catalog" element={<CatalogPage onBook={openBooking} onInquire={setInquiryItem} />} />
          <Route path="/account" element={<AccountPage onLogin={() => setAuthOpen(true)} onBook={() => openBooking()} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <footer className="border-t border-zinc-900 px-4 py-10 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-[#d4af37]" />
        <p className="mt-3 font-serif text-lg text-white">{business.data?.profile.name || "Salon Lotus Infinity"}</p>
        <p className="mt-1 text-sm text-zinc-600">Online discovery and appointments</p>
        <p className="mt-5 text-xs text-zinc-700">© {new Date().getFullYear()} {business.data?.profile.name || "Salon Lotus Infinity"}. All rights reserved.</p>
      </footer>

      <Suspense fallback={null}>
        {bookingOpen && <BookingDialog open initialService={bookingService} onClose={() => { setBookingOpen(false); setBookingService(undefined); }} onLogin={() => setAuthOpen(true)} />}
        {inquiryItem && <InquiryDialog item={inquiryItem} onClose={() => setInquiryItem(null)} onLogin={() => setAuthOpen(true)} />}
        {authOpen && <AuthDialog open onClose={() => setAuthOpen(false)} />}
      </Suspense>
    </div>
  );
}
