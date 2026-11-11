# Migrasi SQLite -> PostgreSQL (Supabase)

Arsitektur tidak berubah. Hanya database yang diganti:

```
Flutter Mobile ──REST──┐
                       ├──> NestJS Backend ──Prisma 7──> Supabase PostgreSQL
React Admin Website ───┘
```

NestJS tetap backend utama. Flutter dan website admin tidak memakai Supabase Client; keduanya
hanya memanggil API NestJS. Semua endpoint, DTO, controller, service, guard, dan JWT tidak berubah.

## 1. Audit & risiko yang ditemukan

| # | Temuan | Penanganan |
|---|--------|-----------|
| 1 | `schema.prisma`, `prisma.service.ts`, `prisma.config.ts`, `database.config.ts`, `.env.example`, `seed.ts` memakai SQLite | Semua diganti ke PostgreSQL (`@prisma/adapter-pg`) |
| 2 | Pencarian gym/PT memakai `contains`. SQLite tidak membedakan huruf besar/kecil, PostgreSQL membedakan | Ditambah `mode: 'insensitive'` di `gyms.service.ts` dan `trainers.service.ts` |
| 3 | PostgreSQL tidak membuat index otomatis untuk foreign key | Ditambah `@@index` pada kolom FK yang dipakai query |
| 4 | Tipe schema (String, Int, Float, Boolean, DateTime) | Semua kompatibel, tanpa enum/Json/BigInt. Tidak ada raw query selain `SELECT 1` (health check) |
| 5 | `seed.ts` menghapus semua data, berbahaya di database online | Seed menolak jalan bila sudah ada akun, kecuali `SEED_RESET=true` |
| 6 | Foto upload disimpan di disk lokal (hilang di hosting ephemeral) | Driver `UPLOAD_DRIVER=supabase` (Supabase Storage), default tetap `local` |
| 7 | `app.enableCors()` terbuka untuk semua origin | Dibatasi lewat `CORS_ORIGINS` |
| 8 | JWT secret punya nilai bawaan | Production menolak start bila `JWT_SECRET` kosong/bawaan/pendek |
| 9 | Tes e2e memakai SQLite + `test-schema.sql` yang sudah usang (belum memuat tabel `SessionPackage`, `WorkoutPlanItem`, dst.) | Tes dipindah ke schema PostgreSQL sementara yang dibuat dari migration asli; `test-schema.sql` dihapus |
| 10 | Satu tes lama masih mengharapkan booking PT tanpa membership ditolak (aturan sudah dihapus sebelumnya) | Tes diperbarui |
| 11 | `package-lock.json` | **Tidak bisa diperbarui dari lingkungan saya (tanpa internet).** Jalankan `npm install` sekali |

## 2. File yang berubah

Backend:
- `prisma/schema.prisma` provider `postgresql` dan index FK
- `prisma/migrations/20261102000000_init/migration.sql` dan `prisma/migrations/migration_lock.toml` (baru)
- `prisma.config.ts` memakai `DIRECT_URL` (fallback `DATABASE_URL`), tanpa fallback SQLite
- `src/database/prisma/pg-adapter.ts` (baru): adapter PostgreSQL bersama (SSL, pool, schema)
- `src/database/prisma/prisma.service.ts` memakai adapter PostgreSQL
- `src/config/database.config.ts`, `.env.example`, `.gitignore`
- `prisma/seed.ts` adapter baru dan pengaman data
- `src/modules/gyms/gyms.service.ts`, `src/modules/trainers/trainers.service.ts` pencarian case-insensitive
- `src/common/utils/upload.ts`, `modules/admin/admin.service.ts`, `modules/gym-applications/gym-applications.service.ts` upload via Supabase Storage (opsional)
- `src/main.ts` CORS, port, trust proxy, validasi production, shutdown hook
- `scripts/migrate-sqlite-to-postgres.ts` (baru): pemindahan data
- `test/*.e2e-spec.ts`, `test/helpers/test-db.ts` (baru); `test/test-schema.sql` dihapus
- `package.json` dependency dan script

Tidak berubah: seluruh DTO, controller, service (selain dua pencarian di atas), module, guard, decorator,
auth/JWT, endpoint API, `admin-web`, `mobile`.

## 3. Dependency

Ditambah: `@prisma/adapter-pg`, `pg`, `@types/pg` (dev).
Dihapus: `@prisma/adapter-better-sqlite3`, `better-sqlite3`, `@types/better-sqlite3`.

`better-sqlite3` hanya dibutuhkan skrip pemindahan data sekali jalan dan dipasang sementara dengan
`npm install --no-save better-sqlite3` (tidak masuk `package.json`).

Script npm baru: `prisma:migrate:dev`, `prisma:migrate:deploy`, `prisma:migrate:status`,
`db:migrate-from-sqlite`. `setup` = generate + `migrate deploy` + seed. `build` = `prisma generate && nest build`.

## 4. Membuat project Supabase

1. Buka https://supabase.com, daftar/login, lalu **New project**.
2. Isi nama, **Database Password** (simpan di password manager), dan region terdekat (mis. Singapore).
3. Tunggu project selesai dibuat (1-2 menit).

## 5. Mengambil connection string

Di dashboard project, klik **Connect** (atau Project Settings -> Database -> Connection string):

