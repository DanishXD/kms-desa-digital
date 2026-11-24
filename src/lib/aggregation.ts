// Agregasi/peringkat deterministik untuk chatbot.
// Sengaja TIDAK memakai LLM / text-to-SQL: hanya intent yang di-allowlist dan
// dihitung dari data yang sudah tervalidasi di server. Tidak ada angka rekaan.
import type { ChatRole, RagResult, RagSource } from "./rag";

export interface AggregateInnovation {
  title: string;
  slug: string;
  categoryName: string;
  status: string;
  claimCount: number;
}
export interface AggregateClaim {
  status: string;
  villageName: string;
  innovationTitle: string;
}
export interface AggregateData {
  innovations: AggregateInnovation[];
  villages: { name: string }[];
  innovators: { name: string }[];
  claims: AggregateClaim[];
}

const ID = {
  totalInnovations: /(berapa|jumlah|total).*(inovasi|innovation)|(inovasi|innovation).*(berapa|jumlah|total)/i,
  categories: /(kategori|category).*(terbanyak|peringkat|ranking|jumlah|sebaran)|(terbanyak|peringkat|ranking).*(kategori|category)/i,
  adoption: /(adopsi|klaim|claim).*(terbanyak|peringkat|ranking|top)|(inovasi|innovation).*(terbanyak|paling banyak|peringkat|ranking).*(adopsi|klaim|claim)/i,
  claimStatus: /(status|jumlah|berapa).*(pengajuan|klaim|claim|adopsi)|(pengajuan|klaim|claim|adopsi).*(status|jumlah|berapa)/i,
  villages: /(berapa|jumlah|total).*(desa|village)|(desa|village).*(berapa|jumlah|total)/i,
  innovators: /(berapa|jumlah|total).*(inovator|innovator)|(inovator|innovator).*(berapa|jumlah|total)/i,
};

function source(title: string, href: string, snippet: string): RagSource {
  return { title, collection: "innovations", href, snippet, score: 1 };
}

/**
 * Mengembalikan jawaban agregasi bila query cocok dengan intent yang diizinkan,
 * atau null bila bukan pertanyaan agregasi (dibiarkan ke pipeline RAG biasa).
 */
export function aggregateAnswer(
  query: string,
  data: AggregateData,
  role: ChatRole,
): RagResult | null {
  const msg = String(query ?? "").trim();
  if (!msg) return null;
  const published = data.innovations.filter((i) => i.status === "PUBLISHED");
  const emptySources: RagSource[] = [];
  const base = (reply: string, sources: RagSource[] = emptySources): RagResult => ({
    reply,
    status: "found",
    abstained: false,
    sources,
    suggestions: ["Lihat katalog inovasi", "Bandingkan kategori", "Cara adopsi inovasi?"],
    role,
    retrieval: {
      mode: "deterministic-aggregate",
      threshold: 0,
      topK: 0,
      scanned: data.innovations.length + data.villages.length + data.innovators.length + data.claims.length,
      byCollection: {
        innovations: data.innovations.length,
        villages: data.villages.length,
        innovators: data.innovators.length,
        claims: data.claims.length,
        documents: 0,
      },
    },
  });

  if (ID.totalInnovations.test(msg)) {
    return base(
      `Saat ini ada ${published.length} inovasi yang tayang di katalog KMS${data.innovations.length > published.length ? ` (dari ${data.innovations.length} entri termasuk yang belum tayang)` : ""}. Angka ini dihitung langsung dari katalog saat permintaan, bukan dari LLM.`,
      [source("Katalog inovasi", "/innovations", "Daftar inovasi yang tayang.")],
    );
  }

  if (ID.categories.test(msg)) {
    const counts = new Map<string, number>();
    published.forEach((i) => counts.set(i.categoryName, (counts.get(i.categoryName) ?? 0) + 1));
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
    if (!rows.length) return null;
    return base(
      `Sebaran inovasi tayang per kategori (terbanyak): ${rows.map(([k, v]) => `${k} ${v}`).join(", ")}. Dihitung deterministik dari katalog.`,
      [source("Katalog per kategori", "/innovations", "Filter kategori pada katalog inovasi.")],
    );
  }

  if (ID.adoption.test(msg)) {
    const rows = [...published].sort((a, b) => b.claimCount - a.claimCount || a.title.localeCompare(b.title)).slice(0, 5);
    if (!rows.length) return null;
    return base(
      `Inovasi tayang dengan pengajuan adopsi terbanyak: ${rows.map((r) => `${r.title} (${r.claimCount})`).join(", ")}. Angka pengajuan dihitung dari data adopsi, bukan dari teks.`,
      rows.slice(0, 3).map((r) => source(r.title, `/innovations/${r.slug}`, `${r.claimCount} pengajuan adopsi.`)),
    );
  }

  if (ID.claimStatus.test(msg)) {
    const privileged = role === "ADMIN" || role === "KEMENTERIAN";
    if (!privileged) {
      return {
        ...base(
          "Ringkasan status pengajuan adopsi hanya tersedia untuk ADMIN dan KEMENTERIAN. Sebagai alternatif, lihat status pengajuan desa Anda di dashboard atau gunakan katalog inovasi.",
          [source("Katalog inovasi", "/innovations", "Informasi publik tentang adopsi.")],
        ),
        status: "needs_permission",
        abstained: true,
      };
    }
    const counts = new Map<string, number>();
    data.claims.forEach((c) => counts.set(c.status, (counts.get(c.status) ?? 0) + 1));
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!rows.length) return null;
    return base(
      `Status pengajuan adopsi saat ini: ${rows.map(([k, v]) => `${k} ${v}`).join(", ")}. Total ${data.claims.length} pengajuan. Dihitung deterministik dari data adopsi.`,
      [source("Moderasi pengajuan", "/admin", "Ringkasan pengajuan untuk admin.")],
    );
  }

  if (ID.villages.test(msg)) {
    return base(
      `KMS mencatat ${data.villages.length} profil desa. Angka ini dihitung dari direktori desa.`,
      [{ title: "Direktori desa", collection: "villages", href: "/villages", snippet: "Profil desa terdaftar.", score: 1 }],
    );
  }

  if (ID.innovators.test(msg)) {
    return base(
      `KMS mencatat ${data.innovators.length} profil inovator. Angka ini dihitung dari direktori inovator.`,
      [{ title: "Direktori inovator", collection: "innovators", href: "/innovators", snippet: "Profil inovator terdaftar.", score: 1 }],
    );
  }

  return null;
}
