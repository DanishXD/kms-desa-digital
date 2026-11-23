import Link from "next/link";
import { InnovationCard } from "@/components/cards";
import { SearchFilter } from "@/components/search-filter";
import { EmptyState } from "@/components/ui";
import { listCategories, listInnovations } from "@/server/store";

export const metadata = { title: "Katalog Inovasi" };

export default async function InnovationsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }> }) {
  const sp = await searchParams;
  const categories = await listCategories();
  const { items, total, page, totalPages } = await listInnovations({
    q: sp.q, category: sp.category, sort: sp.sort, page: Number(sp.page ?? 1), publishedOnly: true,
  });
  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (sp.q) s.set("q", sp.q);
    if (sp.category) s.set("category", sp.category);
    if (sp.sort) s.set("sort", sp.sort);
    s.set("page", String(p));
    return `/innovations?${s.toString()}`;
  };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Katalog Inovasi</h1>
        <p className="text-sm text-gray-500">{total} inovasi tayang · terverifikasi admin</p>
      </div>
      <SearchFilter categories={categories} />
      {items.length === 0 ? (
        <EmptyState title="Belum ada inovasi ditemukan." hint="Coba kata kunci atau kategori lain." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => <InnovationCard key={i.id} item={i} />)}
          </div>
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
              {page > 1 && <Link href={qs(page - 1)} className="rounded-lg border px-3 py-1.5 hover:bg-white">← Sebelumnya</Link>}
              <span>Halaman {page} / {totalPages}</span>
              {page < totalPages && <Link href={qs(page + 1)} className="rounded-lg border px-3 py-1.5 hover:bg-white">Berikutnya →</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
