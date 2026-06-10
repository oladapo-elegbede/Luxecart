import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma Client Singleton.
 *
 * WHY A SINGLETON?
 * Each PrismaClient instance opens a pool of database connections.
 * Creating multiple instances (e.g., in every file) would quickly
 * exhaust the database's connection limit.
 *
 * By exporting a single instance from this file, every part of our
 * app shares the SAME connection pool.
 *
 * WHY THE `globalThis` PATTERN?
 * In development, tsx restarts our server on every file change.
 * Without this pattern, we'd create a new PrismaClient on every reload,
 * eventually exhausting connections.
 *
 * The `globalThis` workaround keeps the instance alive across reloads.
 * In production, this code path is never hit (NODE_ENV === 'production').
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect from the database.
 *
 * Called from server.ts during graceful shutdown.
 * Ensures all in-flight queries complete before connection closes.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}