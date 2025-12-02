import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

const ensureDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL muss gesetzt sein, bevor auf Prisma zugegriffen wird.");
  }
  return process.env.DATABASE_URL;
};

const getPool = () => {
  if (!globalForPrisma.prismaPool) {
    const connectionString = ensureDatabaseUrl();
    try {
      const parsed = new URL(connectionString.replace("postgresql://", "postgres://"));
      const dbName = parsed.pathname.replace(/^\//, "");
      console.log(`[prisma] Initialisiere Pool für ${parsed.hostname}/${dbName}`);
    } catch (error) {
      console.warn("[prisma] Konnte Connection-String nicht parsen", error);
    }

    globalForPrisma.prismaPool = new Pool({
      connectionString,
    });
  }
  return globalForPrisma.prismaPool;
};

const adapter = new PrismaPg(getPool());

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
