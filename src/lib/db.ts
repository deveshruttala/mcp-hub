/**
 * Prisma client singleton.
 *
 * Next.js dev mode hot-reloads modules which can spawn many Prisma clients
 * and exhaust the database connection pool. We pin the instance on the
 * `globalThis` object during development so HMR reuses a single client.
 *
 * Importing this module also triggers `env` validation as a side effect.
 */

import { PrismaClient } from "@prisma/client";
import "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
