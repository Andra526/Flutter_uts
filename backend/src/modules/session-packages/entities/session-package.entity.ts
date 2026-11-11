import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Entitas SessionPackage (tabel "SessionPackage").
 * Kuota sesi PT per pasangan klien-PT. Default 8 sesi untuk semua PT.
 * Sisa kuota = totalSessions - jumlah booking berstatus COMPLETED.
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class SessionPackageEntity {
  id: string;
  clientId: string;
  trainerId: string;
  totalSessions: number;
  createdAt: Date;
  updatedAt: Date;
  client?: UserEntity;
  trainer?: TrainerProfileEntity;
}
