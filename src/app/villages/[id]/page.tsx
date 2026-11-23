import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { getVillage } from "@/server/store";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const v = await getVillage((await params).id);
  return { title: v?.name ?? "Desa", description: v?.description ?? undefined };
}

export default async function VillageDetail({ params }: { params: Promise<{ id: string }> }) {
  const v = await getVillage((await params).id);
  if (!v) notFound();
  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500"><Link href="/villages" className="hover:underline">Desa</Link> / <span className="text-gray-800">{v.name}</span></nav>
      <div>
        <h1 className="text-3xl font-extrabold text-brand-900">{v.name}</h1>
        <p className="text-gray-500">{v.district}, {v.regency}, {v.province} · {v.population?.toLocaleString("id-ID")} jiwa</p>
        <p className="mt-1 text-sm">Kesiapan digital: <Badge status={v.digitalReadiness ?? "LOW"} /></p>
      </div>
      {v.description && <p className="rounded-2xl bg-white p-5 leading-relaxed ring-1 ring-brand-100">{v.description}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
          <p className="font-bold">Potensi</p>
          <div className="mt-2 flex flex-wrap gap-2">{(v.potential as string[]).map((x) => <span key={x} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{x}</span>)}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
          <p className="font-bold">Infrastruktur</p>
          <div className="mt-2 flex flex-wrap gap-2">{(v.infrastructure as string[]).map((x) => <span key={x} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{x}</span>)}</div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
        <p className="font-bold">Riwayat Adopsi Inovasi ({v.claims.length})</p>
        {v.claims.length === 0 ? <p className="mt-2 text-sm text-gray-500">Belum ada pengajuan adopsi.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {v.claims.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <span>{c.innovationTitle}</span><Badge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
