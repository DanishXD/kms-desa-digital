"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-extrabold">Terjadi kesalahan saat memuat data. Coba lagi.</h1>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      <button onClick={reset} className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">Coba lagi</button>
    </div>
  );
}
