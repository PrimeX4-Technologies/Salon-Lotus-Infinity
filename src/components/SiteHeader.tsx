import { useState } from "react";
import { CalendarDays, LogIn, LogOut, Menu, Sparkles, UserRound, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import salonLogo from "../app/images/salon_logo.webp";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition ${isActive ? "text-[#d4af37]" : "text-zinc-300 hover:text-white"}`;

export function SiteHeader({ onLogin, onBook }: { onLogin: () => void; onBook: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isBootstrapping } = useAuth();

  const close = () => setMobileOpen(false);
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={close}>
          <img src={salonLogo} alt="Salon logo" className="h-14 w-14 object-contain" />
          <span className="hidden font-serif text-lg text-white sm:block">Salon Lotus Infinity</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <NavLink to="/" className={navClass}>Home</NavLink>
          <NavLink to="/catalog" className={navClass}>Services & products</NavLink>
          {user && <NavLink to="/account" className={navClass}>My appointments</NavLink>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={onBook} className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#b8962a]"><CalendarDays className="h-4 w-4" />Book now</button>
          {!isBootstrapping && (user ? (
            <div className="group relative">
              <Link to="/account" className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-200"><UserRound className="h-4 w-4 text-[#d4af37]" /><span className="max-w-28 truncate">{user.name}</span></Link>
              <button onClick={() => void logout()} className="invisible absolute right-0 top-full mt-2 flex w-36 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100"><LogOut className="h-4 w-4" />Sign out</button>
            </div>
          ) : (
            <button onClick={onLogin} className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 hover:border-[#d4af37]"><LogIn className="h-4 w-4" />Sign in</button>
          ))}
        </div>
        <button className="rounded-lg p-2 text-zinc-300 md:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileOpen && (
        <div className="border-t border-zinc-900 bg-black px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
            <NavLink to="/" className={navClass} onClick={close}>Home</NavLink>
            <NavLink to="/catalog" className={navClass} onClick={close}>Services & products</NavLink>
            {user && <NavLink to="/account" className={navClass} onClick={close}>My appointments</NavLink>}
            <button onClick={() => { close(); onBook(); }} className="flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-3 font-semibold text-black"><Sparkles className="h-4 w-4" />Book now</button>
            {!isBootstrapping && (user ? <button onClick={() => void logout()} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 py-3 text-zinc-300"><LogOut className="h-4 w-4" />Sign out</button> : <button onClick={() => { close(); onLogin(); }} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 py-3 text-zinc-300"><LogIn className="h-4 w-4" />Sign in</button>)}
          </nav>
        </div>
      )}
    </header>
  );
}
