import Link from "next/link";
import { redirect } from "next/navigation";
import { ModerateButtons } from "@/components/moderate";
import { Badge, EmptyState } from "@/components/ui";
import { auth } from "@/auth";
import { listClaims } from "@/server/store";

export default async function AdminClaims({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login?callbackUrl=/admin/claims");
  if (role !== "ADMIN") redirect("/dashboard");
  const { status } = await searchParams;
  const items = await listClaims({ status });
  const tabs = [["", "Semua"], ["PENDING", "Menunggu"], ["REVIEWING", "Ditinjau"], ["APPROVED", "Disetujui"], ["REJECTED", "Ditolak"]];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Review Klaim Adopsi ({items.length})</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {tabs.map(([v, l]) => (
          <Link key={l} href={v ? `/admin/claims?status=${v}` : "/admin/claims"}
            className={"rounded-full px-3 py-1.5 font-semibold " + ((!status && !v) || status === v ? "bg-brand-600 text-white" : "bg-white ring-1 ring-brand-100")}>{l}</Link>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="Tidak ada klaim pada filter ini." /> : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{c.villageName} → {c.innovationTitle}</p><Badge status={c.status} />
              </div>
              <p className="text-sm text-gray-600">{c.message}</p>
              <p className="text-xs text-gray-400">Diajukan {new Date(c.submittedAt).toLocaleString("id-ID")}{c.notes ? ` · Catatan: ${c.notes}` : ""}</p>
              <ModerateButtons id={c.id} kind="claim" current={c.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
