import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET doit contenir au moins 16 caractères'),
  SUPABASE_URL: z.string().url('SUPABASE_URL doit être une URL valide'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY est requis'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // 🐍 Python AI Service
  PYTHON_API_URL: z.string().url('PYTHON_API_URL doit être une URL valide').default('http://localhost:8000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Configuration environnement invalide:');
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join('.') || 'root'}: ${issue.message}`);
  }
  throw new Error('Configuration environnement invalide');
}

const rawEnv = parsed.data;

const defaultOrigins = rawEnv.NODE_ENV === 'development'
  ? ['http://localhost:3000']
  : [];

const allowedOrigins = rawEnv.ALLOWED_ORIGINS
  ? rawEnv.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : defaultOrigins;

type EnvConfig = z.infer<typeof envSchema> & {
  allowedOrigins: string[];
};

export const env: EnvConfig = {
  ...rawEnv,
  allowedOrigins,
};
