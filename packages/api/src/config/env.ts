import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GITHUB_WEBHOOK_SECRET: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default(""),
  CRON_API_KEY: z.string().default(""),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const formatted = result.error.format();
  const messages = Object.entries(formatted)
    .filter(([key]) => key !== "_errors")
    .map(([key, value]) => {
      const errors = (value as { _errors: string[] })._errors;
      return `  ${key}: ${errors.join(", ")}`;
    })
    .join("\n");

  throw new Error(`Environment validation failed:\n${messages}`);
}

export const env = result.data;
