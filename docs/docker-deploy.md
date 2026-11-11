# Menjalankan dengan Docker

Ada dua cara pakai. Docker hanya cara menjalankan; databasenya PostgreSQL biasa (bukan Supabase).

## A. Pengembangan di laptop (database di Docker)

```
docker compose -f docker-compose.dev.yml up -d
cd backend
cp .env.example .env
```
Isi `backend/.env`:
```
DATABASE_URL="postgresql://gymfit:gymfit@localhost:5432/gymfit"
DIRECT_URL="postgresql://gymfit:gymfit@localhost:5432/gymfit"
TEST_DATABASE_URL="postgresql://gymfit:gymfit@localhost:5432/gymfit_test"
JWT_SECRET="apa-saja-untuk-dev"
```
(`localhost` otomatis tanpa SSL.) Lalu:
```
npm install
npm run setup          # generate + migrate deploy + seed data demo
npm run start:dev      # http://localhost:3000
```
Website: `cd admin-web && npm install && npm run dev`. Flutter: `flutter run --dart-define=API_BASE_URL=http://localhost:3000`.
Tes e2e: `npm test` (memakai database `gymfit_test` di container yang sama).

## B. Production di satu VPS (semua di Docker, HTTPS otomatis)

Isi compose: `db` (PostgreSQL 16), `migrate` (sekali jalan), `backend`, `admin-web`, `caddy`.
Hanya Caddy yang membuka port 80/443 ke internet; database dan backend tidak bisa diakses langsung dari luar.

1. **Siapkan VPS** (Ubuntu 24.04) dan **domain**. Di DNS domain buat dua A record ke IP VPS:
   `gymfitku.com` (website) dan `api.gymfitku.com` (backend). Tunggu DNS menyebar (menit sampai jam).
2. **Pasang Docker** (lewati bila VPS memakai template Docker): `curl -fsSL https://get.docker.com | sh`
3. **Firewall**: izinkan hanya 22, 80, 443 (`ufw allow 22,80,443/tcp && ufw allow 443/udp && ufw enable`).
4. **Unggah proyek** ke VPS (`git clone` atau `scp`), masuk ke foldernya.
5. **Isi `.env`**: `cp .env.example .env`, isi `POSTGRES_PASSWORD`, `JWT_SECRET`, domain, dan `ACME_EMAIL`.
6. **Jalankan**: `docker compose up -d --build`
7. **Cek**: `docker compose ps` (semua `running`/`healthy`, `migrate` berstatus `exited (0)`),
   lalu buka `https://api.gymfitku.com/health` (harus `{"status":"ok","database":"up"}`) dan `https://gymfitku.com`.

**Data awal di production:** jangan menjalankan seed (isinya akun demo berpassword `password123`).
Pemilik gym mendaftar sendiri lewat halaman depan website (otomatis menjadi ADMIN gym itu).
Seed hanya untuk demo/uji: `docker compose run --rm migrate npx ts-node prisma/seed.ts` (ditolak bila database sudah berisi data).

**Pembaruan** setelah kode berubah: `git pull && docker compose up -d --build`
(migration baru otomatis diterapkan oleh servis `migrate`).

**Perintah berguna**
```
docker compose logs -f backend      # log backend
docker compose restart backend
docker compose down                 # hentikan (data aman di volume)
docker compose down -v              # HATI-HATI: ikut MENGHAPUS database dan foto
```

## Backup (wajib di opsi ini)

Data ada di volume Docker pada VPS. Jika VPS rusak tanpa backup, data hilang.
```
./scripts/backup-db.sh                       # database + foto -> folder backups/ (simpan 14 hari)
./scripts/restore-db.sh backups/gymfit-db-<tanggal>.sql.gz
```
Jadwalkan harian dengan cron (`crontab -e`): `0 3 * * * /path/ke/gymfit/scripts/backup-db.sh >> /var/log/gymfit-backup.log 2>&1`
Salin folder `backups/` secara berkala ke tempat lain (komputer sendiri / penyimpanan cloud), jangan hanya di VPS yang sama.

## Aplikasi Flutter (Play Store)

Alamat backend tertanam saat build:
`flutter build appbundle --release --dart-define=API_BASE_URL=https://api.gymfitku.com`

## Catatan

- Foto upload disimpan di volume `uploads` (tidak hilang saat container dibuat ulang). Untuk memindahkan ke Supabase Storage lihat `docs/supabase-migration.md`.
- Dockerfile backend memakai `npm install` karena `package-lock.json` belum diperbarui; setelah `npm install` di komputer Anda, commit lockfile lalu ganti ke `npm ci` di `backend/Dockerfile`.
- Memakai Supabase sebagai database tetap bisa: hapus servis `db` dan `migrate`, isi `DATABASE_URL`/`DIRECT_URL` Supabase di servis `backend`, dan jalankan `npx prisma migrate deploy` seperti di `docs/supabase-migration.md`.
