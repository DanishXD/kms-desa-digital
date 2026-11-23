// Mesin retrieval RAG untuk chatbot KMS Desa Digital Indonesia.
//
// Modul ini MURNI (tanpa I/O) supaya bisa di-unit-test. Mengikuti rancangan
// Laporan Akhir PPKBP (F-01, F-02, F-05, §6.4, §10.2):
//   - KMS sebagai retrieval utama, dokumen sebagai fallback;
//   - filter role + abstention sebelum jawaban diberikan (S-03/S-04);
//   - sumber/tautan agar pengguna bisa memverifikasi;
//   - status keyakinan kualitatif (ditemukan/terbatas/tidak ditemukan),
//     TANPA angka confidence yang belum terkalibrasi;
//   - threshold 0,6 dan top-k 3 sesuai naskah/PoC.
//
// Catatan integritas (penting): ini retrieval LEKSIKAL deterministik (TF-IDF
// ringan). Ini BUKAN embedding mxbai-embed-large/Ollama dan BUKAN generator
// GPT-4o-mini/Qwen seperti yang dilaporkan pada baseline RAGAS historis.
// Jangan menyajikan hasil modul ini sebagai angka RAGAS naskah.

export type ChatRole = "ADMIN" | "VILLAGE" | "INNOVATOR" | "KEMENTERIAN" | "PUBLIC";

export type Collection = "innovations" | "villages" | "innovators" | "claims" | "documents";

export type Sensitivity = "public" | "claim" | "pii";

/** Identitas peminta — role SELALU berasal dari server (auth()), bukan body. */
export interface Principal {
  role: ChatRole;
  villageName?: string;
  innovatorName?: string;
}

/** Satu unit pengetahuan yang bisa di-retrieval. */
export interface KnowledgeNode {
  id: string;
  collection: Collection;
  title: string;
  /** Teks yang diindeks (judul + ringkasan + field relevan). */
  text: string;
  /** Cuplikan faktual yang ditampilkan sebagai jawaban dasar (grounded). */
  answer: string;
  href?: string;
  sensitivity: Sensitivity;
  /** Dipakai untuk membatasi klaim hanya pada desa pemiliknya. */
  villageName?: string;
}

export interface RagSource {
  title: string;
  collection: Collection;
  href?: string;
  snippet: string;
  /** Skor internal untuk audit; tidak ditampilkan sebagai confidence ke pengguna. */
  score: number;
}

export type RagStatus =
  | "found"
  | "limited"
  | "not_found"
  | "out_of_scope"
  | "needs_permission"
  | "needs_clarification";

export interface RagResult {
  reply: string;
  status: RagStatus;
  abstained: boolean;
  sources: RagSource[];
  suggestions: string[];
  scopeNote?: string;
  role: ChatRole;
  retrieval: {
    mode: "lexical-tfidf";
    threshold: number;
    topK: number;
    scanned: number;
    byCollection: Record<Collection, number>;
  };
}

export interface RetrieveOptions {
  threshold?: number;
  topK?: number;
}

/** Disclaimer usulan Bab 10.2 laporan — dipakai UI dan fallback API. */
export const CHAT_DISCLAIMER =
  "Chatbot membantu menemukan informasi dari data KMS dan dokumen yang tersedia. " +
  "Jawaban dapat tidak lengkap atau keliru dan bukan keputusan resmi. " +
  "Periksa sumber asli sebelum bertindak. Jika informasi tidak ditemukan atau " +
  "menyangkut akses data, hubungi admin/pengelola KMS.";

const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_TOP_K = 3;

// Kata umum bahasa Indonesia yang tidak membantu retrieval.
const STOP = new Set([
  "apa", "yang", "dan", "untuk", "dengan", "dari", "adalah", "bagaimana", "cara",
  "apakah", "bisa", "saya", "kami", "desa", "the", "and", "atau", "ini", "itu",
  "di", "ke", "pada", "ada", "atau", "juga", "dalam", "tentang", "seputar",
  "tolong", "mohon", " mau", "ingin", "saya", "anda", "nya", "siapa", "kenapa",
  "mengapa", "kapan", "dimana", "mana", "yang", "oleh", "sebagai", "jika", "bila",
  "sangat", "sekali", "lebih", "paling", "tidak", "bukan", "sudah", "belum",
]);

/** Tokenisasi ringan: huruf kecil, pisah non-alfanumerik, buang stopword. */
export function tokenize(text: string): string[] {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Pencocokan toleran terhadap imbuhan/penulisan Indonesia (irigasi↔irigasiku, adopsi↔mengadopsi). */
function tokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && (b.startsWith(a) || a.startsWith(b))) return true;
  if (a.length >= 5 && b.includes(a)) return true;
  return false;
}

