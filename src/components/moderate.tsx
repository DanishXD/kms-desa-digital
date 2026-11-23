"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/components/ui";

export function ModerateButtons({ id, kind, current }: { id: string; kind: "innovation" | "claim"; current: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const act = async (status: string) => {
    const label = { APPROVED: "setujui", REJECTED: "tolak", REVISION_REQUIRED: "minta revisi", PUBLISHED: "tayangkan", REVIEWING: "tandai ditinjau" }[status] ?? status;
    if (!confirm(`Yakin ingin ${label} item ini?`)) return;
    setLoading(true); setError("");
    const r = await fetch(kind === "innovation" ? "/api/innovations" : "/api/claims", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "innovation" ? { id, status } : { id, action: status, notes: notes || undefined }),
    });
    const j = await r.json();
    if (!r.ok) { setError(j.error ?? "Gagal."); setLoading(false); return; }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400">{current}</span>
      {kind === "innovation" ? (
        <>
          {current === "SUBMITTED" && <button disabled={loading} onClick={() => act("UNDER_REVIEW")} className={btnPrimary}>Mulai Review</button>}
          {current === "UNDER_REVIEW" && (
            <>
              <button disabled={loading} onClick={() => act("APPROVED")} className={btnPrimary}>Setujui</button>
              <button disabled={loading} onClick={() => act("REVISION_REQUIRED")} className={btnGhost}>Minta Revisi</button>
              <button disabled={loading} onClick={() => act("REJECTED")} className={btnGhost + " text-red-600"}>Tolak</button>
            </>
          )}
          {current === "APPROVED" && <button disabled={loading} onClick={() => act("PUBLISHED")} className={btnPrimary}>Tayangkan</button>}
        </>
      ) : (
        <>
          {current === "PENDING" && <button disabled={loading} onClick={() => act("REVIEWING")} className={btnPrimary}>Tinjau</button>}
          {current === "REVIEWING" && (
            <>
              <button disabled={loading} onClick={() => act("APPROVED")} className={btnPrimary}>Setujui</button>
              <button disabled={loading} onClick={() => act("REJECTED")} className={btnGhost + " text-red-600"}>Tolak</button>
            </>
          )}
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" className="rounded-lg border px-2 py-1.5 text-xs" />
        </>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
