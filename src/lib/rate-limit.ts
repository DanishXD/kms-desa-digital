// Limiter fixed-window in-memory untuk mode demo/self-host.
// Di serverless (Vercel) memori bersifat per instance, jadi ini best-effort:
// instance lain dan cold start punya hitungan sendiri. Untuk jaminan lintas
// instance, ganti dengan penyimpanan bersama (Redis/Upstash).
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Detik sampai jendela berikutnya, untuk header Retry-After. */
  retryAfter: number;
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** IP klien dari header proxy; jatuh ke "unknown" bila tidak tersedia. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

/** Hanya untuk test: kosongkan semua bucket. */
export function resetRateLimits(): void {
  buckets.clear();
}
