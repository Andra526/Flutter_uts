import type { GymEntity } from './gym.entity';
import type { GymMembershipEntity } from '../../gym-memberships/entities/gym-membership.entity';

/**
 * Entitas GymPlan (tabel "GymPlan").
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class GymPlanEntity {
  id: string;
  gymId: string;
  name: string;
  price: number;
  durationDays: number;
  note: string;
  isPopular: boolean;
  gym?: GymEntity;
  memberships?: GymMembershipEntity[];
}