- **Direct connection** (`db.<PROJECT_REF>.supabase.co:5432`) -> isi `DIRECT_URL`. Dipakai untuk migrasi.
  Direct connection memakai IPv6. Jika jaringan Anda hanya IPv4 dan gagal tersambung, pakai **Session pooler** (port 5432 pada host `pooler.supabase.com`) untuk `DIRECT_URL`.
- **Transaction pooler** (port 6543) atau **Session pooler** (port 5432) -> isi `DATABASE_URL`.
  - VPS/server yang selalu menyala: Session pooler cukup.
  - Platform serverless/banyak instance: Transaction pooler.

Ganti `[YOUR-PASSWORD]` dengan password database. Jika mengandung karakter khusus (`@ : / ? # %`),
URL-encode (mis. `@` -> `%40`). **Jangan** menaruh password asli di file yang masuk Git.

## 6. Konfigurasi `.env`

```
cd backend
cp .env.example .env
# isi DATABASE_URL, DIRECT_URL, JWT_SECRET
```

SSL: `DATABASE_SSL=auto` (bawaan) mengaktifkan SSL untuk host non-lokal tanpa verifikasi sertifikat,
yang umum dipakai untuk pooler Supabase. Untuk verifikasi penuh, unduh sertifikat CA dari
Project Settings -> Database -> SSL Configuration, lalu isi `DATABASE_SSL_CA` dengan isi PEM.

## 7. Menjalankan migrasi schema

```
cd backend
npm install                      # memasang adapter-pg & pg, sekaligus memperbarui package-lock.json
npx prisma generate
npx prisma migrate deploy        # menerapkan prisma/migrations/20261102000000_init
npx prisma migrate status        # harus: "Database schema is up to date"
```

Bukan `db push`. `migrate deploy` menerapkan riwayat migration yang tersimpan di Git, dapat diulang
dan diaudit, serta tidak pernah menghapus data. `db push` langsung mengubah database mengikuti schema
tanpa riwayat dan dapat menghapus kolom/data tanpa jejak, jadi tidak dipakai untuk production.

Untuk perubahan schema berikutnya saat pengembangan: ubah `schema.prisma`, lalu
`npx prisma migrate dev --name nama_perubahan`, commit folder migration, dan di production jalankan `migrate deploy`.

> Migration awal dibuat dari `schema.prisma` dengan konvensi Prisma, karena CLI Prisma tidak bisa dijalankan
> di lingkungan pembuatan. Verifikasi (tanpa database): 
> `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
> lalu bandingkan hasilnya dengan `migration.sql`. Bila ada selisih, ganti isi `migration.sql` dengan hasil perintah itu.

## 8. Data

**Belum ada data penting:** cukup `npm run prisma:seed` (mengisi data demo, hanya jalan di database kosong).

**Sudah punya data di `dev.db`:**
```
cd backend
npm install --no-save better-sqlite3
SQLITE_PATH=./dev.db npm run db:migrate-from-sqlite -- --dry-run    # uji tanpa menulis
SQLITE_PATH=./dev.db npm run db:migrate-from-sqlite
```
`dev.db` tidak dihapus atau diubah (dibuka read-only dan dicadangkan ke `dev.db.bak-<waktu>`), skrip menolak
berjalan bila tabel tujuan sudah berisi data, semua insert dalam satu transaksi, dan jumlah baris tiap tabel diverifikasi.

## 9. Menjalankan backend

```
npm run start:dev          # pengembangan
npm run build && npm run start:prod   # production
curl http://localhost:3000/health     # {"status":"ok","database":"up"}
```

## 10. Menghubungkan website admin dan Flutter

Keduanya memanggil backend yang sama; tidak ada perubahan kode.

- Website admin (`admin-web/.env`): `VITE_API_URL=https://api.domain-anda.com`, lalu `npm run build`.
- Flutter: `flutter run --dart-define=API_BASE_URL=https://api.domain-anda.com`
  (build rilis: `flutter build apk --dart-define=API_BASE_URL=https://api.domain-anda.com`).
- Backend: `CORS_ORIGINS=https://admin.domain-anda.com` (domain website admin).

## 11. Deployment backend (VPS / hosting Node.js)

1. Node.js 22+. Set env (`.env` atau panel hosting): `NODE_ENV=production`, `PORT`, `JWT_SECRET` (acak >=32 karakter),
   `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGINS`, `TRUST_PROXY=1` jika di belakang proxy.
2. Build: `npm ci && npm run build` (butuh devDependencies untuk `prisma generate` dan `nest build`).
3. Rilis: `npx prisma migrate deploy` lalu `npm run start:prod`.
4. Jalankan dengan process manager (PM2/systemd) di belakang Nginx/Caddy ber-HTTPS.
5. Upload foto: di hosting dengan disk sementara, buat bucket **Public** di Supabase Storage (mis. `gymfit-uploads`),
   lalu set `UPLOAD_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.
   Service role key bersifat rahasia: hanya di server. Di VPS dengan disk permanen, `UPLOAD_DRIVER=local` tetap boleh.
6. Docker tidak diwajibkan.

## 12. Menjalankan tes e2e

Butuh database PostgreSQL **khusus tes** (lokal atau project Supabase terpisah, bukan production):
```
TEST_DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/gymfit_test" npm test
```
Tiap berkas tes membuat schema sementara, menerapkan migration, mengisi seed, lalu menghapus schema itu.

## 13. Status pengujian

Lihat bagian "Status verifikasi" pada ringkasan akhir / `docs/CHANGES.md`.
