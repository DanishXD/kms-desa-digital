import Link from "next/link";
import { notFound } from "next/navigation";
import { InnovationCard } from "@/components/cards";
import { getInnovator } from "@/server/store";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const n = await getInnovator((await params).id);
  return { title: n?.name ?? "Inovator", description: n?.bio ?? undefined };
}

export default async function InnovatorDetail({ params }: { params: Promise<{ id: string }> }) {
  const n = await getInnovator((await params).id);
  if (!n) notFound();
  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500"><Link href="/innovators" className="hover:underline">Inovator</Link> / <span className="text-gray-800">{n.name}</span></nav>
      <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100">
        <div className="flex items-center gap-4">
          <p className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">{n.name.charAt(0)}</p>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-900">{n.name}</h1>
            <p className="text-sm text-gray-500">{n.organization} · {n.location}</p>
          </div>
        </div>
        {n.bio && <p className="mt-4 leading-relaxed">{n.bio}</p>}
        <p className="mt-2 text-sm font-semibold text-brand-600">{n.innovationCount} inovasi tayang</p>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-extrabold">Inovasi oleh {n.name}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {n.innovations.map((i) => <InnovationCard key={i.id} item={{ ...i, description: "", problem: "", solution: "", benefits: "", implementation: "", technology: "", requirements: "", estimatedCost: "", impact: "", status: "PUBLISHED", innovatorId: n.id, innovatorName: n.name, innovatorOrg: n.organization ?? "", categoryId: "", categorySlug: "", createdAt: "", updatedAt: "", claimCount: 0 }} />)}
        </div>
      </div>
    </div>
  );
}
