import Link from "next/link";
import { InnovationCard, InnovatorCard, VillageCard } from "@/components/cards";
import { CategoryIcon, IconChart, IconCheck, IconSearch, IconSprout } from "@/components/icons";
import { SearchFilter } from "@/components/search-filter";
import { SectionTitle } from "@/components/ui";
import { listCategories, listInnovations, listInnovators, listVillages } from "@/server/store";

const STEPS = [
  { icon: IconSearch, title: "Jelajahi", desc: "Cari inovasi terverifikasi sesuai kebutuhan desamu." },
  { icon: IconCheck, title: "Adopsi", desc: "Ajukan adopsi, admin meninjau dalam hitungan hari." },
  { icon: IconChart, title: "Ukur", desc: "Nilai kesiapan digital dan pantau dampaknya." },
];

export default async function Home() {
  const [featured, categories, villages, innovators] = await Promise.all([
    listInnovations({ publishedOnly: true, perPage: 6 }),
    listCategories(),
    listVillages(),
    listInnovators(),
  ]);
  const stats: [string, string][] = [
    [String(featured.total), "Inovasi tayang"],
    [String(villages.length), "Desa terdaftar"],
    [String(innovators.length), "Inovator aktif"],
    [String(categories.length), "Kategori fokus"],
  ];
  return (
    <div className="space-y-12">
      <section className="hero relative overflow-hidden rounded-3xl bg-brand-800 px-6 py-12 text-white md:px-12 md:py-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
          <svg className="absolute right-6 top-6 hidden h-56 w-56 text-white/10 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-100 ring-1 ring-white/20">
            <IconSprout className="h-4 w-4" /> Knowledge Management System
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.15] tracking-tight md:text-5xl">Solusi Inovasi untuk <span className="text-accent-400">Desa Digital</span> Indonesia</h1>
          <p className="mt-3 max-w-xl text-brand-50">Jelajahi inovasi terverifikasi, adopsi untuk desamu, dan ukur kesiapan digital — semua dalam satu platform.</p>
          <form action="/innovations" method="get" className="mt-6 flex max-w-xl gap-2 rounded-2xl bg-white p-2 shadow-lg">
            <IconSearch className="ml-2 h-5 w-5 self-center text-gray-400" />
            <input name="q" placeholder="Cari inovasi: irigasi, surat desa, kas…" className="w-full bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400" aria-label="Cari inovasi" />
            <button className="shrink-0 rounded-xl bg-accent-400 px-5 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-500">Cari</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {categories.slice(0, 5).map((c) => (
              <Link key={c.slug} href={`/innovations?category=${c.slug}`} className="rounded-full bg-white/10 px-3 py-1.5 font-medium ring-1 ring-white/15 hover:bg-white/20">{c.name}</Link>
            ))}
          </div>
          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 border-t border-white/15 pt-6 sm:grid-cols-4">
            {stats.map(([v, l]) => (
              <div key={l}>
                <dt className="order-2 mt-1 text-xs text-brand-100">{l}</dt>
                <dd className="order-1 text-2xl font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
            <p className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><s.icon className="h-5 w-5" /></p>
            <div>
              <p className="text-xs font-bold text-brand-500">LANGKAH {i + 1}</p>
              <p className="font-bold">{s.title}</p>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle title="Inovasi Unggulan" desc="Terbaru dan sudah terverifikasi admin" href="/innovations" />
        <SearchFilter categories={categories} />
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.items.map((i) => <InnovationCard key={i.id} item={i} />)}
        </div>
      </section>

      <section>
        <SectionTitle title="Kategori Inovasi" desc="10 bidang fokus desa digital" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.slug} href={`/innovations?category=${c.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center text-sm font-semibold ring-1 ring-brand-100 hover:bg-brand-50 hover:ring-brand-200">
              <CategoryIcon slug={c.slug} className="h-6 w-6 text-brand-500 group-hover:text-brand-700" />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Desa Digital" desc="Profil dan daya adopsi desa" href="/villages" />
        <div className="grid gap-4 md:grid-cols-3">
          {villages.slice(0, 3).map((v) => <VillageCard key={v.id} v={v} />)}
        </div>
      </section>

      <section>
        <SectionTitle title="Inovator" desc="Para pengembang di balik inovasi" href="/innovators" />
        <div className="grid gap-4 md:grid-cols-3">
          {innovators.slice(0, 3).map((n) => <InnovatorCard key={n.id} n={n} />)}
        </div>
      </section>

      <section className="rounded-3xl bg-brand-900 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-extrabold">Seberapa siap desamu go-digital?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-brand-100">Ikuti assessment 7 pertanyaan — dapatkan skor, level, dan rekomendasi prioritas dalam 3 menit.</p>
        <Link href="/assessment" className="mt-5 inline-block rounded-xl bg-accent-400 px-6 py-3 text-sm font-bold text-brand-900 hover:bg-accent-500">Mulai Assessment Gratis</Link>
      </section>
    </div>
  );
}
