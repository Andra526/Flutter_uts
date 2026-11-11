import type { BookingEntity } from '../../bookings/entities/booking.entity';

/**
 * Entitas TrainingSession (tabel "TrainingSession").
 * attendance: HADIR | TERLAMBAT | TIDAK_HADIR
 * Sumber kebenaran: prisma/schema.prisma. Bila schema berubah, perbarui kelas ini.
 */
export class TrainingSessionEntity {
  id: string;
  bookingId: string;
  attendance: string;
  intensity: number;
  notes: string;
  completedAt: Date;
  booking?: BookingEntity;
}
