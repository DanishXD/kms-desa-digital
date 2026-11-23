# ARCHITECTURE

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home (hero, search, featured, CTA)
│   ├── innovations/        # list + [slug] detail + ClaimBox
│   ├── villages/ innovators/ assessment/ login/ register/
│   ├── dashboard/          # guard role INNOVATOR/VILLAGE
│   │   ├── innovations/new| [id]   # CRUD + SubmitBar (transisi status)
│   │   └── claims/         # tracker desa + batalkan
│   ├── admin/              # guard ADMIN: KPI + Charts + moderasi
│   └── api/                # Route Handlers tipis → server/store.ts
│       └── chat/route.ts   # RAG: sesi server → buildKnowledgeNodes → retrieve
├── components/             # layout, ui (Badge/Stat/Empty...), cards,
│                           # search-filter, claim-box, innovation-form,
│                           # assessment-wizard, charts, moderate, actions,
│                           # chat-fab (sumber/status/abstain/disclaimer)
├── server/store.ts         # SATU repository: Prisma bila DATABASE_URL ada,
│                           # fallback memori (seed-data) bila tidak.
│                           # Business rules (§32) + guard transisi di sini.
├── server/rag-source.ts    # korpus RAG: 4 koleksi KMS + dokumen pendukung website
├── lib/                    # scoring.ts (murni, testable), validation.ts (Zod),
│                           # utils.ts, scoring.test.ts,
│                           # rag.ts (retrieval/policy murni), rag.test.ts
├── data/seed-data.ts       # dataset fiktif ID (dipakai seed + mode demo)
├── auth.ts                 # Auth.js v5: Credentials + Google opsional, JWT
└── middleware              # tidak dipakai — guard via auth() di layout/page/API
```

## Keputusan penting

- **Tanpa middleware file**: guard di server (`auth()` + redirect + 401/403) — bebas risiko
  perubahan konvensi middleware Next 16, dan sesuai §21 (otorisasi server-side).
- **JWT session tanpa adapter DB**: login tetap jalan dalam mode demo; Google OAuth
  aktif bila env diisi.
- **Store ganda**: satu interface, dua backend. Mode demo = baca dari seed, tulis ke memori
  (notifikasi + audit ikut jalan) — seluruh flow E2E bisa diuji tanpa Atlas.
- **Design**: token brand hijau civic (`--color-brand-*`, bg `#EEF8F4`) via `@theme` Tailwind v4,
  mengikuti observasi referensi (Inter, hijau `#347357`, aksen kuning).
- **Chatbot RAG** (selaras Laporan Akhir): `src/lib/rag.ts` murni — retrieval KMS lebih dulu,
  dokumen pendukung sebagai fallback, threshold 0,6 / top-k 3, filter role + abstention sebelum
  generation, sumber/tautan, dan status keyakinan kualitatif tanpa confidence numerik. Role berasal
  dari `auth()`; klaim/PII ditolak di server. Retrieval bersifat leksikal deterministik — jangan
  diklaim sebagai embedding mxbai/Ollama atau generator GPT-4o-mini/Qwen pada naskah riset.
- **Vitest** dibatasi ke `src/**/*.test.ts` via `vitest.config.mjs` agar file `.test.mjs` pada skill
  (`.agents/`, `.claude/`) tidak membuat `npm test` gagal.
