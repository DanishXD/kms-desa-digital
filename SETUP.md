# SETUP

## Syarat

Node 24+ · npm · (opsional) MongoDB Atlas URI · (opsional) Google OAuth client.

## Dev (mode demo, tanpa DB)

```bash
cd WEBSITE
npm install
npm run dev
```

Buka http://localhost:3000. Banner kuning = mode demo (in-memory).

## Persisten (MongoDB Atlas)

1. Buat cluster gratis di https://cloud.mongodb.com → dapatkan connection string.
2. `copy .env.example .env`, isi `DATABASE_URL` dan `AUTH_SECRET` (`openssl rand -base64 32`).
3. `npm run db:push` (buat koleksi) → `npm run db:seed` (7 users, 3 inovator, 5 desa, 15 inovasi, 5 klaim, 7 pertanyaan).
4. `npm run dev`.

Reset data: `npm run db:reset`.

## Google OAuth (opsional)

1. https://console.cloud.google.com → Credentials → OAuth client (authorized redirect: `http://localhost:3000/api/auth/callback/google`).
2. Isi `GOOGLE_CLIENT_ID/SECRET` (+ `NEXT_PUBLIC_GOOGLE=1` untuk tampilkan tombol).
3. Restart dev server.

## Produksi (Vercel)

URL: https://kms-desa-digital.vercel.app

Set env di Vercel: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL=https://kms-desa-digital.vercel.app`.
Network Access Atlas: izinkan `0.0.0.0/0` (Vercel serverless).
Deploy: `vercel --prod` (atau push ke GitHub dengan CI).
Health check: `GET /api/health` (cron harian 03:00 UTC).
Smoke test: `npm run smoke`.
