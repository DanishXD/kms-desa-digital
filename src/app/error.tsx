"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-brand-100 md:p-8">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-brand-900">Halaman belum bisa dimuat</h1>
        <p className="mt-2 text-sm text-gray-600">
          Coba lagi. Bila masih error, muat ulang halaman atau kembali ke beranda.
        </p>
        {isDev && error?.message && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-left text-xs text-red-700">{error.message}</p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button onClick={reset} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Coba lagi
          </button>
          <button onClick={() => window.location.reload()} className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Muat ulang halaman
          </button>
          <Link href="/" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
