# DATABASE (`prisma/schema.prisma`, provider MongoDB Atlas)

```
User (email unique, passwordHash?, role)
 ├── 1 Innovator (userId unique) ── N Innovation (innovatorId, categoryId, slug unique)
 │                                   └── N Claim
 └── 1 Village (userId unique) ─── N Claim (villageId, status, message, reviewedBy)
Category (slug unique) ── N Innovation
AssessmentQuestion (category, weight, order) · AssessmentResult (answers Json, score, level)
Notification (userId, type, read) · AuditLog (actorId, action, entity)
```

- Relasi via `@db.ObjectId`; integritas transisi dijaga di `store.ts`
  (`canTransitionInnovation/canTransitionClaim` di `lib/scoring.ts`, ada unit test).
- Enum status persis spec §6-7 (DRAFT…PUBLISHED / PENDING…CANCELLED).
- Seed: `prisma/seed.ts` ← `src/data/seed-data.ts` (6 users, termasuk akun Budi Santoso)
  (10 kategori, 6 users, 3 inovator, 5 desa, 15 inovasi, 5 klaim, 7 pertanyaan).
  Perintah: `npm run db:push && npm run db:seed`.
- Tanpa `DATABASE_URL`: app memakai replika in-memory dari dataset yang sama
  (lihat `buildMemory()` di `store.ts`) — skema tetap satu sumber kebenaran.
- MongoDB Atlas: isi `DATABASE_URL` dengan connection string cluster (Database → Connect →
  Connect your application). Di **Network Access**, izinkan `0.0.0.0/0` agar Vercel serverless
  bisa terhubung. Lalu jalankan: `npx prisma db push && npm run db:seed`.
- Seed memakai data **fiktif** (`src/data/seed-data.ts`) — tidak ada data pribadi asli.
