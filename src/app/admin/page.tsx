import Link from "next/link";
import { redirect } from "next/navigation";
import { Charts } from "@/components/charts";
import { Badge, SectionTitle, Stat } from "@/components/ui";
import { auth } from "@/auth";
import { analytics, dashboardStats, listClaims, listInnovations, recentActivity } from "@/server/store";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (role !== "ADMIN") redirect("/dashboard");
  const [stats, charts, activity, subs, claims] = await Promise.all([
    dashboardStats(), analytics(), recentActivity(),
    listInnovations({ perPage: 5 }), listClaims({}),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold text-brand-900">Admin Dashboard</h1><p className="text-sm text-gray-500">Moderasi, analitik, dan laporan.</p></div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/innovations" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Moderasi Inovasi</Link>
          <Link href="/admin/claims" className="rounded-xl border px-4 py-2 font-semibold">Klaim ({stats.pendingClaims})</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Desa" value={stats.villages} />
        <Stat label="Inovator" value={stats.innovators} />
        <Stat label="Inovasi" value={stats.innovations} />
        <Stat label="Tayang" value={stats.published} />
        <Stat label="Antre review" value={stats.pendingSub} href="/admin/innovations" />
        <Stat label="Klaim aktif" value={stats.pendingClaims} href="/admin/claims" />
      </div>
      <Charts byCategory={charts.byCategory} byStatus={charts.byStatus} claims={charts.claims} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
          <SectionTitle title="Submission Terbaru" href="/admin/innovations" linkLabel="Moderasi →" />
          <ul className="space-y-2 text-sm">
            {subs.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="truncate">{i.title}</span><Badge status={i.status} />
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
          <SectionTitle title="Klaim Terbaru" href="/admin/claims" linkLabel="Review →" />
          <ul className="space-y-2 text-sm">
            {claims.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="truncate">{c.villageName} → {c.innovationTitle}</span><Badge status={c.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {activity.length > 0 && (
        <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-brand-100">
          <SectionTitle title="Audit Log" desc="Aktivitas penting tercatat otomatis" />
          <ul className="space-y-1 text-gray-600">
            {activity.map((a) => <li key={a.id}>• {a.action} {a.entity} <span className="text-gray-400">({new Date(a.createdAt).toLocaleString("id-ID")})</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
