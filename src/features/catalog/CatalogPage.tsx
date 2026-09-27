import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { publicApi } from "../../api/public";
import type { Product, Service, ServicePackage } from "../../api/types";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../components/AsyncState";
import { PackageCard, ProductCard, ServiceCard } from "./CatalogCards";

type Tab = "services" | "products" | "packages";

export function CatalogPage({ onBook, onInquire }: { onBook: (service: Service) => void; onInquire: (item: Service | Product | ServicePackage) => void }) {
  const [tab, setTab] = useState<Tab>("services");
  const [branchId, setBranchId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const business = useQuery({ queryKey: ["public", "business"], queryFn: publicApi.business, staleTime: 5 * 60_000 });
  const categories = useQuery({ queryKey: ["public", "categories"], queryFn: publicApi.categories, staleTime: 5 * 60_000 });
  const query = { page, limit: 12, branchId: branchId || undefined, categoryId: categoryId || undefined, search: search || undefined };
  const services = useQuery({ queryKey: ["public", "services", query], queryFn: () => publicApi.services(query), enabled: tab === "services", placeholderData: (previous) => previous });
  const products = useQuery({ queryKey: ["public", "products", query], queryFn: () => publicApi.products(query), enabled: tab === "products", placeholderData: (previous) => previous });
  const packages = useQuery({ queryKey: ["public", "packages", query], queryFn: () => publicApi.packages(query), enabled: tab === "packages", placeholderData: (previous) => previous });
  const activeQuery = tab === "services" ? services : tab === "products" ? products : packages;
  const branches = business.data?.branches.filter((branch) => branch.isActive) || [];
  const visibleCategories = categories.data?.filter((category) => category.appliesTo.includes(tab.slice(0, -1) as "service" | "product" | "package")) || [];

  useEffect(() => {
    if (!business.data) return;
    setBranchId((current) => current || business.data.settings?.primaryBranchId || branches[0]?._id || "");
  }, [business.data, branches]);

  useEffect(() => {
    setPage(1);
    setCategoryId("");
  }, [tab]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const pagination = activeQuery.data?.meta.pagination;
  return (
    <main className="min-h-[75vh] px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">Discover</p><h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">Services, products & occasions</h1><p className="mx-auto mt-3 max-w-2xl text-zinc-400">Browse everything without signing in. You only need an account when booking or sending a consultation request.</p></div>

        <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 lg:flex-row lg:items-center">
          <div className="flex rounded-xl bg-black p-1">{(["services", "products", "packages"] as Tab[]).map((value) => <button key={value} onClick={() => setTab(value)} className={`flex-1 rounded-lg px-4 py-2 text-sm capitalize transition lg:flex-none ${tab === value ? "bg-[#d4af37] font-semibold text-black" : "text-zinc-400 hover:text-white"}`}>{value}</button>)}</div>
          <select value={branchId} onChange={(event) => { setBranchId(event.target.value); setPage(1); }} className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"><option value="">All branches</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}</select>
          <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"><option value="">All categories</option>{visibleCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
          <form onSubmit={submitSearch} className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-600" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={`Search ${tab}`} className="w-full rounded-xl border border-zinc-800 bg-black py-2.5 pl-10 pr-24 text-sm text-white outline-none focus:border-[#d4af37]" /><button className="absolute right-1.5 top-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200">Search</button></form>
        </div>

        {activeQuery.isLoading ? <LoadingBlock label={`Loading ${tab}`} /> : activeQuery.isError ? <ErrorBlock error={activeQuery.error} onRetry={() => void activeQuery.refetch()} /> : !activeQuery.data?.data.length ? <EmptyState title={`No ${tab} found`} message="Try another branch, category, or search term." /> : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tab === "services" && services.data?.data.map((service) => <ServiceCard key={service._id} service={service} onBook={onBook} onInquire={onInquire} />)}
              {tab === "products" && products.data?.data.map((product) => <ProductCard key={product._id} product={product} onInquire={onInquire} />)}
              {tab === "packages" && packages.data?.data.map((servicePackage) => <PackageCard key={servicePackage._id} servicePackage={servicePackage} onInquire={onInquire} />)}
            </div>
            {pagination && pagination.totalPages > 1 && <div className="mt-10 flex items-center justify-center gap-4"><button disabled={!pagination.hasPreviousPage} onClick={() => setPage((value) => value - 1)} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 disabled:opacity-30">Previous</button><span className="text-sm text-zinc-500">Page {pagination.page} of {pagination.totalPages}</span><button disabled={!pagination.hasNextPage} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 disabled:opacity-30">Next</button></div>}
          </>
        )}
      </div>
    </main>
  );
}
