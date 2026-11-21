import { PrismaClient } from "@prisma/client";

// DATABASE_URL opsional, untuk override lokasi database (misal testing).
// Default tetap mengikuti schema.prisma (file:./dev.db).
const prisma = new PrismaClient(
  process.env.DATABASE_URL ? { datasourceUrl: process.env.DATABASE_URL } : undefined,
);

export default prisma;
