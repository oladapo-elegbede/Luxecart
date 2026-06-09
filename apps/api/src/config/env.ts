import { z } from 'zod';

/**
 * Environment variable validation schema.
 *
 * WHY THIS MATTERS:
 * Without this, a missing env variable causes a cryptic error
 * deep in the application (e.g., "Cannot read property of undefined").
 *
 * With this, the server fails IMMEDIATELY on startup with a
 * clear message: "Missing required environment variable: DATABASE_URL"
 *
 * This is called "fail fast" — a critical production principle.
 *
 * NOTE: We are starting with minimal variables. We will add more
 * (DATABASE_URL, JWT secrets, Stripe keys, etc.) when we need them.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.string().default('5000'),
  API_URL: z.string().url().default('http://localhost:5000'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
});

/**
 * Parse and validate environment variables.
 *
 * safeParse returns { success, data, error } instead of throwing.
 * We handle the error explicitly for a better error message.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Type export for use across the codebase
export type Env = z.infer<typeof envSchema>;