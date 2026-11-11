import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';

const logger = new Logger('Upload');

/**
 * Penyimpanan foto:
 *  - UPLOAD_DRIVER=local    (default) -> folder UPLOAD_DIR di disk server.
 *  - UPLOAD_DRIVER=supabase           -> Supabase Storage (bucket Public), cocok untuk
 *                                        hosting yang disknya sementara (ephemeral).
 */
export const UPLOAD_DRIVER = (process.env.UPLOAD_DRIVER ?? 'local').toLowerCase();
export const isSupabaseStorage = UPLOAD_DRIVER === 'supabase';

/** Folder penyimpanan foto (driver local). Bisa diubah lewat env UPLOAD_DIR. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const newFileName = (file: { mimetype: string; originalname: string }) =>
  `${Date.now()}-${randomBytes(6).toString('hex')}${ALLOWED[file.mimetype] ?? extname(file.originalname)}`;

const storage = isSupabaseStorage
  ? memoryStorage()
  : diskStorage({
      destination: (_req, _file, cb) => {
        if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
      },
      filename: (_req, file, cb) => cb(null, newFileName(file)),
    });

/** Opsi multer: hanya JPG/PNG/WEBP, maks 3 MB per file. */
export const imageUploadOptions = {
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: { mimetype: string }, cb: (e: Error | null, ok: boolean) => void) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new BadRequestException('Gambar harus berformat JPG, PNG, atau WEBP'), false);
  },
};

// ---------- Supabase Storage (REST, tanpa dependency tambahan) ----------
function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'gymfit-uploads';
  if (!url || !key) {
    throw new InternalServerErrorException(
      'UPLOAD_DRIVER=supabase membutuhkan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY',
    );
  }
  return { url, key, bucket };
}

async function uploadToSupabase(file: Express.Multer.File): Promise<string> {
  const { url, key, bucket } = supabaseConfig();
  const name = newFileName(file);
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': file.mimetype,
      'x-upsert': 'false',
    },
    body: new Uint8Array(file.buffer),
  });
  if (!res.ok) {
    logger.error(`Upload Supabase gagal (${res.status}): ${await res.text().catch(() => '')}`);
    throw new InternalServerErrorException('Gagal menyimpan gambar');
  }
  return `${url}/storage/v1/object/public/${bucket}/${name}`;
}

/** Simpan file hasil multer dan kembalikan URL yang disimpan di database. */
export async function saveUploadedFiles(files: Express.Multer.File[]): Promise<string[]> {
  if (isSupabaseStorage) {
    const urls: string[] = [];
    try {
      for (const f of files) urls.push(await uploadToSupabase(f));
    } catch (e) {
      await Promise.all(urls.map((u) => removeUploaded(u)));
      throw e;
    }
    return urls;
  }
  // local: URL relatif; klien menambahkan alamat server.
  return files.map((f) => `/uploads/${f.filename}`);
}

/** Hapus file fisik bila URL-nya berasal dari upload kita (bukan link luar). */
export async function removeUploaded(url: string | null | undefined): Promise<void> {
  if (!url) return;

  if (url.startsWith('/uploads/')) {
    const target = join(UPLOAD_DIR, url.replace('/uploads/', ''));
    if (target.startsWith(UPLOAD_DIR) && existsSync(target)) {
      try {
        unlinkSync(target);
      } catch {
        /* abaikan */
      }
    }
    return;
  }

  if (isSupabaseStorage) {
    try {
      const { url: base, key, bucket } = supabaseConfig();
      const prefix = `${base}/storage/v1/object/public/${bucket}/`;
      if (!url.startsWith(prefix)) return;
      await fetch(`${base}/storage/v1/object/${bucket}/${url.slice(prefix.length)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${key}`, apikey: key },
      });
    } catch {
      /* abaikan: file yatim tidak boleh menggagalkan permintaan */
    }
  }
}
