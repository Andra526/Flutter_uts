import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';

/**
 * Entitas TrainerSchedule (tabel "TrainerSchedule").
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class TrainerScheduleEntity {
  id: string;
  trainerId: string;
  /** Senin, Selasa, ... */
  day: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  trainer?: TrainerProfileEntity;
}
