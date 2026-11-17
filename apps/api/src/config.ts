import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url()
})

const result = envSchema.safeParse(process.env);

if(!result.success) {
    console.error("Invalid environment configuration:");
    console.error(z.prettifyError(result.error));
    process.exit(1);
}

export const config = result.data;
export type Config = z.infer<typeof envSchema>;