/** IDF terhalus (smoothed) supaya korpus kecil tidak menghasilkan skor ekstrem. */
export function buildIdf(nodes: KnowledgeNode[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const node of nodes) {
    for (const t of new Set(tokenize(node.text))) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = Math.max(1, nodes.length);
  const idf = new Map<string, number>();
  for (const [t, c] of df) idf.set(t, 1 + Math.log((n + 1) / (c + 1)));
  return idf;
}

/** Cakupan token kueri yang cocok dengan node, dibobot IDF ringan → rentang [0, 1]. */
export function scoreNode(tokens: string[], idf: Map<string, number>, node: KnowledgeNode): number {
  const nodeTokens = tokenize(node.text);
  if (!tokens.length || !nodeTokens.length) return 0;
  let matched = 0;
  let total = 0;
  for (const t of tokens) {
    const w = 1 + Math.min(0.5, (idf.get(t) ?? 1.5) / 6);
    total += w;
    if (nodeTokens.some((nt) => tokenMatch(t, nt))) matched += w;
  }
  return total === 0 ? 0 : matched / total;
}

/** Role dari sesi server. Role tak dikenal/publik → paling membatasi. */
export function roleFromSession(role: string | null | undefined): ChatRole {
  if (role === "ADMIN" || role === "VILLAGE" || role === "INNOVATOR" || role === "KEMENTERIAN") return role;
  return "PUBLIC";
}

/**
 * Kebijakan akses node. Klaim/PII hanya untuk ADMIN, atau VILLAGE pada desanya
 * sendiri. KEMENTERIAN sengaja dibatasi (agregasi/role itu lemah di laporan).
 */
export function canAccess(principal: Principal, node: KnowledgeNode): boolean {
  if (node.sensitivity === "public") return true;
  if (principal.role === "ADMIN") return true;
  if (node.sensitivity === "claim" || node.sensitivity === "pii") {
    if (
      principal.role === "VILLAGE" &&
      principal.villageName &&
      node.villageName &&
      principal.villageName === node.villageName
    ) {
      return true;
    }
    return false;
  }
  return true;
}

const AGGREGATION = /(rata[\s-]?rata|total|jumlah|berapa banyak|peringkat|rank|terbaik|tertinggi|terendah|bandingkan|semua desa|seluruh desa|agregat|statistik|ranking)/i;
const OUT_OF_DOMAIN = /(cuaca|prakiraan|prediksi harga|saham|medis|obat|resep|dokter|berita|olahraga|judol|perjudian|artificial general|jokes|lagu|film)/i;
const CLARIFY = /^(apa|bagaimana|apa kabarnya|halo|hai|pagi|siang|sore|malam|desa|inovasi|data|help|tolong|bantuan|\?+)$/i;

function countByCollection(nodes: KnowledgeNode[]): Record<Collection, number> {
  const out: Record<Collection, number> = {
    innovations: 0, villages: 0, innovators: 0, claims: 0, documents: 0,
  };
  for (const n of nodes) out[n.collection] += 1;
  return out;
}

function abstain(
  principal: Principal,
  status: RagStatus,
  reply: string,
  nodes: KnowledgeNode[],
  options: Required<RetrieveOptions>,
  sources: RagSource[] = [],
  scopeNote?: string,
): RagResult {
  return {
    reply,
    status,
    abstained: true,
    sources,
    suggestions: defaultSuggestions(principal.role),
    scopeNote,
    role: principal.role,
    retrieval: {
      mode: "lexical-tfidf",
      threshold: options.threshold,
      topK: options.topK,
      scanned: nodes.length,
      byCollection: countByCollection(nodes),
    },
  };
}

function defaultSuggestions(role: ChatRole): string[] {
  const base = ["Lihat katalog inovasi", "Cara adopsi inovasi?", "Assessment kesiapan desa"];
  if (role === "ADMIN" || role === "VILLAGE") return [base[0], "Status pengajuan adopsi", base[2]];
  return base;
}

function toSource(node: KnowledgeNode, score: number): RagSource {
  return {
    title: node.title,
    collection: node.collection,
    href: node.href,
    snippet: node.answer,
    score: Number(score.toFixed(3)),
  };
}

function collectionLabel(c: Collection): string {
  switch (c) {
    case "innovations": return "inovasi";
    case "villages": return "profil desa";
    case "innovators": return "inovator";
    case "claims": return "pengajuan adopsi";
    case "documents": return "dokumen pendukung";
  }
}

/**
 * Jalankan retrieval + kebijakan + perakitan jawaban.
 *
 * Urutan sesuai laporan: cek domain/agregasi/klarifikasi → filter role →
 * skor → KMS lebih dulu, dokumen sebagai fallback → susun jawaban + sumber.
 */
export function retrieve(
  principal: Principal,
  query: string,
  nodes: KnowledgeNode[],
  opts: RetrieveOptions = {},
): RagResult {
  const options: Required<RetrieveOptions> = {
    threshold: opts.threshold ?? DEFAULT_THRESHOLD,
    topK: opts.topK ?? DEFAULT_TOP_K,
  };
  const msg = String(query ?? "").trim();
  const tokens = tokenize(msg);

  if (!tokens.length || CLARIFY.test(msg.toLowerCase())) {
    return abstain(
      principal, "needs_clarification",
      "Pertanyaan belum cukup spesifik. Sebutkan desa atau inovasi yang dimaksud, misalnya “potensi Desa Petir” atau “manfaat IrigasiKu”.",
      nodes, options,
    );
  }

  if (AGGREGATION.test(msg)) {
    return abstain(
      principal, "limited",
      "Pertanyaan agregasi/peringkat (rata-rata, total, ranking, perbandingan) belum didukung chatbot karena retrieval tidak menghitung angka secara deterministik. Saya tidak akan mengarang hitungan. Gunakan halaman katalog/dashboard atau hubungi admin untuk data resmi.",
      nodes, options,
    );
  }

  const allowed = nodes.filter((n) => canAccess(principal, n));
  const denied = nodes.filter((n) => !canAccess(principal, n));
  const idf = buildIdf(nodes);
  const ranked = allowed
    .map((node) => ({ node, score: scoreNode(tokens, idf, node) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  // Skor pada node yang DITOLAK dipakai untuk membedakan "memang tidak ada"
  // dari "ada, tetapi tidak boleh diakses role ini" (S-04).
  const deniedBest = denied
    .map((node) => scoreNode(tokens, idf, node))
    .sort((a, b) => b - a)[0] ?? 0;

  const best = ranked[0]?.score ?? 0;
  const kms = ranked.filter((r) => r.node.collection !== "documents" && r.score >= options.threshold).slice(0, options.topK);
  const docs = ranked.filter((r) => r.node.collection === "documents" && r.score >= options.threshold).slice(0, options.topK);
  const selected = kms.length > 0 ? kms : docs;
  const usedDocuments = kms.length === 0 && docs.length > 0;

  if (selected.length === 0) {
    if (OUT_OF_DOMAIN.test(msg)) {
      return abstain(
        principal, "out_of_scope",
        "Saya hanya membantu pencarian informasi KMS Desa Digital Indonesia (inovasi, desa, inovator, dan alur adopsi). Pertanyaan di luar cakupan itu belum bisa saya jawab.",
        nodes, options,
      );
    }
    if (denied.length > 0 && deniedBest >= options.threshold) {
      return abstain(
        principal, "needs_permission",
        "Saya menemukan informasi yang relevan, tetapi datanya termasuk pengajuan/PII yang tidak dapat ditampilkan untuk role Anda. Akses dibatasi di server sebelum jawaban dibentuk. Hubungi admin KMS bila Anda memerlukan akses.",
        nodes, options,
      );
    }
    if (best >= 0.3) {
      const near = ranked.slice(0, Math.min(2, options.topK));
      return abstain(
        principal, "limited",
        "Informasi yang ditemukan terbatas dan belum melewati ambang kepercayaan, jadi saya belum menyimpulkan jawaban. Berikut yang paling dekat; coba persempit pertanyaan atau buka katalog.",
        nodes, options,
        near.map((r) => toSource(r.node, r.score)),
        "Di bawah threshold 0,6 — sumber ditampilkan sebagai petunjuk, bukan jawaban final.",
      );
    }
    return abstain(
      principal, "not_found",
      "Belum menemukan sumber yang cukup di basis pengetahuan KMS maupun dokumen pendukung. Coba kata kunci lain (mis. “irigasi”, “kas”, “wisata”, “surat”) atau buka katalog /innovations.",
      nodes, options,
    );
  }

  // Perakitan jawaban grounded: maksimal lima poin (naskah: batas panjang entitas).
  const picks = selected.slice(0, 5);
  const lines = picks.map((r) => `• ${r.node.title} — ${r.node.answer}`);
  const lead = usedDocuments
    ? "Sumber yang cocok berasal dari dokumen pendukung website (data KMS tidak memiliki entitas yang cukup dekat):"
    : "Berdasarkan data KMS yang ditemukan:";
  const reply = `${lead}\n${lines.join("\n")}\n\nPeriksa sumber asli pada tautan di bawah sebelum bertindak.`;

  const suggestions = picks
    .map((r) => `Detail ${collectionLabel(r.node.collection)}: ${r.node.title}`)
    .slice(0, 2);
  if (principal.role === "ADMIN" || principal.role === "VILLAGE") suggestions.push("Status pengajuan adopsi");

  return {
    reply,
    status: "found",
    abstained: false,
    sources: picks.map((r) => toSource(r.node, r.score)),
    suggestions: [...suggestions, "Cara adopsi inovasi?"].slice(0, 3),
    scopeNote: usedDocuments
      ? "Fallback dokumen dipakai karena retrieval KMS tidak lolos threshold."
      : undefined,
    role: principal.role,
    retrieval: {
      mode: "lexical-tfidf",
      threshold: options.threshold,
      topK: options.topK,
      scanned: nodes.length,
      byCollection: countByCollection(nodes),
    },
  };
}
