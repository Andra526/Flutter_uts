import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Adapter PostgreSQL (Supabase) untuk Prisma 7.
 *
 * Env yang dibaca:
 *  - DATABASE_URL       : connection string untuk runtime (disarankan pooler Supabase).
 *  - DATABASE_SCHEMA    : schema PostgreSQL (default "public"). Dipakai tes e2e.
 *  - DATABASE_SSL       : auto (default) | require | no-verify | disable
 *                         auto = SSL aktif kecuali host localhost/127.0.0.1.
 *                         no-verify = SSL tanpa verifikasi sertifikat (sering perlu
 *                         untuk pooler Supabase). Untuk verifikasi penuh isi
 *                         DATABASE_SSL_CA dengan isi sertifikat CA (PEM).
 *  - DATABASE_POOL_MAX  : jumlah koneksi maksimum per instance (default 10).
 *
 * Parameter ?sslmode= pada URL dibuang karena pengaturan SSL diatur lewat
 * DATABASE_SSL (driver pg memberi prioritas pada sslmode di URL).
 */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL belum diisi. Salin backend/.env.example menjadi .env lalu isi connection string Supabase.',
    );
  }
  return url;
}

export function stripSslMode(url: string): string {
  return url
    .replace(/([?&])sslmode=[^&]*&?/i, '$1')
    .replace(/[?&]$/, '');
}

function isLocalHost(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url);
}

export function pgSslOption(url: string): false | { rejectUnauthorized: boolean; ca?: string } {
  const mode = (process.env.DATABASE_SSL ?? 'auto').toLowerCase();
  if (mode === 'disable') return false;
  if (mode === 'auto' && isLocalHost(url)) return false;
  const ca = process.env.DATABASE_SSL_CA;
  if (ca) return { rejectUnauthorized: true, ca: ca.replace(/\\n/g, '\n') };
  // "auto" dan "no-verify" -> SSL aktif tanpa verifikasi sertifikat.
  // "require" -> verifikasi penuh memakai CA bawaan Node.
  return { rejectUnauthorized: mode === 'require' };
}

export function createPgAdapter(): PrismaPg {
  const url = requireDatabaseUrl();
  const max = parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10);
  return new PrismaPg(
    {
      connectionString: stripSslMode(url),
      ssl: pgSslOption(url),
      max: Number.isFinite(max) && max > 0 ? max : 10,
    },
    { schema: process.env.DATABASE_SCHEMA || 'public' },
  );
}
