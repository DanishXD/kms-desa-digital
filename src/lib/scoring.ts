// Kalkulasi skor assessment — MURNI (tanpa I/O) agar mudah di-unit-test.
// Skala jawaban per pertanyaan: 0..4  (0=belum ada … 4=optimal/mandiri)

export type ReadinessLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ScoredResult {
  totalScore: number; // 0..100
  level: ReadinessLevel;
  interpretation: string;
  recommendations: { category: string; advice: string }[];
}

const ADVICE: Record<string, string> = {
  Infrastruktur: "Prioritaskan internet stabil balai desa dan 1 perangkat operasional sebelum adopsi aplikasi.",
  SDM: "Adakan pelatihan digital dasar untuk 2-3 perangkat desa (operator + cadangan).",
  Teknologi: "Bangun kanal informasi digital desa (website/media sosial aktif) sebagai fondasi.",
  "Literasi Digital": "Dorong transaksi digital warga via QRIS dan grup informasi resmi desa.",
  "Tata Kelola": "Rapikan basis data kependudukan digital (satu NIK satu data) terlebih dahulu.",
  Ekonomi: "Dorong 1-2 produk BUMDes/UMKM masuk katalog online sebelum adopsi lanjutan.",
};

export function calculateScore(
  answers: { questionId: string; category: string; value: number; weight: number }[],
): ScoredResult {
  let earned = 0;
  let max = 0;
  const weak = new Map<string, number>();
  for (const a of answers) {
    const v = Math.min(4, Math.max(0, a.value));
    earned += v * a.weight;
    max += 4 * a.weight;
    if (v <= 1) weak.set(a.category, (weak.get(a.category) ?? 0) + 1);
  }
  const totalScore = max === 0 ? 0 : Math.round((earned / max) * 100);
  const level: ReadinessLevel = totalScore >= 70 ? "HIGH" : totalScore >= 40 ? "MEDIUM" : "LOW";
  const interpretation =
    level === "HIGH"
      ? "Desa siap mengadopsi inovasi digital lanjutan dan menjadi percontoh."
      : level === "MEDIUM"
        ? "Fondasi digital cukup — mulai dari 1-2 inovasi prioritas sambil perkuat area lemah."
        : "Fokus pada fondasi (internet, SDM, data) sebelum adopsi inovasi kompleks.";
  const recommendations = [...weak.keys()].map((category) => ({
    category,
    advice: ADVICE[category] ?? "Perkuat area ini secara bertahap.",
  }));
  return { totalScore, level, interpretation, recommendations };
}

// Guard transisi status — dipakai server & unit-test (permission checks §31).
const INNOVATION_FLOW: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "DRAFT"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "REVISION_REQUIRED"],
  REVISION_REQUIRED: ["SUBMITTED", "DRAFT"],
  APPROVED: ["PUBLISHED"],
  REJECTED: ["DRAFT"],
  PUBLISHED: [],
};
export function canTransitionInnovation(from: string, to: string): boolean {
  return INNOVATION_FLOW[from]?.includes(to) ?? false;
}

const CLAIM_FLOW: Record<string, string[]> = {
  PENDING: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};
export function canTransitionClaim(from: string, to: string): boolean {
  return CLAIM_FLOW[from]?.includes(to) ?? false;
}
