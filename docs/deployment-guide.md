# Deployment (ringkas)

- **Backend**: `npm run build` lalu `npm run start:prod`. Database PostgreSQL; set `JWT_SECRET` yang kuat dan `CORS_ORIGINS`. Panduan lengkap: `docs/docker-deploy.md` dan `docs/supabase-migration.md`.
- **Mobile**: set `--dart-define=API_BASE_URL=https://api.domain-anda.com`. Produksi wajib HTTPS; hapus `usesCleartextTraffic` di `AndroidManifest.xml`.
