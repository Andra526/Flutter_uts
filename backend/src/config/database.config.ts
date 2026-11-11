export const databaseConfig = () => ({
  // Tidak ada nilai bawaan: DATABASE_URL wajib diisi (lihat .env.example).
  databaseUrl: process.env.DATABASE_URL,
});
