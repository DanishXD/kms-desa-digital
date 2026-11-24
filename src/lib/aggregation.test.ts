import { describe, expect, it } from "vitest";
import { aggregateAnswer, type AggregateData } from "./aggregation";

const data: AggregateData = {
  innovations: [
    { title: "IrigasiKu", slug: "irigasiku", categoryName: "Smart Farming", status: "PUBLISHED", claimCount: 3 },
    { title: "Posyandu Antre", slug: "posyandu-antre", categoryName: "Social Service", status: "PUBLISHED", claimCount: 1 },
    { title: "Draf Rahasia", slug: "draf", categoryName: "Smart Farming", status: "DRAFT", claimCount: 0 },
  ],
  villages: [{ name: "Petir" }, { name: "Sembalun" }],
  innovators: [{ name: "A" }, { name: "B" }, { name: "C" }],
  claims: [
    { status: "APPROVED", villageName: "Petir", innovationTitle: "IrigasiKu" },
    { status: "PENDING", villageName: "Sembalun", innovationTitle: "Posyandu Antre" },
  ],
};

describe("aggregateAnswer", () => {
  it("menghitung total inovasi tayang tanpa menghitung draf", () => {
    const r = aggregateAnswer("berapa inovasi yang tayang?", data, "PUBLIC");
    expect(r?.status).toBe("found");
    expect(r?.reply).toContain("2 inovasi");
    expect(r?.retrieval.mode).toBe("deterministic-aggregate");
  });

  it("meranking kategori secara deterministik", () => {
    const r = aggregateAnswer("ranking kategori terbanyak", data, "KEMENTERIAN");
    expect(r?.reply).toContain("Smart Farming 1");
    expect(r?.reply).toContain("Social Service 1");
  });

  it("meranking adopsi dari jumlah klaim", () => {
    const r = aggregateAnswer("inovasi dengan adopsi terbanyak", data, "PUBLIC");
    expect(r?.reply).toContain("IrigasiKu (3)");
  });

  it("membatasi status klaim untuk peran non-privilese", () => {
    const pub = aggregateAnswer("jumlah pengajuan per status", data, "PUBLIC");
    expect(pub?.status).toBe("needs_permission");
    expect(pub?.abstained).toBe(true);
    const admin = aggregateAnswer("jumlah pengajuan per status", data, "ADMIN");
    expect(admin?.status).toBe("found");
    expect(admin?.reply).toContain("APPROVED 1");
  });

  it("menghitung jumlah desa dan inovator", () => {
    expect(aggregateAnswer("jumlah desa", data, "PUBLIC")?.reply).toContain("2 profil desa");
    expect(aggregateAnswer("berapa inovator", data, "PUBLIC")?.reply).toContain("3 profil inovator");
  });

  it("mengembalikan null untuk pertanyaan non-agregasi", () => {
    expect(aggregateAnswer("apa potensi Desa Petir?", data, "PUBLIC")).toBeNull();
  });
});
