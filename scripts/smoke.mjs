#!/usr/bin/env node
/**
 * Smoke test end-to-end terhadap aplikasi yang sudah di-deploy.
 * Pemakaian: node scripts/smoke.mjs [baseUrl]
 * Default: https://kms-desa-digital.vercel.app
 */
const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "https://kms-desa-digital.vercel.app").replace(/\/$/, "");

let failed = 0;
async function check(name, fn) {
  try {
    const detail = await fn();
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${name} — ${err instanceof Error ? err.message : String(err)}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function get(path, init) {
  const res = await fetch(base + path, { redirect: "manual", ...init });
  return res;
}

await check("home 200", async () => {
  const res = await get("/");
  assert(res.status === 200, `status ${res.status}`);
  const html = await res.text();
  assert(html.includes("KMS Desa Digital"), "judul tidak ditemukan");
  return "200";
});

await check("katalog hanya PUBLISHED", async () => {
  const res = await get("/api/innovations?perPage=50");
  assert(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  assert(body.total >= 1, "katalog kosong");
  const statuses = [...new Set(body.items.map((i) => i.status))];
  assert(statuses.length === 1 && statuses[0] === "PUBLISHED", `status bocor: ${statuses.join(",")}`);
  return `${body.items.length}/${body.total} item`;
});

await check("all=1 tidak membocorkan draf ke publik", async () => {
  const res = await get("/api/innovations?all=1&perPage=50");
  assert(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  const drafts = body.items.filter((i) => i.status !== "PUBLISHED").length;
  assert(drafts === 0, `${drafts} non-PUBLISHED terlihat`);
  return "0 draf";
});

await check("chat RAG menemukan sumber", async () => {
  const res = await get("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "irigasi hemat air" }),
  });
  assert(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  assert(body.status === "found", `status ${body.status}`);
  assert(Array.isArray(body.sources) && body.sources.length > 0, "tanpa sumber");
  assert(body.retrieval?.mode === "lexical-tfidf", "mode retrieval tak dikenal");
  return `${body.sources.length} sumber, scanned ${body.retrieval.scanned}`;
});

await check("chat abstain di luar domain", async () => {
  const res = await get("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "siapa presiden zimbabwe" }),
  });
  assert(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  assert(body.abstained === true || body.status !== "found", `tidak abstain: ${body.status}`);
  return body.status;
});

await check("sitemap memakai origin produksi", async () => {
  const res = await get("/sitemap.xml");
  assert(res.status === 200, `status ${res.status}`);
  const xml = await res.text();
  assert(!xml.includes("localhost"), "sitemap masih localhost");
  assert(xml.includes(base), `origin ${base} tidak ada`);
  return "origin benar";
});

await check("health check", async () => {
  const res = await get("/api/health");
  assert(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  assert(body.ok === true, "ok bukan true");
  return body.mode;
});

console.log(failed === 0 ? "\nSmoke test lulus." : `\n${failed} smoke test gagal.`);
process.exit(failed === 0 ? 0 : 1);
