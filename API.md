# API

Semua Route Handler tipis — logika di `src/server/store.ts`, validasi Zod di `src/lib/validation.ts`.
Auth via `auth()` server-side; role TIDAK dipercaya dari client.

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/register` | publik | body: name, email, password, role (INNOVATOR/VILLAGE) |
| GET | `/api/auth/[...nextauth]` | publik | Auth.js (credentials + google bila env ada) |
| GET | `/api/innovations?q&category&sort&page&all` | publik | `all=1` = semua status (dipakai dashboard/admin) |
| POST | `/api/innovations` | INNOVATOR | buat draf (Zod `innovationSchema`) |
| PATCH | `/api/innovations` | pemilik/ADMIN | `{id, status?, ...fields}` — transisi divalidasi |
| GET/POST/PATCH | `/api/claims` | login | desa: ajukan; admin: `REVIEWING/APPROVED/REJECTED`; pemilik/admin: `CANCELLED` |
| GET/POST | `/api/assessment` | publik | POST `{answers[]}` → `{totalScore, level, interpretation, recommendations}` |
| POST | `/api/chat` | publik (role dari sesi) | `{message, history?}` → jawaban RAG + sumber + status; lihat bawah |
| GET | `/api/admin/analytics` | ADMIN | `{stats, charts, activity}` |

### `/api/chat` — chatbot RAG

Request:
```json
{ "message": "apa potensi Desa Petir?", "history": [{ "from": "user", "text": "..." }] }
```
- `message` dipotong 500 karakter; `history` maksimal 6 pesan (resolusi follow-up).
- Role **tidak** diterima dari body — selalu dibaca dari `auth()` di server.

Response:
```json
{
  "reply": "Berdasarkan data KMS yang ditemukan: …",
  "answer": "…",
  "status": "found | limited | not_found | out_of_scope | needs_permission | needs_clarification",
  "abstained": false,
  "sources": [{ "title": "…", "collection": "villages", "href": "/villages/…", "snippet": "…", "score": 0.8 }],
  "suggestions": ["…"],
  "scopeNote": "…",
  "disclaimer": "…",
  "role": "PUBLIC | INNOVATOR | VILLAGE | ADMIN | KEMENTERIAN",
  "retrieval": { "mode": "lexical-tfidf", "threshold": 0.6, "topK": 3, "scanned": 27, "byCollection": {} }
}
```
`score` pada sumber hanya untuk audit internal — UI **tidak** menampilkannya sebagai confidence
karena belum terkalibrasi (Bab 6.4 laporan). Retrieval memakai 4 koleksi KMS sebagai prioritas dan
dokumen pendukung website sebagai fallback. Implementasi leksikal, bukan embedding/generator naskah.

Contoh assessment:

```bash
curl -X POST localhost:3000/api/assessment -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"q_seed_0","value":3}]}'
```
