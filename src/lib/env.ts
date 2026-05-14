/**
 * Environment variable validation
 * ----------------------------------------------------------------------------
 * Validate critical env vars at server startup so misconfiguration fails fast
 * with a clear error rather than producing confusing 500s at request time.
 *
 * Importing this module is enough to trigger validation. It is imported by
 * `src/lib/db.ts` so every Prisma boot path runs through the check.
 */

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters in production")
    .default("dev-secret-please-change-in-production-32+chars"),
  AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Email magic-link sign-in. Optional — in dev the link is logged to stdout.
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // In production, blow up loudly. In development, log a clear warning so the
  // user can still inspect the underlying error.
  const message = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  // eslint-disable-next-line no-console
  console.warn(`[env] Invalid environment variables (dev mode, continuing):\n${message}`);
}

export const env = parsed.success ? parsed.data : (process.env as never);
