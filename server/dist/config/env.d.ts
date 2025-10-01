import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    JWT_SECRET: z.ZodString;
    SUPABASE_URL: z.ZodString;
    SUPABASE_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodOptional<z.ZodString>;
    ALLOWED_ORIGINS: z.ZodOptional<z.ZodString>;
    LOG_LEVEL: z.ZodOptional<z.ZodString>;
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    PYTHON_API_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    JWT_SECRET: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    PYTHON_API_URL: string;
    SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
    ALLOWED_ORIGINS?: string | undefined;
    LOG_LEVEL?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
}, {
    JWT_SECRET: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
    ALLOWED_ORIGINS?: string | undefined;
    LOG_LEVEL?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    PYTHON_API_URL?: string | undefined;
}>;
type EnvConfig = z.infer<typeof envSchema> & {
    allowedOrigins: string[];
};
export declare const env: EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map