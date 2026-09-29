import { z } from "zod";

function issueMessages(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
}

const authSecretSchema = z
  .string()
  .min(16, "AUTH_SECRET must be at least 16 characters");

/** Edge-safe: only AUTH_SECRET. No default string and no NEXTAUTH_SECRET alias. */
export function getAuthSecret(): string {
  const parsed = authSecretSchema.safeParse(process.env.AUTH_SECRET);
  if (!parsed.success) {
    throw new Error(
      `Environment validation failed: ${issueMessages(parsed.error)}. Copy .env.example to .env.local and set AUTH_SECRET.`
    );
  }
  return parsed.data;
}

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

type ServerEnv = z.infer<typeof serverEnvSchema> & { AUTH_SECRET: string };

let cached: ServerEnv | null = null;

/** Validated server environment. Throws if required vars are missing. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `Environment validation failed: ${issueMessages(parsed.error)}. Copy .env.example to .env.local and set values.`
    );
  }
  cached = { ...parsed.data, AUTH_SECRET: getAuthSecret() };
  return cached;
}
