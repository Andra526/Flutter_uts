import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Entitas ClientGoal (tabel "ClientGoal").
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class ClientGoalEntity {
  id: string;
  clientId: string;
  trainerId: string;
  description: string;
  targetCalories: number | null;
  targetProtein: number | null;
  updatedAt: Date;
  client?: UserEntity;
  trainer?: TrainerProfileEntity;
}
