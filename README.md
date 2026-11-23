# KMS Desa Digital Clone

Functional clone / reimplementation dari konsep **digidesa.tech** — Knowledge Management System
Desa Digital Indonesia: katalog inovasi desa, direktori desa & inovator, pengajuan adopsi,
assessment kesiapan digital, dan admin moderasi. Dibangun untuk mata kuliah PPKBP (edukasi).

## Fitur

- **Public:** home + search, katalog inovasi (filter kategori/sort/pagination), detail inovasi,
  desa + detail adopsi, inovator + profil, assessment kesiapan digital (skor + rekomendasi), SEO (metadata/OG/sitemap/robots)
- **Chatbot RAG:** tanya-jawab bahasa alami — retrieval KMS (inovasi/desa/inovator/klaim) lebih dulu, dokumen pendukung sebagai fallback; role diambil dari sesi server (bukan body client), abstention di bawah threshold 0,6, sumber/tautan verifikasi, status keyakinan kualitatif (ditemukan/terbatas/tidak ditemukan), dan disclaimer Bab 10 laporan
- **Auth:** email+password (bcrypt) + Google OAuth opsional (Auth.js v5), role `INNOVATOR/VILLAGE/ADMIN`
- **Inovator:** dashboard, CRUD inovasi, submission tracker (`DRAFT→SUBMITTED→UNDER_REVIEW→APPROVED→PUBLISHED`, revisi/ditolak)
- **Desa:** dashboard, ajukan adopsi (`PENDING→REVIEWING→APPROVED/REJECTED`), tracker + batalkan
- **Admin:** KPI, chart kategori/status, moderasi inovasi & klaim, audit log, analitik JSON
- **Mode ganda:** MongoDB Atlas bila `DATABASE_URL` diisi, atau **mode demo in-memory** (data seed, reset tiap restart)

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 (MongoDB) · Auth.js v5 ·
Zod · bcryptjs · Recharts · Vitest. Skills: ui-ux-pro-max, superpowers, ponytail, taste-skill, caveman, agent-skills, mattpocock/skills.

> **Catatan integritas:** retrieval chatbot ini leksikal deterministik (TF-IDF ringan) dan berjalan
> di dalam aplikasi. Ini **bukan** embedding `mxbai-embed-large`/Ollama dan **bukan** generator
> GPT-4o-mini/Qwen pada baseline RAGAS naskah penelitian. Angka RAGAS historis tidak diklaim
> sebagai hasil website ini; provider/model final belum ditetapkan. Lihat `src/lib/rag.ts`.

## Cara jalan cepat

```bash
copy .env.example .env   # opsional: isi DATABASE_URL + AUTH_SECRET
npm install
npm run dev              # http://localhost:3000  (langsung jalan tanpa DB = mode demo)
```

Mode persisten: isi `DATABASE_URL` (Atlas), lalu `npm run db:push && npm run db:seed`.

## Test & quality

```bash
npm test        # vitest (scoring, status transitions, retrieval RAG)
npm run lint    # eslint src prisma
npx tsc --noEmit
npm run build
```

## Akun demo (seed)

| Email | Password | Role |
|---|---|---|
| admin@digidesa.id | admin123 | ADMIN → `/admin` |
| inovator@tani.id | inovator123 | INNOVATOR → `/dashboard` |
| desa@petir.id | desa123 | VILLAGE → `/dashboard` |

Dokumen lain: `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SETUP.md`.
