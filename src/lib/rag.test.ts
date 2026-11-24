import { describe, expect, it } from "vitest";
import {
  canAccess,
  retrieve,
  roleFromSession,
  tokenize,
  type KnowledgeNode,
} from "./rag";

const nodes: KnowledgeNode[] = [
  {
    id: "innovation:1",
    collection: "innovations",
    title: "IrigasiKu Berbasis IoT",
    text: "IrigasiKu Berbasis IoT jadwal irigasi otomatis kelembapan tanah Hemat air 30-40% hasil panen naik",
    answer: "Jadwal irigasi otomatis berbasis kelembapan tanah. Manfaat: Hemat air 30-40%.",
    href: "/innovations/irigasiku-iot",
    sensitivity: "public",
  },
  {
    id: "village:1",
    collection: "villages",
    title: "Desa Petir",
    text: "Desa Petir Kabupaten Bogor Jawa Barat pertanian UMKM pariwisata desa BUMDes aktif",
    answer: "Desa pertanian padi dan palawija dengan BUMDes aktif. Potensi: pertanian, UMKM, pariwisata desa.",
    href: "/villages/v_seed_0",
    sensitivity: "public",
  },
  {
    id: "claim:1",
    collection: "claims",
    title: "Desa Petir → IrigasiKu Berbasis IoT",
    text: "Desa Petir IrigasiKu Berbasis IoT APPROVED jadwal survei 12 Okt pengajuan adopsi",
    answer: "Status: APPROVED — jadwal survei 12 Okt.",
    href: "/dashboard/claims",
    sensitivity: "claim",
    villageName: "Desa Petir",
  },
  {
    id: "doc_assessment",
    collection: "documents",
    title: "Assessment kesiapan digital desa",
    text: "assessment kesiapan digital skor level LOW MEDIUM HIGH rekomendasi prioritas tujuh pertanyaan",
    answer: "7 pertanyaan, skor 0-100, level LOW/MEDIUM/HIGH, dan rekomendasi prioritas.",
    href: "/assessment",
    sensitivity: "public",
  },
  {
    id: "doc_tentang_kms",
    collection: "documents",
    title: "Tentang KMS Desa Digital Indonesia",
    text: "apa itu kms desa digital indonesia pengertian definisi katalog inovasi direktori desa inovator adopsi assessment",
    answer: "KMS adalah sistem manajemen pengetahuan desa.",
    href: "/",
    sensitivity: "public",
  },
];

describe("tokenize", () => {
  it("membuang stopword dan menormalkan huruf", () => {
    expect(tokenize("Bagaimana CARA Adopsi di Desa Petir?")).toEqual(["adopsi", "petir"]);
  });
});

describe("roleFromSession", () => {
  it("role tak dikenal menjadi PUBLIC", () => {
    expect(roleFromSession(undefined)).toBe("PUBLIC");
    expect(roleFromSession("MANAGER")).toBe("PUBLIC");
  });
  it("menerima role yang dikenal", () => {
    expect(roleFromSession("ADMIN")).toBe("ADMIN");
    expect(roleFromSession("KEMENTERIAN")).toBe("KEMENTERIAN");
  });
});

describe("canAccess", () => {
  const claim = nodes.find((n) => n.id === "claim:1")!;
  it("PUBLIC dan INNOVATOR tidak boleh melihat klaim", () => {
    expect(canAccess({ role: "PUBLIC" }, claim)).toBe(false);
    expect(canAccess({ role: "INNOVATOR" }, claim)).toBe(false);
  });
  it("ADMIN boleh; VILLAGE hanya klaim desanya sendiri", () => {
    expect(canAccess({ role: "ADMIN" }, claim)).toBe(true);
    expect(canAccess({ role: "VILLAGE", villageName: "Desa Petir" }, claim)).toBe(true);
    expect(canAccess({ role: "VILLAGE", villageName: "Desa Sembalun" }, claim)).toBe(false);
  });
});

describe("retrieve", () => {
  it("KMS lebih dulu untuk kueri inovasi", () => {
    const r = retrieve({ role: "PUBLIC" }, "irigasi hemat air", nodes);
    expect(r.status).toBe("found");
    expect(r.abstained).toBe(false);
    expect(r.sources[0].collection).toBe("innovations");
    expect(r.sources[0].href).toBe("/innovations/irigasiku-iot");
  });

  it("fallback dokumen bila KMS tidak cocok", () => {
    const r = retrieve({ role: "PUBLIC" }, "assessment kesiapan digital", nodes);
    expect(r.status).toBe("found");
    expect(r.sources[0].collection).toBe("documents");
    expect(r.scopeNote).toContain("Fallback dokumen");
  });

  it("memilih dokumen definisi untuk pertanyaan meta, bukan entitas yang kebetulan cocok", () => {
    const r = retrieve({ role: "PUBLIC" }, "Apa itu KMS Desa Digital?", nodes);
    expect(r.status).toBe("found");
    expect(r.sources[0].collection).toBe("documents");
    expect(r.sources[0].title).toContain("KMS Desa Digital");
  });

  it("abstain untuk pertanyaan di luar domain", () => {
    const r = retrieve({ role: "PUBLIC" }, "prakiraan cuaca besok", nodes);
    expect(r.status).toBe("out_of_scope");
    expect(r.abstained).toBe(true);
    expect(r.sources).toEqual([]);
  });

  it("abstain untuk agregasi/peringkat tanpa mengarang angka", () => {
    const r = retrieve({ role: "PUBLIC" }, "desa mana yang terbaik?", nodes);
    expect(r.status).toBe("limited");
    expect(r.abstained).toBe(true);
    expect(r.reply).toContain("belum didukung");
  });

  it("menolak klaim untuk role tanpa izin sebelum menjawab", () => {
    const r = retrieve({ role: "PUBLIC" }, "pengajuan adopsi Desa Petir IrigasiKu", nodes);
    expect(r.status).toBe("needs_permission");
    expect(r.sources).toEqual([]);
  });

  it("ADMIN mendapat jawaban klaim yang sama", () => {
    const r = retrieve({ role: "ADMIN" }, "pengajuan adopsi Desa Petir IrigasiKu", nodes);
    expect(r.status).toBe("found");
    expect(r.sources.some((s) => s.collection === "claims")).toBe(true);
  });

  it("meminta klarifikasi untuk input kosong", () => {
    const r = retrieve({ role: "PUBLIC" }, "", nodes);
    expect(r.status).toBe("needs_clarification");
  });

  it("menyertakan metadata retrieval untuk audit", () => {
    const r = retrieve({ role: "PUBLIC" }, "irigasi hemat air", nodes);
    expect(r.retrieval.mode).toBe("lexical-tfidf");
    expect(r.retrieval.threshold).toBe(0.6);
    expect(r.retrieval.topK).toBe(3);
    expect(r.retrieval.scanned).toBe(nodes.length);
  });
});
