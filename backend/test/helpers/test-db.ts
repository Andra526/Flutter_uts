import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { pgSslOption, stripSslMode } from '../../src/database/prisma/pg-adapter';

export interface TestSchema {
  schema: string;
  drop: () => Promise<void>;
}

/**
 * Membuat SCHEMA PostgreSQL sementara (unik per berkas tes), menerapkan semua
 * migration di prisma/migrations, lalu mengarahkan DATABASE_URL/DATABASE_SCHEMA
 * ke sana. Data asli di schema "public" tidak tersentuh.
 *
 * Wajib: TEST_DATABASE_URL -> database PostgreSQL KHUSUS TES (bukan production).
 */
export async function createTestSchema(label: string): Promise<TestSchema> {
  const base = process.env.TEST_DATABASE_URL;
  if (!base) {
    throw new Error(
      'TEST_DATABASE_URL belum diisi. Isi dengan database PostgreSQL khusus tes ' +
        '(mis. postgresql://postgres:<PASSWORD>@localhost:5432/gymfit_test). Jangan pakai database production.',
    );
  }
  const schema = `gymfit_test_${label}_${process.pid}_${Date.now()}`;
  const client = new Client({ connectionString: stripSslMode(base), ssl: pgSslOption(base) });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const dir = path.join(__dirname, '..', '..', 'prisma', 'migrations');
    const folders = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const f of folders) {
      await client.query(fs.readFileSync(path.join(dir, f, 'migration.sql'), 'utf8'));
    }
  } finally {
    await client.end();
  }

  process.env.DATABASE_URL = base;
  process.env.DATABASE_SCHEMA = schema;
  process.env.DATABASE_SSL = process.env.DATABASE_SSL ?? 'auto';

  return {
    schema,
    drop: async () => {
      const c = new Client({ connectionString: stripSslMode(base), ssl: pgSslOption(base) });
      await c.connect();
      try {
        await c.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await c.end();
      }
    },
  };
}
