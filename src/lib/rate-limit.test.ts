import { beforeEach, describe, expect, it } from "vitest";
import { clientIp, rateLimit, resetRateLimits } from "./rate-limit";

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("mengizinkan sampai batas lalu menolak", () => {
    const start = 1_000_000;
    expect(rateLimit("k", 3, 60_000, start).ok).toBe(true);
    expect(rateLimit("k", 3, 60_000, start).ok).toBe(true);
    expect(rateLimit("k", 3, 60_000, start).ok).toBe(true);
    const blocked = rateLimit("k", 3, 60_000, start);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(60);
  });

  it("membuka blokir setelah jendela habis", () => {
    const start = 2_000_000;
    rateLimit("k", 1, 10_000, start);
    expect(rateLimit("k", 1, 10_000, start + 5_000).ok).toBe(false);
    expect(rateLimit("k", 1, 10_000, start + 10_000).ok).toBe(true);
  });

  it("memisahkan hitungan per key", () => {
    const start = 3_000_000;
    rateLimit("a", 1, 60_000, start);
    expect(rateLimit("b", 1, 60_000, start).ok).toBe(true);
    expect(rateLimit("a", 1, 60_000, start).ok).toBe(false);
  });

  it("menghitung retryAfter dari sisa jendela", () => {
    const start = 4_000_000;
    rateLimit("k", 1, 60_000, start);
    expect(rateLimit("k", 1, 60_000, start + 45_500).retryAfter).toBe(15);
  });
});

describe("clientIp", () => {
  it("memakai entri pertama x-forwarded-for", () => {
    const req = new Request("https://kms.example.id", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("jatuh ke x-real-ip", () => {
    const req = new Request("https://kms.example.id", { headers: { "x-real-ip": "198.51.100.2" } });
    expect(clientIp(req)).toBe("198.51.100.2");
  });

  it("memakai unknown tanpa header", () => {
    expect(clientIp(new Request("https://kms.example.id"))).toBe("unknown");
  });
});
