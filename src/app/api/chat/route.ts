import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildKnowledgeNodes } from "@/server/rag-source";
import {
  CHAT_DISCLAIMER,
  retrieve,
  roleFromSession,
  type ChatRole,
  type RagResult,
  type RagStatus,
} from "@/lib/rag";

interface HistoryItem { from?: string; text?: string }

const MAX_MESSAGE = 500;
const HISTORY_LIMIT = 6;

function fallback(
  role: ChatRole,
  status: RagStatus,
  reply: string,
  scopeNote?: string,
): RagResult {
  return {
    reply,
    status,
    abstained: true,
    sources: [],
    suggestions: ["Lihat katalog inovasi", "Cara adopsi inovasi?"],
    scopeNote,
    role,
    retrieval: {
      mode: "lexical-tfidf",
      threshold: 0.6,
      topK: 3,
      scanned: 0,
      byCollection: { innovations: 0, villages: 0, innovators: 0, claims: 0, documents: 0 },
    },
  };
}

function toJson(result: RagResult) {
  return {
    ...result,
    // `reply` dipertahankan untuk kompatibilitas; `answer` mengikuti kontrak laporan.
    answer: result.reply,
    disclaimer: CHAT_DISCLAIMER,
  };
}

export async function POST(req: Request) {
  // Role SELALU berasal dari sesi server, tidak pernah dipercaya dari body client.
  const session = await auth().catch(() => null);
  const role = roleFromSession((session?.user as Record<string, unknown> | undefined)?.role as string | undefined);

  try {
    const body = (await req.json()) as { message?: string; history?: HistoryItem[] };
    const msg = (body.message ?? "").trim().slice(0, MAX_MESSAGE);
    if (!msg) {
      return NextResponse.json(
        toJson(fallback(role, "needs_clarification", "Silakan tulis pertanyaan seputar inovasi, desa, inovator, atau cara adopsi.")),
      );
    }

    const history = Array.isArray(body.history) ? body.history.slice(-HISTORY_LIMIT) : [];
    // Resolusi ringan untuk follow-up pendek memakai maksimal enam pesan terakhir.
    let effective = msg;
    if (msg.length < 25 && /\b(dan|lalu|manfaatnya|detail|itu|tersebut|nya)\b/i.test(msg)) {
      const prev = [...history].reverse().find((h) => h.from === "user" && typeof h.text === "string");
      if (prev?.text) effective = `${prev.text} ${msg}`;
    }

    const nodes = await buildKnowledgeNodes();
    const sessionUser = (session?.user ?? {}) as Record<string, unknown>;
    const villageId = sessionUser.villageId as string | undefined;
    const innovatorId = sessionUser.innovatorId as string | undefined;

    const result = retrieve(
      {
        role,
        villageName: nodes.find((n) => n.id === `village:${villageId}`)?.title,
        innovatorName: nodes.find((n) => n.id === `innovator:${innovatorId}`)?.title,
      },
      effective,
      nodes,
    );

    return NextResponse.json(toJson(result));
  } catch {
    return NextResponse.json(
      toJson(fallback(role, "not_found", "Terjadi gangguan saat mengakses basis pengetahuan. Coba lagi sebentar atau buka katalog /innovations.")),
      { status: 500 },
    );
  }
}
