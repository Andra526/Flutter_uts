import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Entitas MealPlanItem (tabel "MealPlanItem").
 * Pola makan harian klien yang dibuat/diubah PT. Klien hanya membaca miliknya sendiri.
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class MealPlanItemEntity {
  id: string;
  clientId: string;
  trainerId: string;
  /** HH:mm */
  time: string;
  /** Sarapan, Makan Siang, Snack, Makan Malam, ... */
  category: string;
  description: string;
  calories: number;
  protein: number;
  updatedAt: Date;
  client?: UserEntity;
  trainer?: TrainerProfileEntity;
}
