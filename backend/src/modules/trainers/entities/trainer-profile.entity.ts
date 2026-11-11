import type { BookingEntity } from '../../bookings/entities/booking.entity';
import type { ClientGoalEntity } from '../../client-goals/entities/client-goal.entity';
import type { GymEntity } from '../../gyms/entities/gym.entity';
import type { MealPlanItemEntity } from '../../meal-plans/entities/meal-plan-item.entity';
import type { SessionPackageEntity } from '../../session-packages/entities/session-package.entity';
import type { TrainerScheduleEntity } from '../../trainer-schedules/entities/trainer-schedule.entity';
import type { UserEntity } from '../../users/entities/user.entity';
import type { WorkoutPlanItemEntity } from '../../workout-plans/entities/workout-plan-item.entity';

/**
 * Entitas TrainerProfile (tabel "TrainerProfile").
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class TrainerProfileEntity {
  id: string;
  userId: string;
  gymId: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  rating: number;
  reviewsCount: number;
  /** false = PT dinonaktifkan admin: tidak tampil & tidak bisa dibooking di aplikasi */
  isActive: boolean;
  user?: UserEntity;
  gym?: GymEntity;
  schedules?: TrainerScheduleEntity[];
  bookings?: BookingEntity[];
  goals?: ClientGoalEntity[];
  mealPlanItems?: MealPlanItemEntity[];
  workoutItems?: WorkoutPlanItemEntity[];
  sessionPackages?: SessionPackageEntity[];
}
