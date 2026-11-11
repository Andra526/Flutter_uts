import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Perintah Prisma CLI (migrate, db pull, dll) memakai DIRECT_URL (koneksi langsung
// Supabase, port 5432) bila ada; jika tidak, memakai DATABASE_URL.
// Runtime aplikasi TIDAK memakai berkas ini: lihat src/database/prisma/pg-adapter.ts.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // `prisma generate` tidak butuh URL, jadi datasource hanya dipasang bila ada.
  ...(url ? { datasource: { url } } : {}),
});
