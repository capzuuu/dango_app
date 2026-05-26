import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  // Secret header guard
  DANGO_API_SECRET_HEADER_NAME: z.string().min(1).default('x-dango-secret'),
  DANGO_API_SECRET: z.string().min(1),

  // Rate limiting (Upstash-compatible KV)
  DANGO_RATE_LIMIT_WINDOW_SECONDS: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'number' ? v : parseInt(v, 10)))
    .pipe(z.number().int().positive())
    .optional()
    .default(60),

  DANGO_RATE_LIMIT_MAX_REQUESTS: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'number' ? v : parseInt(v, 10)))
    .pipe(z.number().int().positive())
    .optional()
    .default(30),

  // Upstash / Vercel KV REST API
  // Upstash: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
  UPSTASH_REDIS_REST_URL: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  // CORS
  CORS_ORIGINS: z.string().optional(),

  // TMDB
  TMDB_ACCESS_TOKEN: z.string().min(1)
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;

