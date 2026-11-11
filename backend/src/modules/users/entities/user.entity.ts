import type { BookingEntity } from '../../bookings/entities/booking.entity';
import type { ClientGoalEntity } from '../../client-goals/entities/client-goal.entity';
import type { GymEntity } from '../../gyms/entities/gym.entity';
import type { GymMembershipEntity } from '../../gym-memberships/entities/gym-membership.entity';
import type { MealPlanItemEntity } from '../../meal-plans/entities/meal-plan-item.entity';
import type { SessionPackageEntity } from '../../session-packages/entities/session-package.entity';
import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { WorkoutLogEntity } from '../../workout-plans/entities/workout-log.entity';
import type { WorkoutPlanItemEntity } from '../../workout-plans/entities/workout-plan-item.entity';

/**
 * Entitas User (tabel "User").
 * role: MEMBER | TRAINER | ADMIN
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class UserEntity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: string;
  photoUrl: string | null;
  /** Untuk ADMIN: cabang gym yang dikelola */
  managedGymId: string | null;
  /** Data pemilik gym (diisi saat daftar lewat website): tempat & tanggal lahir */
  birthPlace: string | null;
  birthDate: Date | null;
  createdAt: Date;
  managedGym?: GymEntity | null;
  trainerProfile?: TrainerProfileEntity | null;
  memberships?: GymMembershipEntity[];
  bookings?: BookingEntity[];
  goals?: ClientGoalEntity[];
  mealPlanItems?: MealPlanItemEntity[];
  workoutItems?: WorkoutPlanItemEntity[];
  workoutLogs?: WorkoutLogEntity[];
  sessionPackages?: SessionPackageEntity[];
}
