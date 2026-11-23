"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { inputCls } from "./ui";

function FilterInner({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q); else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    }, 400);
    return () => clearTimeout(t);
  }, [q, pathname, router, params]);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v); else next.delete(k);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-brand-100 md:flex-row">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari inovasi, inovator, masalah desa…" className={inputCls} aria-label="Cari inovasi" />
      <select defaultValue={params.get("category") ?? ""} onChange={(e) => set("category", e.target.value)} className={inputCls + " md:max-w-64"} aria-label="Filter kategori">
        <option value="">Semua kategori</option>
        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <select defaultValue={params.get("sort") ?? "newest"} onChange={(e) => set("sort", e.target.value)} className={inputCls + " md:max-w-44"} aria-label="Urutkan">
        <option value="newest">Terbaru</option>
        <option value="oldest">Terlama</option>
        <option value="title">Judul A–Z</option>
      </select>
    </div>
  );
}

export function SearchFilter(props: { categories: { slug: string; name: string }[] }) {
  return <Suspense><FilterInner {...props} /></Suspense>;
}
