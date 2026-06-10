import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

/**
 * Load environment variables from .env file.
 *
 * This MUST run before envSchema.safeParse() below.
 * Otherwise process.env won't have our .env values yet.
 *
 * In production (Railway, Vercel, AWS), .env is not used —
 * environment variables are set directly in the platform.
 * loadEnv() simply does nothing if no .env file exists, which is fine.
 */
loadEnv();

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
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.string().default('5000'),
  API_URL: z.string().url().default('http://localhost:5000'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),

  // JWT Authentication
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.string().default('12'),
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