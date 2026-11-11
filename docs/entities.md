# Entitas Backend

Setiap tabel database punya satu kelas entitas TypeScript. Backend memakai **Prisma** sebagai ORM, jadi
sumber kebenaran struktur tabel tetap `backend/prisma/schema.prisma`; kelas entitas ini mencerminkannya
(tipe data tiap kolom + relasi) supaya kode dan dokumentasi mudah dibaca, dan bisa dipakai sebagai tipe
data di service/DTO.

Impor semuanya dari satu tempat:

```ts
import { UserEntity, BookingEntity } from '../entities';   // src/entities/index.ts
```

Relasi ditulis sebagai properti opsional (`client?: UserEntity`) karena hanya terisi bila query memakai `include`.
Kolom opsional di database bertipe `| null`.

| Entitas | Berkas | Isi |
|---|---|---|
| `UserEntity` | `src/modules/users/entities/user.entity.ts` | Akun semua peran (MEMBER, TRAINER, ADMIN) |
| `GymEntity` | `src/modules/gyms/entities/gym.entity.ts` | Cabang gym |
| `GymFacilityEntity` | `src/modules/gyms/entities/gym-facility.entity.ts` | Fasilitas gym |
| `GymImageEntity` | `src/modules/gyms/entities/gym-image.entity.ts` | Foto gym |
| `GymPlanEntity` | `src/modules/gyms/entities/gym-plan.entity.ts` | Paket membership gym (harga, durasi) |
| `GymMembershipEntity` | `src/modules/gym-memberships/entities/gym-membership.entity.ts` | Membership aktif/riwayat milik user |
| `TrainerProfileEntity` | `src/modules/trainers/entities/trainer-profile.entity.ts` | Profil Personal Trainer |
| `TrainerScheduleEntity` | `src/modules/trainer-schedules/entities/trainer-schedule.entity.ts` | Jam ketersediaan mingguan PT |
| `BookingEntity` | `src/modules/bookings/entities/booking.entity.ts` | Booking sesi PT (status, tujuan, tujuan bebas) |
| `TrainingSessionEntity` | `src/modules/training-sessions/entities/training-session.entity.ts` | Catatan sesi yang selesai |
| `ClientGoalEntity` | `src/modules/client-goals/entities/client-goal.entity.ts` | Target kalori/makro klien dari PT |
| `MealPlanItemEntity` | `src/modules/meal-plans/entities/meal-plan-item.entity.ts` | Menu makan klien dari PT |
| `WorkoutPlanItemEntity` | `src/modules/workout-plans/entities/workout-plan-item.entity.ts` | Gerakan program latihan dari PT |
| `WorkoutLogEntity` | `src/modules/workout-plans/entities/workout-log.entity.ts` | Log gerakan yang dicentang klien |
| `SessionPackageEntity` | `src/modules/session-packages/entities/session-package.entity.ts` | Kuota sesi PT per klien (default 8) |

> Bila `schema.prisma` berubah (kolom/tabel baru), perbarui kelas entitas terkait dan diagram di bawah.

## Diagram relasi (ERD)

Buka di GitHub / VS Code (ekstensi Mermaid) untuk melihat gambarnya. Teks dalam kurung pada garis relasi
adalah aturan hapus: `Cascade` = ikut terhapus, `Restrict` = ditolak bila masih dipakai, `SetNull` = diisi kosong.

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String phone
        String passwordHash
        String role
        String photoUrl
        String managedGymId
        String birthPlace
        DateTime birthDate
        DateTime createdAt
    }
    Gym {
        String id PK
        String name UK
        String city
        String address
        String openHours
        String phone
        String imageUrl
        Float rating
        Int memberCount
        DateTime createdAt
    }
    GymFacility {
        String id PK
        String gymId
        String label
        String icon
    }
    GymImage {
        String id PK
        String gymId
        String url
        DateTime createdAt
    }
    GymPlan {
        String id PK
        String gymId
        String name
        Int price
        Int durationDays
        String note
        Boolean isPopular
    }
    GymMembership {
        String id PK
        String userId
        String gymId
        String planId
        Int price
        DateTime startDate
        DateTime endDate
        String status
        DateTime createdAt
    }
    TrainerProfile {
        String id PK
        String userId UK
        String gymId
        String specialization
        Int experienceYears
        String bio
        Float rating
        Int reviewsCount
        Boolean isActive
    }
    TrainerSchedule {
        String id PK
        String trainerId
        String day
        String startTime
        String endTime
    }
    Booking {
        String id PK
        String clientId
        String trainerId
        DateTime scheduledAt
        Int durationMin
        String note
        String goalType
        String customGoal
        String status
        DateTime createdAt
        DateTime updatedAt
    }
    TrainingSession {
        String id PK
        String bookingId UK
        String attendance
        Int intensity
        String notes
        DateTime completedAt
    }
    ClientGoal {
        String id PK
        String clientId
        String trainerId
        String description
        Int targetCalories
        Int targetProtein
        DateTime updatedAt
    }
    MealPlanItem {
        String id PK
        String clientId
        String trainerId
        String time
        String category
        String description
        Int calories
        Int protein
        DateTime updatedAt
    }
    WorkoutPlanItem {
        String id PK
        String clientId
        String trainerId
        String dayLabel
        String exercise
        Int sets
        String reps
        Int restSec
        String note
        Int position
        DateTime updatedAt
    }
    WorkoutLog {
        String id PK
        String clientId
        String itemId
        String exerciseName
        DateTime createdAt
    }
    SessionPackage {
        String id PK
        String clientId
        String trainerId
        Int totalSessions
        DateTime createdAt
        DateTime updatedAt
    }
    Gym |o--o{ User : "managedGymId (SetNull)"
    Gym ||--o{ GymFacility : "gymId (Cascade)"
    Gym ||--o{ GymImage : "gymId (Cascade)"
    Gym ||--o{ GymPlan : "gymId (Cascade)"
    User ||--o{ GymMembership : "userId (Cascade)"
    Gym ||--o{ GymMembership : "gymId (Restrict)"
    GymPlan ||--o{ GymMembership : "planId (Restrict)"
    User ||--o| TrainerProfile : "userId (Cascade)"
    Gym ||--o{ TrainerProfile : "gymId (Restrict)"
    TrainerProfile ||--o{ TrainerSchedule : "trainerId (Cascade)"
    User ||--o{ Booking : "clientId (Cascade)"
    TrainerProfile ||--o{ Booking : "trainerId (Cascade)"
    Booking ||--o| TrainingSession : "bookingId (Cascade)"
    User ||--o{ ClientGoal : "clientId (Cascade)"
    TrainerProfile ||--o{ ClientGoal : "trainerId (Cascade)"
    User ||--o{ MealPlanItem : "clientId (Cascade)"
    TrainerProfile ||--o{ MealPlanItem : "trainerId (Cascade)"
    User ||--o{ WorkoutPlanItem : "clientId (Cascade)"
    TrainerProfile ||--o{ WorkoutPlanItem : "trainerId (Cascade)"
    User ||--o{ WorkoutLog : "clientId (Cascade)"
    WorkoutPlanItem |o--o{ WorkoutLog : "itemId (SetNull)"
    User ||--o{ SessionPackage : "clientId (Cascade)"
    TrainerProfile ||--o{ SessionPackage : "trainerId (Cascade)"
```
