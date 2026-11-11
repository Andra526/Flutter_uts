import type { UserEntity } from '../../users/entities/user.entity';
import type { WorkoutPlanItemEntity } from './workout-plan-item.entity';

/**
 * Entitas WorkoutLog (tabel "WorkoutLog").
 * Catatan klien: "gerakan ini sudah saya kerjakan". Dipakai untuk log progres.
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class WorkoutLogEntity {
  id: string;
  clientId: string;
  itemId: string | null;
  exerciseName: string;
  createdAt: Date;
  client?: UserEntity;
  item?: WorkoutPlanItemEntity | null;
}
