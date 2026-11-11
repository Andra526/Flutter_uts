import type { GymFacilityEntity } from './gym-facility.entity';
import type { GymImageEntity } from './gym-image.entity';
import type { GymMembershipEntity } from '../../gym-memberships/entities/gym-membership.entity';
import type { GymPlanEntity } from './gym-plan.entity';
import type { TrainerProfileEntity } from '../../trainers/entities/trainer-profile.entity';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Entitas Gym (tabel "Gym").
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class GymEntity {
  id: string;
  name: string;
  city: string;
  address: string;
  openHours: string;
  phone: string;
  imageUrl: string;
  rating: number;
  memberCount: number;
  createdAt: Date;
  facilities?: GymFacilityEntity[];
  images?: GymImageEntity[];
  plans?: GymPlanEntity[];
  trainers?: TrainerProfileEntity[];
  memberships?: GymMembershipEntity[];
  admins?: UserEntity[];
}
