import 'reflect-metadata';
import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UPLOAD_DIR, isSupabaseStorage } from './common/utils/upload';
import { AppModule } from './app.module';

/** Di production, tolak secret bawaan/kosong agar token tidak bisa dipalsukan. */
function assertProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32 || /ganti-dengan|dev-secret/i.test(secret)) {
    throw new Error('JWT_SECRET production harus diisi acak minimal 32 karakter.');
  }
  if (!process.env.CORS_ORIGINS) {
    new Logger('Bootstrap').warn(
      'CORS_ORIGINS kosong: semua origin diizinkan. Isi dengan domain website admin Anda.',
    );
  }
}

async function bootstrap() {
  assertProductionConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS: daftar origin dari env (dipisah koma). Kosong = izinkan semua (pengembangan).
  // Aplikasi Flutter native tidak mengirim header Origin sehingga tidak terpengaruh.
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors(origins.length ? { origin: origins, credentials: true } : undefined);

  // Di belakang reverse proxy, percayai X-Forwarded-For agar IP klien benar.
  if (parseInt(process.env.TRUST_PROXY ?? '0', 10) > 0) {
    app.set('trust proxy', parseInt(process.env.TRUST_PROXY ?? '1', 10));
  }

  // Foto lokal dibuka lewat /uploads/<nama-file>; bila memakai Supabase Storage
  // foto dilayani langsung oleh Supabase.
  if (!isSupabaseStorage) {
    app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/' });
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`GymFit API berjalan di port ${port}`);
}
bootstrap();
