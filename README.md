# GymFit

Aplikasi gym + personal trainer (membership, booking PT, program latihan, pola makan).

| Folder | Isi | Teknologi |
|---|---|---|
| `mobile/` | Aplikasi Member / PT / Admin | Flutter |
| `admin-web/` | Website pemilik gym (landing, daftar gym, dashboard admin) | React + Vite + TypeScript |
| `backend/` | REST API, login, booking, membership | NestJS + Prisma 7 + PostgreSQL (Supabase) |
| `docs/` | Dokumentasi | Markdown |

## Mulai cepat
1. Backend: `cd backend && npm install && cp .env.example .env && npm run setup && npm run start:dev`
2. Mobile: `cd mobile && flutter pub get && flutter run`

Detail ada di `docs/setup-guide.md`.


## Docker
Lihat `docs/docker-deploy.md` (pengembangan dan production di satu VPS) dan `docs/entities.md` (entitas + ERD).
