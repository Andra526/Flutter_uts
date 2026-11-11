import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { TrainingSessionEntity } from '../../training-sessions/entities/training-session.entity';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Entitas Booking (tabel "Booking").
 * status: PENDING | ACCEPTED | REJECTED | COMPLETED | CANCELLED
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class BookingEntity {
  id: string;
  clientId: string;
  trainerId: string;
  scheduledAt: Date;
  durationMin: number;
  note: string;
  /** Paket tujuan: WEIGHT_LOSS | MUSCLE_GAIN | TONING | ENDURANCE | REHAB | GENERAL */
  goalType: string;
  /** Tujuan bebas (teks) bila pilihan paket tujuan tidak ada yang cocok. Opsional. */
  customGoal: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client?: UserEntity;
  trainer?: TrainerProfileEntity;
  session?: TrainingSessionEntity | null;
}
