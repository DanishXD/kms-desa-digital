# DATABASE (`prisma/schema.prisma`, provider MongoDB Atlas)

```
User (email unique, passwordHash?, role incl. KEMENTERIAN)
 ├── 1 Innovator (userId unique) ── N Innovation (innovatorId, categoryId, slug unique)
 │                                   └── N Claim
 └── 1 Village (userId unique) ─── N Claim (villageId, status, message, reviewedBy)
Category (slug unique) ── N Innovation
AssessmentQuestion · AssessmentResult (answers Json, score, level, villageId)
Notification (userId, type, read) · AuditLog (actorId, action, entity)
```

- Relasi via `@db.ObjectId`; integritas transisi di `store.ts`.
- Enum status persis spec §6-7.
- Seed: `prisma/seed.ts` ← `src/data/seed-data.ts` (7 users, 3 inovator, 5 desa, 15 inovasi, 5 klaim, 7 pertanyaan).
  Perintah: `npm run db:push && npm run db:seed` (reset: `npm run db:reset`).
- Tanpa `DATABASE_URL`: app memakai replika in-memory dari dataset yang sama.
- MongoDB Atlas: isi `DATABASE_URL`. Network Access: izinkan `0.0.0.0/0` agar Vercel terhubung.
- Seed memakai data **fiktif** — tidak ada data pribadi asli.
- `AssessmentResult` dan `Notification` kini dipakai (riwayat assessment + lonceng).
- `AssessmentResult`, `Notification`, `AuditLog` dibersihkan saat seed.
