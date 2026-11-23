import { describe, expect, it } from "vitest";
import { calculateScore, canTransitionClaim, canTransitionInnovation } from "./scoring";

describe("calculateScore", () => {
  const qs = [
    { questionId: "q1", category: "Infrastruktur", value: 4, weight: 1 },
    { questionId: "q2", category: "SDM", value: 4, weight: 1 },
  ];
  it("skor sempurna → 100 HIGH", () => {
    const r = calculateScore(qs);
    expect(r.totalScore).toBe(100);
    expect(r.level).toBe("HIGH");
  });
  it("semua nol → 0 LOW + rekomendasi", () => {
    const r = calculateScore(qs.map((q) => ({ ...q, value: 0 })));
    expect(r.totalScore).toBe(0);
    expect(r.level).toBe("LOW");
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
  it("nilai tengah → MEDIUM", () => {
    const r = calculateScore(qs.map((q) => ({ ...q, value: 2 })));
    expect(r.totalScore).toBe(50);
    expect(r.level).toBe("MEDIUM");
  });
  it("clamp value di luar 0..4", () => {
    const r = calculateScore([{ questionId: "q", category: "SDM", value: 99, weight: 1 }]);
    expect(r.totalScore).toBe(100);
  });
});

describe("status transitions", () => {
  it("innovation flow valid", () => {
    expect(canTransitionInnovation("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionInnovation("DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransitionInnovation("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionInnovation("PUBLISHED", "DRAFT")).toBe(false);
  });
  it("claim flow valid", () => {
    expect(canTransitionClaim("PENDING", "REVIEWING")).toBe(true);
    expect(canTransitionClaim("PENDING", "APPROVED")).toBe(false);
    expect(canTransitionClaim("REVIEWING", "APPROVED")).toBe(true);
  });
});
