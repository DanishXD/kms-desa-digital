"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, btnPrimary, inputCls } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VILLAGE" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Daftar Akun</h1>
      <form
        className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-brand-100"
        onSubmit={async (e) => {
          e.preventDefault(); setLoading(true); setError("");
          try {
            const r = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? "Gagal mendaftar.");
            const s = await signIn("credentials", { email: form.email, password: form.password, redirect: false, callbackUrl: "/dashboard" });
            if (s?.error) throw new Error("Akun dibuat — silakan masuk manual.");
            router.push("/dashboard");
          } catch (err) { setError(err instanceof Error ? err.message : "Gagal."); setLoading(false); }
        }}
      >
        <Field label="Nama lengkap / nama desa"><input required minLength={3} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="cth: Desa Petir" /></Field>
        <Field label="Email"><input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} /></Field>
        <Field label="Kata sandi (min. 6)"><input required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} /></Field>
        <Field label="Daftar sebagai">
          <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputCls}>
            <option value="VILLAGE">Perangkat Desa — adopsi inovasi</option>
            <option value="INNOVATOR">Inovator — publikasi inovasi</option>
          </select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className={btnPrimary + " w-full"}>{loading ? "Mendaftar…" : "Buat Akun"}</button>
        <p className="text-center text-sm text-gray-500">Sudah punya akun? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Masuk</Link></p>
      </form>
    </div>
  );
}
