import { PrismaClient } from '@prisma/client';

// Prisma Client singleton
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully (Prisma)');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect();
  console.log('Database connection closed (Prisma)');
}
