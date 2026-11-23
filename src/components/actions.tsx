"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, btnGhost, btnPrimary } from "@/components/ui";

const NEXT: Record<string, { to: string; label: string }[]> = {
  DRAFT: [{ to: "SUBMITTED", label: "Ajukan untuk Review" }],
  SUBMITTED: [{ to: "DRAFT", label: "Tarik ke Draf" }],
  REVISION_REQUIRED: [{ to: "SUBMITTED", label: "Ajukan Ulang" }, { to: "DRAFT", label: "Kembalikan ke Draf" }],
  REJECTED: [{ to: "DRAFT", label: "Jadikan Draf Lagi" }],
};

export function SubmitBar({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const actions = NEXT[status] ?? [];
  if (actions.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
      <p className="text-sm">Status saat ini: <Badge status={status} /></p>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button key={a.to} disabled={loading} className={btnPrimary}
            onClick={async () => {
              if (!confirm(`Ubah status menjadi "${a.label}"?`)) return;
              setLoading(true); setError("");
              const r = await fetch("/api/innovations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: a.to }) });
              const j = await r.json();
              if (!r.ok) { setError(j.error ?? "Gagal."); setLoading(false); return; }
              router.refresh();
            }}>
            {a.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function DeleteClaimButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button className={btnGhost + " text-red-600"}
      onClick={async () => {
        if (!confirm("Batalkan pengajuan adopsi ini?")) return;
        await fetch("/api/claims", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "CANCELLED" }) });
        router.refresh();
      }}>
      Batalkan
    </button>
  );
}
