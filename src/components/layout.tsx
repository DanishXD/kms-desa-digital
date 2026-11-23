import Link from "next/link";
import { auth, signOut } from "@/auth";
import { isDbMode } from "@/server/store";
import { IconSprout } from "./icons";
import { NotificationBell } from "./notification-bell";

export async function Navbar() {
  const session = await auth();
  const user = session?.user as unknown as { name?: string; role?: string } | undefined;
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur">
      {!isDbMode() && (
        <p className="demo-banner bg-accent-400 px-4 py-1 text-center text-xs font-semibold text-brand-900">
          Mode demo — tanpa DATABASE_URL data tersimpan sementara (in-memory). Isi MongoDB Atlas untuk persisten.
        </p>
      )}
      <nav className="site-nav mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4" aria-label="Navigasi utama">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-brand-700">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><IconSprout className="h-5 w-5" /></span>
          <span className="leading-tight">KMS Desa Digital<small className="brand-sub block text-xs font-medium text-brand-400">Indonesia</small></span>
        </Link>
        <div className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href="/innovations" className="hover:text-brand-600">Inovasi</Link>
          <Link href="/villages" className="hover:text-brand-600">Desa</Link>
          <Link href="/innovators" className="hover:text-brand-600">Inovator</Link>
          <Link href="/assessment" className="hover:text-brand-600">Assessment</Link>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          {user ? (
            <>
              {user.role !== "ADMIN" && <NotificationBell />}
              <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white hover:bg-brand-700">
                {user.role === "ADMIN" ? "Admin" : user.role === "KEMENTERIAN" ? "Kementerian" : "Dashboard"}
              </Link>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 font-medium hover:bg-gray-100">Masuk</Link>
              <Link href="/register" className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white hover:bg-brand-700">Daftar</Link>
            </>
          )}
        </div>
      </nav>
      <div className="flex gap-4 overflow-x-auto border-t border-brand-50 px-4 py-2 text-sm font-medium md:hidden [&>a]:whitespace-nowrap">
        <Link href="/innovations">Inovasi</Link><Link href="/villages">Desa</Link>
        <Link href="/innovators">Inovator</Link><Link href="/assessment">Assessment</Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-extrabold text-white">KMS Desa Digital Indonesia</p>
          <p className="mt-2 text-sm">Platform berbagi inovasi, potensi, dan teknologi untuk memajukan desa-desa Nusantara.</p>
        </div>
        <nav className="text-sm" aria-label="Footer">
          <p className="font-semibold text-white">Jelajahi</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/innovations" className="hover:underline">Katalog Inovasi</Link></li>
            <li><Link href="/villages" className="hover:underline">Desa Digital</Link></li>
            <li><Link href="/innovators" className="hover:underline">Inovator</Link></li>
            <li><Link href="/assessment" className="hover:underline">Assessment Kesiapan</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="font-semibold text-white">Akun demo</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            <li>admin@digidesa.id / admin123</li>
            <li>inovator@tani.id / inovator123</li>
            <li>inovator@desa.id / inovator123</li>
            <li>inovator@irigasi.id / inovator123</li>
            <li>desa@petir.id / desa123</li>
            <li>desa@sembalun.id / desa123</li>
            <li>kementerian@digidesa.id / kementerian123</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs">Functional clone untuk tujuan edukasi (PPKBP) - terinspirasi konsep digidesa.tech.</p>
    </footer>
  );
}
