"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Item {
  id: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // best effort
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      load();
    }, 0);
    const timer = setInterval(load, 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAll = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // best effort
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifikasi, ${unread} belum dibaca`}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-brand-100">
          <div className="flex items-center justify-between border-b border-brand-50 px-4 py-2">
            <span className="text-sm font-bold">Notifikasi</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-semibold text-brand-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">Belum ada notifikasi.</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className={"px-4 py-3 text-sm ring-1 ring-transparent " + (n.read ? "text-gray-600" : "bg-brand-50 text-brand-900")}>
                  <p className="font-semibold">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-brand-50 px-4 py-2 text-right">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-xs font-semibold text-brand-600 hover:underline">
              Buka dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
