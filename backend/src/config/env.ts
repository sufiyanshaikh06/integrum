import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(1),
  CLIENT_URL: z.string().url(),
  PORT: z.coerce.number().int().min(0).max(65535).default(5000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 'supabase']).default('local'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
}).superRefine((value, ctx) => {
  if (value.EMAIL_PROVIDER === 'resend' && (!value.RESEND_API_KEY || !value.EMAIL_FROM)) {
    ctx.addIssue({ code: 'custom', path: ['EMAIL_PROVIDER'], message: 'Resend requires RESEND_API_KEY and EMAIL_FROM' });
  }
  if (value.NODE_ENV === 'production') {
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (value[key].length < 32) ctx.addIssue({ code: 'custom', path: [key], message: 'Production JWT secrets must contain at least 32 characters' });
    }
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'Access and refresh secrets must differ' });
    }
  }
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
