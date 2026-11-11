import type { GymEntity } from '../../gyms/entities/gym.entity';
import type { GymPlanEntity } from '../../gyms/entities/gym-plan.entity';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Entitas GymMembership (tabel "GymMembership").
 * status: ACTIVE | EXPIRED
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class GymMembershipEntity {
  id: string;
  userId: string;
  gymId: string;
  planId: string;
  price: number;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  user?: UserEntity;
  gym?: GymEntity;
  plan?: GymPlanEntity;
}
