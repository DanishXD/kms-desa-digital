import Link from "next/link";
import { IconInbox } from "./icons";
import { cn, statusLabel } from "@/lib/utils";

// Badge status — warna semantik konsisten di seluruh app.
export function Badge({ status, className }: { status: string; className?: string }) {
  const color =
    status === "PUBLISHED" || status === "APPROVED" ? "bg-green-100 text-green-800"
    : ["SUBMITTED", "PENDING", "UNDER_REVIEW", "REVIEWING"].includes(status) ? "bg-amber-100 text-amber-800"
    : ["REJECTED"].includes(status) ? "bg-red-100 text-red-800"
    : status === "REVISION_REQUIRED" ? "bg-orange-100 text-orange-800"
    : "bg-gray-100 text-gray-700";
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", color, className)}>{statusLabel(status)}</span>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center">
      <IconInbox className="mx-auto h-10 w-10 text-brand-300" />
      <p className="mt-2 font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message?: string; retry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <p className="font-semibold text-red-800">{message ?? "Terjadi kesalahan saat memuat data. Coba lagi."}</p>
      {retry && <button onClick={retry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Coba lagi</button>}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
      <p className="text-3xl font-extrabold text-brand-700">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function SectionTitle({ title, desc, href, linkLabel }: { title: string; desc?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 h-1 w-10 rounded-full bg-accent-400" aria-hidden />
        <h2 className="text-xl font-extrabold text-brand-900">{title}</h2>
        {desc && <p className="text-sm text-gray-500">{desc}</p>}
      </div>
      {href && <Link href={href} className="shrink-0 text-sm font-semibold text-brand-600 hover:underline">{linkLabel ?? "Lihat semua →"}</Link>}
    </div>
  );
}

export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
export const btnPrimary = "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50";
export const btnGhost = "rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50";
