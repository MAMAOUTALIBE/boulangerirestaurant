import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma en singleton.
 * En dev, Next.js recharge les modules à chaud : on réutilise l'instance
 * stockée sur `globalThis` pour éviter d'épuiser le pool de connexions.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
