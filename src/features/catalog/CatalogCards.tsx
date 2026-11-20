import { ExternalLink, PackageOpen, Scissors, ShoppingBag } from "lucide-react";

import type { Product, Service, ServicePackage } from "../../api/types";
import { formatDuration, formatPrice } from "../../lib/format";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

const cardClass = "group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:-translate-y-1 hover:border-[#d4af37]/70";

export function ServiceCard({ service, onBook, onInquire }: { service: Service; onBook: (service: Service) => void; onInquire: (service: Service) => void }) {
  const price = service.branchService?.priceOverride || service.price;
  const duration = service.branchService?.durationOverride || service.duration;
  const canBook = service.bookingMode !== "consultation_required" && service.isOnlineBookable && (service.branchService?.isOnlineBookable ?? true);
  return (
    <article className={cardClass}>
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10"><Scissors className="h-7 w-7 text-[#d4af37]" /></div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3"><h3 className="font-serif text-xl text-white">{service.name}</h3><span className="whitespace-nowrap text-sm font-semibold text-[#d4af37]">{formatPrice(price)}</span></div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">{service.description || "A professionally delivered salon service."}</p>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-4"><span className="text-xs text-zinc-500">{formatDuration(duration)} · {service.targetClientGender === "all" ? "Everyone" : service.targetClientGender}</span><button onClick={() => canBook ? onBook(service) : onInquire(service)} className="rounded-lg bg-[#d4af37] px-3 py-2 text-xs font-semibold text-black hover:bg-[#b8962a]">{canBook ? "Book" : "Consult"}</button></div>
      </div>
    </article>
  );
}

export function ProductCard({ product, onInquire }: { product: Product; onInquire: (product: Product) => void }) {
  return (
    <article className={cardClass}>
      <div className="relative h-48 overflow-hidden bg-zinc-900">
        {product.imageUrls[0] ? <ImageWithFallback src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-12 w-12 text-[#d4af37]" /></div>}
      </div>
      <div className="p-5">
        {product.brand && <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">{product.brand}</p>}
        <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-xl text-white">{product.name}</h3><span className="whitespace-nowrap text-sm font-semibold text-[#d4af37]">{formatPrice(product.price)}</span></div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-zinc-400">{product.description || "Available from the salon."}</p>
        <div className="mt-4 border-t border-zinc-900 pt-4">
          {product.purchaseMode === "external_link" && product.externalPurchaseUrl ? <a href={product.externalPurchaseUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-[#d4af37]/50 py-2 text-sm text-[#d4af37] hover:bg-[#d4af37]/10">View product <ExternalLink className="h-4 w-4" /></a> : product.purchaseMode === "inquiry" ? <button onClick={() => onInquire(product)} className="w-full rounded-lg border border-[#d4af37]/50 py-2 text-sm text-[#d4af37] hover:bg-[#d4af37]/10">Ask about this item</button> : <p className="text-center text-xs text-zinc-500">Available for purchase at the salon</p>}
        </div>
      </div>
    </article>
  );
}

export function PackageCard({ servicePackage, onInquire }: { servicePackage: ServicePackage; onInquire: (servicePackage: ServicePackage) => void }) {
  return (
    <article className={cardClass}>
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#d4af37]/15 via-zinc-950 to-black"><PackageOpen className="h-14 w-14 text-[#d4af37]" /></div>
      <div className="p-5">
        <p className="mb-1 text-xs uppercase tracking-[0.18em] text-[#d4af37]">{servicePackage.kind}</p>
        <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-xl text-white">{servicePackage.name}</h3><span className="whitespace-nowrap text-sm font-semibold text-[#d4af37]">{formatPrice(servicePackage.price)}</span></div>
        <p className="mt-2 line-clamp-3 min-h-15 text-sm leading-5 text-zinc-400">{servicePackage.description || "A tailored package prepared for your occasion."}</p>
        <button onClick={() => onInquire(servicePackage)} className="mt-4 w-full rounded-lg bg-[#d4af37] py-2.5 text-sm font-semibold text-black hover:bg-[#b8962a]">Request a consultation</button>
      </div>
    </article>
  );
}
