# Panduan setup

## Prasyarat
Node.js 22+, Flutter (sesuai `mobile/pubspec.yaml`).

## 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # ganti JWT_SECRET
npm run setup               # prisma generate + migrate deploy + seed (butuh DATABASE_URL Supabase, lihat docs/supabase-migration.md)
npm run start:dev           # http://localhost:3000/health
npm test                    # 13 tes end-to-end
```
Akun demo (password `password123`): `andra.setya@email.com` (member), `alex.pt@gymfit.com` (PT), `admin@gymfit.com` (admin).

## 2. Mobile
```bash
cd mobile
flutter pub get
flutter analyze && flutter test
flutter run                                              # emulator Android
flutter run --dart-define=API_BASE_URL=http://IP-KOMPUTER:3000   # HP asli (satu Wi-Fi)
```
Android emulator memakai `10.0.2.2` untuk menjangkau komputer. Pada HP asli gunakan IP komputer.
