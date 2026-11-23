import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, SectionTitle, Stat } from "@/components/ui";
import { auth } from "@/auth";
import { dashboardStats, listAssessments, listClaims, listInnovations, userNotifications } from "@/server/store";
import type { SessionUser } from "@/server/store";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  const user = session.user as unknown as SessionUser;
  if (user.role === "ADMIN") redirect("/admin");

  const stats = await dashboardStats();
  const notes = await userNotifications(user.id);

  if (user.role === "INNOVATOR") {
    const mine = await listInnovations({ mine: user.innovatorId, perPage: 24 });
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-extrabold text-brand-900">Dashboard Inovator</h1><p className="text-sm text-gray-500">Halo, {user.name} 👋</p></div>
          <Link href="/dashboard/innovations/new" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">+ Buat Inovasi</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Inovasi saya" value={mine.total} />
          <Stat label="Tayang" value={mine.items.filter((i) => i.status === "PUBLISHED").length} />
          <Stat label="Dalam review" value={mine.items.filter((i) => ["SUBMITTED", "UNDER_REVIEW"].includes(i.status)).length} />
          <Stat label="Perlu revisi" value={mine.items.filter((i) => i.status === "REVISION_REQUIRED").length} />
        </div>
        <section>
          <SectionTitle title="Submission Tracker" desc="Alur: Draf → Diajukan → Ditinjau → Disetujui → Tayang" />
          {mine.items.length === 0 ? <EmptyState title="Belum ada inovasi." action={<Link href="/dashboard/innovations/new" className="text-sm font-bold text-brand-600">Buat yang pertama →</Link>} /> : (
            <ul className="space-y-2">
              {mine.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                  <div><p className="font-bold">{i.title}</p><p className="text-xs text-gray-500">{i.categoryName}</p></div>
                  <div className="flex shrink-0 items-center gap-2"><Badge status={i.status} /><Link href={`/dashboard/innovations/${i.id}`} className="text-sm font-semibold text-brand-600 hover:underline">Kelola</Link></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {notes.length > 0 && (
          <section>
            <SectionTitle title="Notifikasi" />
            <ul className="space-y-2 text-sm">{notes.map((n) => <li key={n.id} className="rounded-xl bg-white p-3 ring-1 ring-brand-100"><b>{n.title}</b> — {n.body}</li>)}</ul>
          </section>
        )}
      </div>
    );
  }

  // KEMENTERIAN: read-only aggregate + published innovations, no claims.
  if (user.role === "KEMENTERIAN") {
    const published = await listInnovations({ publishedOnly: true, perPage: 6 });
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-extrabold text-brand-900">Dashboard Kementerian</h1><p className="text-sm text-gray-500">Halo, {user.name} 👋 — tampilan baca-saja.</p></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Inovasi tayang" value={stats.published} href="/innovations" />
          <Stat label="Total inovasi" value={stats.innovations} />
          <Stat label="Total desa" value={stats.villages} />
          <Stat label="Total inovator" value={stats.innovators} />
        </div>
        <section>
          <SectionTitle title="Inovasi Terbaru" href="/innovations" linkLabel="Lihat katalog →" />
          <ul className="space-y-2">
            {published.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                <div><p className="font-bold">{i.title}</p><p className="text-xs text-gray-500">{i.categoryName} · {i.innovatorName}</p></div>
                <Link href={`/innovations/${i.slug}`} className="text-sm font-semibold text-brand-600 hover:underline">Lihat</Link>
              </li>
            ))}
          </ul>
        </section>
        {notes.length > 0 && (
          <section>
            <SectionTitle title="Notifikasi" />
            <ul className="space-y-2 text-sm">{notes.map((n) => <li key={n.id} className="rounded-xl bg-white p-3 ring-1 ring-brand-100"><b>{n.title}</b> - {n.body}</li>)}</ul>
          </section>
        )}
      </div>
    );
  }

  // VILLAGE
  const claims = await listClaims({ villageId: user.villageId });
  const assessments = await listAssessments(user.villageId, 5);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold text-brand-900">Dashboard Desa</h1><p className="text-sm text-gray-500">Halo, {user.name} 👋</p></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pengajuan adopsi" value={claims.length} href="/dashboard/claims" />
        <Stat label="Disetujui" value={claims.filter((c) => c.status === "APPROVED").length} />
        <Stat label="Aktif diproses" value={claims.filter((c) => ["PENDING", "REVIEWING"].includes(c.status)).length} />
        <Stat label="Inovasi tayang" value={stats.published} href="/innovations" />
      </div>
      <section>
        <SectionTitle title="Pengajuan Saya" href="/dashboard/claims" />
        {claims.length === 0 ? <EmptyState title="Belum ada pengajuan adopsi." hint="Jelajahi katalog dan klik Adopsi." action={<Link href="/innovations" className="text-sm font-bold text-brand-600">Jelajahi Inovasi →</Link>} /> : (
          <ul className="space-y-2">
            {claims.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                <div><p className="font-bold">{c.innovationTitle}</p><p className="text-xs text-gray-500">{new Date(c.submittedAt).toLocaleDateString("id-ID")}</p></div>
                <Badge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <SectionTitle title="Riwayat Assessment" href="/assessment" linkLabel="Isi assessment →" />
        {assessments.length === 0 ? <EmptyState title="Belum ada riwayat assessment." hint="Ukur kesiapan digital desa dalam 7 pertanyaan." action={<Link href="/assessment" className="text-sm font-bold text-brand-600">Mulai assessment →</Link>} /> : (
          <ul className="space-y-2">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                <div><p className="font-bold">{a.score}/100</p><p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString("id-ID")}</p></div>
                <div className="flex shrink-0 items-center gap-2"><Badge status={a.level === "HIGH" ? "APPROVED" : a.level === "MEDIUM" ? "PENDING" : "REJECTED"} /><span className="text-xs font-semibold text-gray-500">{a.level}</span></div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {notes.length > 0 && (
        <section>
          <SectionTitle title="Notifikasi" />
          <ul className="space-y-2 text-sm">{notes.map((n) => <li key={n.id} className="rounded-xl bg-white p-3 ring-1 ring-brand-100"><b>{n.title}</b> — {n.body}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
