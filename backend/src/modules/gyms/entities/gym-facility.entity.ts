import type { GymEntity } from './gym.entity';

/**
 * Entitas GymFacility (tabel "GymFacility").
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class GymFacilityEntity {
  id: string;
  gymId: string;
  label: string;
  icon: string;
  gym?: GymEntity;
}
