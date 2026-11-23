import { redirect } from "next/navigation";
import { DeleteClaimButton } from "@/components/actions";
import { Badge, EmptyState } from "@/components/ui";
import { auth } from "@/auth";
import { listClaims } from "@/server/store";
import type { SessionUser } from "@/server/store";

export default async function MyClaimsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/claims");
  const user = session.user as unknown as SessionUser;
  if (user.role !== "VILLAGE") redirect("/dashboard");
  const claims = await listClaims({ villageId: user.villageId });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Pengajuan Adopsi Saya</h1>
      <p className="text-sm text-gray-500">Alur: Menunggu → Ditinjau → Disetujui/Ditolak</p>
      {claims.length === 0 ? <EmptyState title="Belum ada pengajuan." /> : (
        <ul className="space-y-3">
          {claims.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{c.innovationTitle}</p><Badge status={c.status} />
              </div>
              <p className="mt-1 text-sm text-gray-600">{c.message}</p>
              {c.notes && <p className="mt-1 text-sm text-gray-500">Catatan admin: {c.notes}</p>}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Diajukan {new Date(c.submittedAt).toLocaleDateString("id-ID")}</span>
                {["PENDING", "REVIEWING"].includes(c.status) && <DeleteClaimButton id={c.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
