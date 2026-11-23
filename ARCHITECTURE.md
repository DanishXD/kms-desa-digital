# ARCHITECTURE

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home (hero, search, featured, CTA)
│   ├── innovations/        # list + [slug] detail + ClaimBox
│   ├── villages/ innovators/ assessment/ login/ register/
│   ├── dashboard/          # guard role INNOVATOR/VILLAGE/KEMENTERIAN
│   │   ├── innovations/new| [id]   # CRUD + SubmitBar (transisi status)
│   │   └── claims/         # tracker desa + batalkan
│   ├── admin/              # guard ADMIN: KPI + Charts + moderasi
│   ├── api/                # Route Handlers tipis → server/store.ts
│   │   ├── chat/route.ts   # RAG: sesi server → buildKnowledgeNodes → retrieve
│   │   ├── claims/         # baca dibatasi role
│   │   ├── notifications/  # GET/PATCH
│   │   └── health/         # GET + cron
│   ├── error.tsx loading.tsx
│   ├── sitemap.ts robots.ts
├── components/             # layout (Navbar + NotificationBell), ui, cards,
│                           # search-filter, claim-box, innovation-form,
│                           # assessment-wizard, charts, moderate, actions,
│                           # chat-fab (sumber/status/abstain/disclaimer)
├── server/store.ts         # SATU repository: Prisma bila DATABASE_URL ada,
│                           # fallback memori (seed-data) bila tidak.
│                           # Business rules (§32) + guard transisi di sini.
├── server/rag-source.ts    # korpus RAG: 4 koleksi KMS + dokumen pendukung website
├── lib/                    # scoring.ts, validation.ts (Zod), utils.ts,
│                           # access.ts (claimFilterFor, canListAllInnovations),
│                           # rate-limit.ts, site.ts, rag.ts, unit tests
├── data/seed-data.ts       # dataset fiktif ID (dipakai seed + mode demo)
├── auth.ts                 # Auth.js v5: Credentials (rate limit) + Google opsional, JWT
└── middleware              # tidak dipakai — guard via auth() di layout/page/API
```

## Keputusan penting

- **Tanpa middleware file**: guard di server (`auth()` + redirect + 401/403).
- **JWT session tanpa adapter DB**: login tetap jalan dalam mode demo.
- **Store ganda**: satu interface, dua backend. Mode demo = baca dari seed, tulis ke memori.
- **Design**: token brand hijau civic via `@theme` Tailwind v4.
- **Chatbot RAG** (selaras Laporan Akhir): `src/lib/rag.ts` murni — retrieval KMS lebih dulu,
  dokumen pendukung sebagai fallback, threshold 0,6 / top-k 3, filter role + abstention sebelum
  generation, sumber/tautan, status keyakinan kualitatif. Role berasal dari `auth()`.
  Retrieval leksikal deterministik — jangan diklaim sebagai embedding mxbai/Ollama atau generator.
- **Akses data**: `claimFilterFor` + `listClaimsForUser` memastikan klaim hanya terbaca sesuai role.
- **Rate limit**: in-memory fixed window (best-effort di serverless).
- **Vitest** dibatasi ke `src/**/*.test.ts` via `vitest.config.mjs`.
- **SEO**: `siteUrl()` resolve origin dari env/Vercel/localhost.
- **Deploy**: Vercel + MongoDB Atlas, cron health harian, smoke test.
