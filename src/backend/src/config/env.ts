import dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config({
  override: process.env.NODE_ENV !== 'production',
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z
    .string()
    .trim()
    .min(1)
    .default('/api/v1')
    .transform((value) => (value.startsWith('/') ? value : `/${value}`)),
  CLIENT_URL: z.string().url().optional(),
  DATABASE_URL: z.string().trim().min(1).optional(),
  JWT_SECRET: z.string().trim().min(1),
  SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  RATE_LIMIT_GLOBAL_MAX_REQUESTS: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_GLOBAL_BLOCK_MS: z.coerce.number().int().min(1_000).default(300_000),
  RATE_LIMIT_AUTH_MAX_REQUESTS: z.coerce.number().int().min(1).default(5),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().min(1_000).default(600_000),
  RATE_LIMIT_AUTH_BLOCK_MS: z.coerce.number().int().min(1_000).default(1_800_000),
  RATE_LIMIT_SSE_MAX_REQUESTS: z.coerce.number().int().min(1).default(10),
  RATE_LIMIT_SSE_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_SSE_BLOCK_MS: z.coerce.number().int().min(1_000).default(300_000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Environment validation failed.');
}

export const env = parsedEnv.data;
export const isDatabaseConfigured = Boolean(env.DATABASE_URL);
