import { VillageCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { listVillages } from "@/server/store";

export const metadata = { title: "Desa Digital" };

export default async function VillagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const villages = await listVillages(q);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Desa Digital</h1>
        <p className="text-sm text-gray-500">{villages.length} desa terdaftar</p>
      </div>
      <form className="flex gap-2" action="/villages" method="get">
        <input name="q" defaultValue={q ?? ""} placeholder="Cari desa / kabupaten…" className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" aria-label="Cari desa" />
        <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Cari</button>
      </form>
      {villages.length === 0 ? <EmptyState title="Desa tidak ditemukan." /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {villages.map((v) => <VillageCard key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}
