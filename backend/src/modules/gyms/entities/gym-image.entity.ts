import type { GymEntity } from './gym.entity';

/**
 * Entitas GymImage (tabel "GymImage").
 * Foto fasilitas yang diunggah admin gym (file disimpan di folder uploads/)
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class GymImageEntity {
  id: string;
  gymId: string;
  url: string;
  createdAt: Date;
  gym?: GymEntity;
}
