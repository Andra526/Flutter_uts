/**
 * Pemindahan data SQLite (dev.db) -> PostgreSQL (Supabase). Sekali jalan, aman:
 *  - File SQLite dibuka READ-ONLY dan DICADANG dulu (dev.db.bak-<waktu>). Tidak pernah dihapus/diubah.
 *  - Berhenti bila tabel tujuan sudah berisi data (tidak menimpa apa pun).
 *  - Semua insert dalam SATU transaksi: gagal = batal total.
 *  - Setelah selesai, jumlah baris sumber vs tujuan dibandingkan per tabel.
 *
 * Pemakaian (dari folder backend, setelah `prisma migrate deploy`):
 *   npm install --no-save better-sqlite3        # sementara, tidak mengubah package.json
 *   SQLITE_PATH=./dev.db npm run db:migrate-from-sqlite -- --dry-run   # cek tanpa menulis
 *   SQLITE_PATH=./dev.db npm run db:migrate-from-sqlite                # eksekusi
 *
 * Memakai DATABASE_URL (atau DIRECT_URL bila diisi) dan DATABASE_SCHEMA dari .env.
 */
import 'dotenv/config';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Client } from 'pg';
import { pgSslOption, stripSslMode } from '../src/database/prisma/pg-adapter';

interface TableMeta {
  name: string;
  dates?: string[];
  bools?: string[];
}

// Urutan mengikuti ketergantungan foreign key (induk dulu).
const TABLES: TableMeta[] = [
  { name: 'Gym', dates: ['createdAt'] },
  { name: 'User', dates: ['birthDate', 'createdAt'] },
  { name: 'GymFacility' },
  { name: 'GymImage', dates: ['createdAt'] },
  { name: 'GymPlan', bools: ['isPopular'] },
  { name: 'GymMembership', dates: ['startDate', 'endDate', 'createdAt'] },
  { name: 'TrainerProfile', bools: ['isActive'] },
  { name: 'TrainerSchedule' },
  { name: 'Booking', dates: ['scheduledAt', 'createdAt', 'updatedAt'] },
  { name: 'TrainingSession', dates: ['completedAt'] },
  { name: 'ClientGoal', dates: ['updatedAt'] },
  { name: 'MealPlanItem', dates: ['updatedAt'] },
  { name: 'WorkoutPlanItem', dates: ['updatedAt'] },
  { name: 'WorkoutLog', dates: ['createdAt'] },
  { name: 'SessionPackage', dates: ['createdAt', 'updatedAt'] },
];

/** SQLite menyimpan tanggal sebagai angka (ms), teks ISO, atau 'YYYY-MM-DD HH:MM:SS' (UTC). */
function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return new Date(v);
  const s = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return new Date(Number(s));
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s) ? s.replace(' ', 'T') + 'Z' : s;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Format tanggal tidak dikenali: ${s}`);
  return d;
}

const toBool = (v: unknown) => v === 1 || v === true || v === '1' || v === 'true';

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const sqlitePath = resolve(process.env.SQLITE_PATH ?? './dev.db');
  if (!existsSync(sqlitePath)) {
    throw new Error(`File SQLite tidak ditemukan: ${sqlitePath} (atur SQLITE_PATH)`);
  }

  let Database: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Database = require('better-sqlite3');
  } catch {
    throw new Error('Jalankan dulu: npm install --no-save better-sqlite3');
  }

  const backup = `${sqlitePath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  copyFileSync(sqlitePath, backup);
  console.log(`Cadangan SQLite: ${backup}`);

  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL / DIRECT_URL belum diisi di .env');
  const schema = process.env.DATABASE_SCHEMA || 'public';

  const pg = new Client({ connectionString: stripSslMode(url), ssl: pgSslOption(url) });
  await pg.connect();
  try {
    await pg.query(`SET search_path TO ${q(schema)}`);

    // 1. Tabel tujuan harus kosong.
    for (const t of TABLES) {
      const { rows } = await pg.query(`SELECT COUNT(*)::int AS n FROM ${q(t.name)}`);
      if (rows[0].n > 0) {
        throw new Error(`Tabel ${t.name} di PostgreSQL sudah berisi ${rows[0].n} baris. Dibatalkan, tidak ada yang ditimpa.`);
      }
    }

    // 2. Salin dalam satu transaksi.
    await pg.query('BEGIN');
    const report: string[] = [];
    for (const t of TABLES) {
      const exists = sqlite
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
        .get(t.name);
      if (!exists) {
        report.push(`${t.name.padEnd(16)} (tidak ada di SQLite, dilewati)`);
        continue;
      }
      const cols: string[] = sqlite.prepare(`PRAGMA table_info(${q(t.name)})`).all().map((c: any) => c.name);
      const rows: Record<string, unknown>[] = sqlite.prepare(`SELECT * FROM ${q(t.name)}`).all();

      for (const row of rows) {
        const values = cols.map((c) => {
          const v = row[c];
          if (t.dates?.includes(c)) return toDate(v);
          if (t.bools?.includes(c)) return toBool(v);
          return v === undefined ? null : v;
        });
        await pg.query(
          `INSERT INTO ${q(t.name)} (${cols.map(q).join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
          values,
        );
      }
      const { rows: after } = await pg.query(`SELECT COUNT(*)::int AS n FROM ${q(t.name)}`);
      const ok = after[0].n === rows.length ? 'OK' : 'TIDAK SAMA';
      report.push(`${t.name.padEnd(16)} sumber=${rows.length} tujuan=${after[0].n} ${ok}`);
      if (after[0].n !== rows.length) throw new Error(`Jumlah baris ${t.name} tidak sama`);
    }

    console.log(report.join('\n'));
    if (dryRun) {
      await pg.query('ROLLBACK');
      console.log('\n--dry-run: semua dibatalkan (ROLLBACK). Tidak ada data yang ditulis.');
    } else {
      await pg.query('COMMIT');
      console.log('\nSelesai. Data berhasil dipindahkan ke PostgreSQL.');
    }
  } catch (e) {
    await pg.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    await pg.end();
    sqlite.close();
  }
}

main().catch((e) => {
  console.error('\nGAGAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
