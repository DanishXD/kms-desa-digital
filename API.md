# API

Semua Route Handler tipis — logika di `src/server/store.ts`, validasi Zod di `src/lib/validation.ts`.
Auth via `auth()` server-side; role TIDAK dipercaya dari client.

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/register` | publik | body: name, email, password (min 8), role (INNOVATOR/VILLAGE). Rate limit 5/jam/IP |
| GET | `/api/auth/[...nextauth]` | publik | Auth.js (credentials + google bila env ada). Login 20 percobaan/10 menit/IP+email |
| GET | `/api/innovations?q&category&sort&page&perPage&all` | publik | `all=1` + filter `status` hanya untuk ADMIN; pengunjung selalu PUBLISHED |
| POST | `/api/innovations` | INNOVATOR | buat draf (Zod `innovationSchema`) |
| PATCH | `/api/innovations` | pemilik/ADMIN | `{id, status?, ...fields}` — transisi divalidasi |
| GET/POST/PATCH | `/api/claims` | login | GET dibatasi role: ADMIN semua; VILLAGE miliknya; INNOVATOR inovasinya. Desa ajukan; admin moderasi |
| GET/POST | `/api/assessment` | publik | POST `{answers[]}` → `{totalScore, level, interpretation, recommendations, saved, assessmentId}`. Disimpan bila akun desa |
| POST | `/api/chat` | publik (role dari sesi) | `{message, history?}` → jawaban RAG + sumber + status. Rate limit 30/menit/IP |
| GET/PATCH | `/api/notifications` | login | daftar (20 terbaru) + unread; PATCH tandai semua dibaca |
| GET | `/api/health` | publik | `{ok, mode}`. Cron harian |
| GET | `/api/admin/analytics` | ADMIN | `{stats, charts, activity}` |

### `/api/chat` — chatbot RAG

Request:
```json
{ "message": "apa potensi Desa Petir?", "history": [{ "from": "user", "text": "..." }] }
```
- `message` dipotong 500 karakter; `history` maksimal 6 pesan.
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
  "retrieval": { "mode": "lexical-tfidf", "threshold": 0.6, "topK": 3, "scanned": 30, "byCollection": {} }
}
```
`score` pada sumber hanya untuk audit internal — UI **tidak** menampilkannya sebagai confidence.
Retrieval memakai 4 koleksi KMS sebagai prioritas dan dokumen pendukung website sebagai fallback.
Implementasi leksikal, bukan embedding/generator naskah.

Pertanyaan agregasi ("berapa inovasi", "ranking kategori", "adopsi terbanyak", "jumlah desa/inovator")
dijawab lewat `retrieval.mode = "deterministic-aggregate"` — dihitung di server dari data katalog,
tanpa LLM/SQL bebas. Ringkasan status klaim hanya untuk `ADMIN`/`KEMENTERIAN`; role lain mendapat
`status: "needs_permission"`.
