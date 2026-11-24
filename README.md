# KMS Desa Digital Clone

Functional clone / reimplementation dari konsep **digidesa.tech** — Knowledge Management System
Desa Digital Indonesia: katalog inovasi desa, direktori desa & inovator, pengajuan adopsi,
assessment kesiapan digital, dan admin moderasi. Dibangun untuk mata kuliah PPKBP (edukasi).

Produksi: https://kms-desa-digital.vercel.app · Repo: https://github.com/DanishXD/kms-desa-digital

## Fitur

- **Public:** home + search, katalog inovasi (filter kategori/sort/pagination), detail inovasi,
  desa + detail adopsi, inovator + profil, assessment kesiapan digital (skor + rekomendasi),
  SEO (metadata/OG/sitemap/robots)
- **Chatbot RAG:** tanya-jawab bahasa alami — retrieval KMS (inovasi/desa/inovator/klaim) lebih dulu,
  dokumen pendukung sebagai fallback; role diambil dari sesi server (bukan body client), abstention di
  bawah threshold 0,6, sumber/tautan verifikasi, status keyakinan kualitatif, dan disclaimer Bab 10 laporan
- **Agregasi/peringkat:** pertanyaan "berapa/ranking/terbanyak" dijawab deterministik di server (intent
  allowlist, tanpa LLM/SQL bebas); ringkasan status klaim hanya ADMIN/KEMENTERIAN
- **Auth:** email+password (bcrypt) + Google OAuth opsional (Auth.js v5), role
  `INNOVATOR/VILLAGE/ADMIN/KEMENTERIAN`
- **Inovator:** dashboard, CRUD inovasi, submission tracker
- **Desa:** dashboard, ajukan adopsi, tracker + batalkan, riwayat assessment tersimpan
- **Kementerian:** dashboard baca-saja (agregat + inovasi terbaru)
- **Admin:** KPI, chart kategori/status, moderasi inovasi & klaim, audit log, analitik JSON
- **Notifikasi:** lonceng dengan unread count + tandai semua dibaca
- **Mode ganda:** MongoDB Atlas bila `DATABASE_URL` diisi, atau mode demo in-memory (reset tiap restart)
- **Operasional:** `/api/health`, cron harian, rate limit login/register/chat, password min 8

## Tech stack

Next.js 16.4.6 (App Router) · TypeScript · Tailwind v4 · Prisma 6 (MongoDB) · Auth.js v5 ·
Zod · bcryptjs · Recharts · Vitest. Unit test 50 lulus + smoke test produksi.

> **Catatan integritas:** retrieval chatbot ini leksikal deterministik (TF-IDF ringan) dan berjalan
> di dalam aplikasi. Ini **bukan** embedding `mxbai-embed-large`/Ollama dan **bukan** generator
> GPT-4o-mini/Qwen pada baseline RAGAS naskah penelitian. Angka RAGAS historis tidak diklaim
> sebagai hasil website ini. Lihat `src/lib/rag.ts`.

## Cara jalan cepat

```bash
copy .env.example .env   # opsional: isi DATABASE_URL + AUTH_SECRET
npm install
npm run dev              # http://localhost:3000  (langsung jalan tanpa DB = mode demo)
```

Mode persisten: isi `DATABASE_URL` (Atlas), lalu `npm run db:push && npm run db:seed`.
Reset data: `npm run db:reset`.

## Test & quality

```bash
npm test        # vitest (50 unit test)
npm run lint    # eslint src prisma
npx tsc --noEmit
npm run build
npm run smoke   # smoke test terhadap URL produksi
```

## Akun demo (seed)

| Email | Password | Role |
|---|---|---|
| admin@digidesa.id | admin123 | ADMIN → `/admin` |
| inovator@tani.id | inovator123 | INNOVATOR → `/dashboard` |
| inovator@desa.id | inovator123 | INNOVATOR → `/dashboard` |
| inovator@irigasi.id | inovator123 | INNOVATOR → `/dashboard` |
| desa@petir.id | desa123 | VILLAGE → `/dashboard` |
| desa@sembalun.id | desa123 | VILLAGE → `/dashboard` |
| kementerian@digidesa.id | kementerian123 | KEMENTERIAN → `/dashboard` |

Dokumen lain: `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SETUP.md`.
