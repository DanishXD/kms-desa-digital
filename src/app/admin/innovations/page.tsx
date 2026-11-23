import Link from "next/link";
import { redirect } from "next/navigation";
import { ModerateButtons } from "@/components/moderate";
import { Badge, EmptyState } from "@/components/ui";
import { auth } from "@/auth";
import { listInnovations } from "@/server/store";

export default async function AdminInnovations({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login?callbackUrl=/admin/innovations");
  if (role !== "ADMIN") redirect("/dashboard");
  const { status } = await searchParams;
  const { items, total } = await listInnovations({ status, perPage: 50 });
  const tabs = [["", "Semua"], ["SUBMITTED", "Diajukan"], ["UNDER_REVIEW", "Ditinjau"], ["APPROVED", "Disetujui"], ["PUBLISHED", "Tayang"], ["REJECTED", "Ditolak"]];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Moderasi Inovasi ({total})</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {tabs.map(([v, l]) => (
          <Link key={l} href={v ? `/admin/innovations?status=${v}` : "/admin/innovations"}
            className={"rounded-full px-3 py-1.5 font-semibold " + ((!status && !v) || status === v ? "bg-brand-600 text-white" : "bg-white ring-1 ring-brand-100")}>{l}</Link>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="Tidak ada inovasi pada filter ini." /> : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
              <div className="flex items-center justify-between gap-2">
                <div><p className="font-bold">{i.title}</p><p className="text-xs text-gray-500">{i.innovatorName} · {i.categoryName}</p></div>
                <Badge status={i.status} />
              </div>
              <p className="line-clamp-2 text-sm text-gray-600">{i.shortDescription}</p>
              <ModerateButtons id={i.id} kind="innovation" current={i.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
