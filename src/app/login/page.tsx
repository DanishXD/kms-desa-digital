"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Field, btnPrimary, inputCls } from "@/components/ui";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";

  return (
    <form
      className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-brand-100"
      onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        const r = await signIn("credentials", { email, password, redirect: false, callbackUrl });
        setLoading(false);
        if (r?.error) setError("Email atau kata sandi salah.");
        else router.push(callbackUrl);
      }}
    >
      <Field label="Email"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
      <Field label="Kata sandi"><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className={btnPrimary + " w-full"}>{loading ? "Masuk…" : "Masuk"}</button>
      {process.env.NEXT_PUBLIC_GOOGLE === "1" && (
        <button type="button" onClick={() => signIn("google", { callbackUrl })} className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-semibold hover:bg-gray-50">Lanjutkan dengan Google</button>
      )}
      <p className="text-center text-sm text-gray-500">Belum punya akun? <Link href="/register" className="font-semibold text-brand-600 hover:underline">Daftar</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Masuk</h1>
      <Suspense><LoginInner /></Suspense>
    </div>
  );
}
