import type { Metadata } from "next";
import "./globals.css";
import { Footer, Navbar } from "@/components/layout";
import { ChatFab } from "@/components/chat-fab";

export const metadata: Metadata = {
  title: { default: "KMS Desa Digital Indonesia - Solusi Inovasi Desa", template: "%s | KMS Desa Digital" },
  description: "Knowledge Management System Desa Digital Indonesia. Platform berbagi inovasi, potensi, dan teknologi untuk memajukan desa Nusantara.",
  keywords: ["KMS Desa Digital", "Inovasi Desa", "Smart Village", "Desa Digital Indonesia"],
  openGraph: { title: "KMS Desa Digital Indonesia", description: "Platform berbagi inovasi dan teknologi untuk memajukan desa di Nusantara.", locale: "id_ID", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="flex min-h-full flex-col">
        <a href="#konten" className="sr-only focus:not-sr-only focus:absolute focus:bg-white focus:p-2">Lewati ke konten</a>
        <Navbar />
        <main id="konten" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <Footer />
        <ChatFab />
      </body>
    </html>
  );
}
