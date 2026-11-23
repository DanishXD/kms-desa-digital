// Menyusun korpus RAG dari repository KMS yang sudah ada (Prisma / demo memori)
// ditambah sekumpulan kecil "dokumen pendukung" berisi konten nyata website.
//
// Pisah dari route supaya kontrak retrieval tetap bisa diuji tanpa I/O.
// Tidak ada konten dokumen research (Buku Inovasi IPB / Profil Desa Petir) yang
// dipalsukan di sini: fallback memakai informasi yang memang ada di website.
import { listClaims, listInnovations, listInnovators, listVillages } from "@/server/store";
import type { KnowledgeNode } from "@/lib/rag";

const asText = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asText).join(", ");
  if (v && typeof v === "object") return JSON.stringify(v);
  return "";
};

/** Dokumen pendukung = fitur/kebijakan yang benar-benar tersedia di website. */
const DOCUMENTS: KnowledgeNode[] = [
  {
    id: "doc_adopsi",
    collection: "documents",
    title: "Cara mengajukan adopsi inovasi",
    text: "cara adopsi inovasi ajukan klaim daftar akun desa buka halaman inovasi isi form adopsi pantau status dashboard pengajuan saya admin meninjau",
    answer: "Daftar sebagai akun Desa, buka halaman inovasi, isi form Adopsi, lalu pantau status di Dashboard → Pengajuan Saya. Admin akan meninjau pengajuan.",
    href: "/innovations",
    sensitivity: "public",
  },
  {
    id: "doc_status_klaim",
    collection: "documents",
    title: "Alur status pengajuan adopsi",
    text: "status pengajuan adopsi klaim menunggu ditinjau disetujui ditolak dibatalkan alur review",
    answer: "Status pengajuan: PENDING → REVIEWING → APPROVED atau REJECTED. Pengaju dapat membatalkan pengajuan yang masih aktif.",
    href: "/dashboard/claims",
    sensitivity: "public",
  },
  {
    id: "doc_assessment",
    collection: "documents",
    title: "Assessment kesiapan digital desa",
    text: "assessment kesiapan digital skor level LOW MEDIUM HIGH rekomendasi prioritas tujuh pertanyaan tiga menit",
    answer: "Assessment tersedia di halaman Assessment: 7 pertanyaan (±3 menit), menghasilkan skor 0–100, level LOW/MEDIUM/HIGH, dan rekomendasi prioritas.",
    href: "/assessment",
    sensitivity: "public",
  },
  {
    id: "doc_tentang_kms",
    collection: "documents",
    title: "Tentang KMS Desa Digital Indonesia",
    text: "tentang kms desa digital indonesia katalog inovasi direktori desa inovator pengajuan adopsi assessment moderasi admin peran inovator desa admin",
    answer: "KMS Desa Digital Indonesia menyediakan katalog inovasi, direktori desa dan inovator, pengajuan adopsi, assessment kesiapan digital, serta moderasi admin. Peran yang tersedia: INNOVATOR, VILLAGE, dan ADMIN.",
    href: "/",
    sensitivity: "public",
  },
  {
    id: "doc_batasan",
    collection: "documents",
    title: "Batasan dan kebijakan chatbot KMS",
    text: "batasan cakupan chatbot abstain tidak ditemukan sumber keamanan data role privasi bukan keputusan resmi hubungi admin",
    answer: "Chatbot hanya menjawab seputar data KMS dan dokumen pendukung. Jika tidak ada sumber atau akses tidak sah, chatbot abstain dan tidak mengarang jawaban. Hubungi admin/pengelola KMS untuk data resmi.",
    href: "/",
    sensitivity: "public",
  },
];

export async function buildKnowledgeNodes(): Promise<KnowledgeNode[]> {
  const [innovations, villages, innovators, claims] = await Promise.all([
    listInnovations({ publishedOnly: true, perPage: 200 }),
    listVillages(),
    listInnovators(),
    listClaims(),
  ]);

  const innovationNodes: KnowledgeNode[] = innovations.items.map((i) => {
    const benefits = asText((i as Record<string, unknown>).benefits);
    const technology = asText((i as Record<string, unknown>).technology);
    const problem = asText((i as Record<string, unknown>).problem);
    const text = [
      i.title, i.shortDescription, i.description, i.categoryName, i.innovatorName,
      benefits, technology, problem,
    ].filter(Boolean).join(" ");
    return {
      id: `innovation:${i.id}`,
      collection: "innovations",
      title: i.title,
      text,
      answer: [i.shortDescription, benefits ? `Manfaat: ${benefits}` : ""].filter(Boolean).join(" "),
      href: `/innovations/${i.slug}`,
      sensitivity: "public",
    };
  });

  const villageNodes: KnowledgeNode[] = villages.map((v) => {
    const r = v as Record<string, unknown>;
    const potential = asText(r.potential);
    const infrastructure = asText(r.infrastructure);
    const text = [
      v.name, v.regency, v.province, v.district, asText(r.description),
      "potensi", potential, infrastructure, asText(r.digitalReadiness),
    ].filter(Boolean).join(" ");
    return {
      id: `village:${v.id}`,
      collection: "villages",
      title: v.name,
      text,
      answer: [asText(r.description), potential ? `Potensi: ${potential}` : ""].filter(Boolean).join(" "),
      href: `/villages/${v.id}`,
      sensitivity: "public",
    };
  });

  const innovatorNodes: KnowledgeNode[] = innovators.map((n) => {
    const text = [n.name, n.organization, n.bio, n.location].filter(Boolean).join(" ");
    return {
      id: `innovator:${n.id}`,
      collection: "innovators",
      title: n.name,
      text,
      answer: [n.organization, n.bio, n.location].filter(Boolean).join(" — "),
      href: `/innovators/${n.id}`,
      sensitivity: "public",
    };
  });

  const claimNodes: KnowledgeNode[] = claims.map((c) => {
    const text = ["pengajuan", "adopsi", c.innovationTitle, c.villageName, c.status, c.message, c.notes].filter(Boolean).join(" ");
    return {
      id: `claim:${c.id}`,
      collection: "claims",
      title: `${c.villageName} → ${c.innovationTitle}`,
      text,
      answer: `Status: ${c.status}${c.notes ? ` — ${c.notes}` : ""}`,
      href: "/dashboard/claims",
      sensitivity: "claim",
      villageName: c.villageName,
    };
  });

  return [...innovationNodes, ...villageNodes, ...innovatorNodes, ...claimNodes, ...DOCUMENTS];
}
