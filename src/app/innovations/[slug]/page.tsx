import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimBox } from "@/components/claim-box";
import { Badge } from "@/components/ui";
import { auth } from "@/auth";
import { getInnovation } from "@/server/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getInnovation(slug);
  if (!item) return { title: "Inovasi tidak ditemukan" };
  return { title: item.title, description: item.shortDescription, openGraph: { title: item.title, description: item.shortDescription } };
}

export default async function InnovationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getInnovation(slug);
  if (!item || item.status !== "PUBLISHED") notFound();
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;

  const sections: [string, string][] = [
    ["Masalah", item.problem], ["Solusi", item.solution], ["Manfaat", item.benefits],
    ["Implementasi", item.implementation], ["Teknologi", item.technology],
    ["Kebutuhan", item.requirements], ["Estimasi Biaya", item.estimatedCost], ["Dampak", item.impact],
  ];
  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Beranda</Link> / <Link href="/innovations" className="hover:underline">Inovasi</Link> / <span className="text-gray-800">{item.title}</span>
      </nav>
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="space-y-5 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.categoryName}</span>
              <Badge status={item.status} />
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-brand-900">{item.title}</h1>
            <p className="mt-2 text-gray-600">{item.shortDescription}</p>
            <p className="mt-2 text-sm text-gray-500">oleh <Link href={`/innovators/${item.innovatorId}`} className="font-semibold text-brand-600 hover:underline">{item.innovatorName}</Link> ({item.innovatorOrg})</p>
          </div>
          <p className="whitespace-pre-line rounded-2xl bg-white p-5 text-[15px] leading-relaxed ring-1 ring-brand-100">{item.description}</p>
          <dl className="grid gap-3 md:grid-cols-2">
            {sections.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                <dt className="text-xs font-bold uppercase tracking-wide text-brand-600">{k}</dt>
                <dd className="mt-1 text-sm leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        </article>
        <aside className="space-y-4">
          <ClaimBox innovationId={item.id} loggedIn={!!session} role={role} claimCount={item.claimCount} />
          <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-brand-100">
            <p className="font-semibold">Detail</p>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>Kategori: {item.categoryName}</li>
              <li>Estimasi: {item.estimatedCost || "-"}</li>
              <li>Dipublish: {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("id-ID") : "-"}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
