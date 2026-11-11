import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { UserEntity } from '../../users/entities/user.entity';
import type { WorkoutLogEntity } from './workout-log.entity';

/**
 * Entitas WorkoutPlanItem (tabel "WorkoutPlanItem").
 * Program latihan klien yang disusun PT. Klien hanya membaca miliknya sendiri.
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class WorkoutPlanItemEntity {
  id: string;
  clientId: string;
  trainerId: string;
  /** "Hari 1 - Dada & Triceps" */
  dayLabel: string;
  /** nama gerakan */
  exercise: string;
  sets: number;
  /** "10-12" / "30 detik" */
  reps: string;
  restSec: number | null;
  note: string;
  position: number;
  updatedAt: Date;
  client?: UserEntity;
  trainer?: TrainerProfileEntity;
  logs?: WorkoutLogEntity[];
}
