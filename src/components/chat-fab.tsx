"use client";
import { useRef, useState } from "react";
import { IconChat, IconSend, IconX } from "./icons";
import { CHAT_DISCLAIMER, type RagStatus } from "@/lib/rag";

interface Source {
  title: string;
  collection: string;
  href?: string;
  snippet: string;
}

interface Msg {
  from: "user" | "bot";
  text: string;
  status?: RagStatus;
  sources?: Source[];
  suggestions?: string[];
  scopeNote?: string;
}

const QUICK = ["Irigasi hemat air", "Potensi Desa Petir", "Cara adopsi inovasi?"];

const STATUS_BADGE: Record<RagStatus, { label: string; cls: string }> = {
  found: { label: "Sumber ditemukan", cls: "bg-emerald-50 text-emerald-700" },
  limited: { label: "Informasi terbatas", cls: "bg-amber-50 text-amber-700" },
  not_found: { label: "Tidak ditemukan", cls: "bg-gray-100 text-gray-600" },
  out_of_scope: { label: "Di luar cakupan", cls: "bg-gray-100 text-gray-600" },
  needs_permission: { label: "Akses dibatasi", cls: "bg-rose-50 text-rose-700" },
  needs_clarification: { label: "Butuh klarifikasi", cls: "bg-sky-50 text-sky-700" },
};

const COLLECTION_LABEL: Record<string, string> = {
  innovations: "inovasi",
  villages: "profil desa",
  innovators: "inovator",
  claims: "pengajuan",
  documents: "dokumen pendukung",
};

export function ChatFab() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{
    from: "bot",
    text: "Halo! Saya asisten RAG KMS Desa Digital. Tanya soal inovasi, profil desa, inovator, atau alur adopsi — saya sertakan sumbernya.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setMsgs((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const history = msgs.slice(-6).map((m) => ({ from: m.from, text: m.text }));
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      });
      const j = await r.json();
      setMsgs((m) => [...m, {
        from: "bot",
        text: j.reply ?? "…",
        status: j.status as RagStatus,
        sources: Array.isArray(j.sources) ? j.sources : [],
        suggestions: Array.isArray(j.suggestions) ? j.suggestions : [],
        scopeNote: j.scopeNote,
      }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Gangguan koneksi. Coba lagi.", status: "not_found" }]);
    }
    setLoading(false);
    requestAnimationFrame(() => boxRef.current?.scrollTo({ top: 99999 }));
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Tutup chatbot asisten desa" : "Buka chatbot asisten desa"}
        aria-expanded={open}
        className="chat-fab-toggle fixed z-50 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700 active:scale-95"
      >
        {open ? <IconX className="h-6 w-6" /> : <IconChat className="h-6 w-6" />}
      </button>
      {open && (
        <div className="chat-panel fixed z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-brand-100" role="dialog" aria-label="Asisten KMS Desa Digital">
          <div className="bg-brand-700 px-4 py-3 text-white">
            <p className="font-bold">Asisten Desa Digital</p>
            <p className="text-xs text-brand-100">Jawab dari data KMS + dokumen, dengan sumber</p>
          </div>
          <div ref={boxRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
            {msgs.map((m, i) =>
              m.from === "user" ? (
                <p key={i} className="ml-auto max-w-[85%] whitespace-pre-line break-words rounded-2xl bg-brand-600 px-3 py-2 text-sm text-white">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="max-w-[95%] space-y-1.5">
                  <p className="whitespace-pre-line break-words rounded-2xl bg-gray-100 px-3 py-2 text-sm">{m.text}</p>

                  {m.status && (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[m.status].cls}`}>
                      {STATUS_BADGE[m.status].label}
                    </span>
                  )}
                  {m.scopeNote && <p className="text-[10px] leading-snug text-gray-500">{m.scopeNote}</p>}

                  {m.sources && m.sources.length > 0 && (
                    <div className="space-y-1">
                      {m.sources.map((s, si) => {
                        const body = (
                          <>
                            <span className="font-semibold text-brand-800">{s.title}</span>
                            <span className="ml-1 text-[9px] uppercase tracking-wide text-brand-600">
                              {COLLECTION_LABEL[s.collection] ?? s.collection}
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-gray-600">{s.snippet}</span>
                          </>
                        );
                        return s.href ? (
                          <a key={si} href={s.href} className="block rounded-lg border border-brand-100 bg-brand-50/60 p-2 transition hover:bg-brand-100">
                            {body}
                          </a>
                        ) : (
                          <div key={si} className="rounded-lg border border-gray-100 bg-gray-50 p-2">{body}</div>
                        );
                      })}
                    </div>
                  )}

                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.suggestions.map((sg) => (
                        <button
                          key={sg}
                          onClick={() => send(sg)}
                          disabled={loading}
                          className="rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[10px] font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                        >
                          {sg}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {loading && <p className="text-sm text-gray-400">Mencari sumber…</p>}
          </div>
          <div className="chat-quick flex flex-wrap gap-1.5 border-t border-gray-100 p-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} disabled={loading} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>
          <form className="flex gap-2 p-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis pertanyaan…" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" aria-label="Pesan chatbot" />
            <button className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={loading} aria-label="Kirim">
              <IconSend className="h-4 w-4" />
            </button>
          </form>
          <p className="border-t border-gray-100 px-3 py-2 text-[10px] leading-snug text-gray-400">{CHAT_DISCLAIMER}</p>
        </div>
      )}
    </>
  );
}
