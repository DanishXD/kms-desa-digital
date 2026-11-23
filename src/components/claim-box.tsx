"use client";
import Link from "next/link";
import { useState } from "react";
import { btnPrimary } from "./ui";

export function ClaimBox({ innovationId, loggedIn, role, claimCount }: { innovationId: string; loggedIn: boolean; role?: string; claimCount: number }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (!loggedIn) {
    return (
      <div className="rounded-2xl bg-brand-900 p-5 text-center text-white">
        <p className="text-2xl font-extrabold">{claimCount}</p>
        <p className="text-sm text-brand-100">desa telah mengadopsi</p>
        <Link href={`/login?callbackUrl=/innovations/${innovationId}`} className="mt-3 block rounded-xl bg-accent-400 px-4 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-500">
          Masuk untuk Adopsi
        </Link>
        <p className="mt-2 text-xs text-brand-200">Khusus akun perangkat desa</p>
      </div>
    );
  }
  if (role !== "VILLAGE") {
    return <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 ring-1 ring-brand-100">Pengajuan adopsi hanya untuk akun desa. Akun Anda: <b>{role}</b>.</div>;
  }
  if (state === "done") {
    return <div className="rounded-2xl bg-green-50 p-5 text-sm text-green-800 ring-1 ring-green-200">Pengajuan adopsi berhasil dikirim. Pantau status di <Link href="/dashboard/claims" className="font-bold underline">Dashboard → Pengajuan Saya</Link>.</div>;
  }
  return (
    <form
      className="space-y-3 rounded-2xl bg-brand-900 p-5 text-white"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("loading"); setError("");
        try {
          const r = await fetch("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ innovationId, message }) });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? "Gagal mengirim.");
          setState("done");
        } catch (err) { setState("error"); setError(err instanceof Error ? err.message : "Gagal."); }
      }}
    >
      <p className="font-bold">Adopsi untuk desamu</p>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} rows={4}
        placeholder="Ceritakan kebutuhan desamu: luas lahan, jumlah warga, target waktu…" className="w-full rounded-xl px-3 py-2 text-sm text-gray-900" />
      {state === "error" && <p className="text-xs text-red-300">{error}</p>}
      <button disabled={state === "loading"} className={btnPrimary + " w-full bg-accent-400 text-brand-900 hover:bg-accent-500"}>
        {state === "loading" ? "Mengirim…" : "Kirim Pengajuan Adopsi"}
      </button>
    </form>
  );
}
