import { PrismaClient } from "@prisma/client";
import { NODE_ENV } from "@/config/env";

// Prisma Client singleton
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (NODE_ENV !== "production") global.prisma = prisma;

// Test connection on startup
prisma
  .$connect()
  .then(() => {
    console.log("Database connected successfully (Prisma)");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect();
  console.log("Database connection closed (Prisma)");
}
