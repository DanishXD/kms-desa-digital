import Link from "next/link";
import { IconSearch } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <IconSearch className="mx-auto h-12 w-12 text-brand-300" />
      <h1 className="mt-4 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-gray-500">Alamat yang kamu tuju tidak ada atau sudah dipindah.</p>
      <Link href="/" className="mt-5 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">Kembali ke Beranda</Link>
    </div>
  );
}
