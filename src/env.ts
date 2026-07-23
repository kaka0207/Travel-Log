import { z } from "zod";

const serverSchema = z
  .object({
    STORAGE_PROVIDER: z.enum(["local", "s3"]).default("s3"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_PROVIDER: z.enum(["local", "neon", "cloud"]).optional(),

    // S3 is only required when STORAGE_PROVIDER=s3.
    S3_ENDPOINT: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),

    // Auth
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.string().min(1, "BETTER_AUTH_URL is required"),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_PROVIDER !== "s3") return;

    for (const key of [
      "S3_ENDPOINT",
      "S3_BUCKET_NAME",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when STORAGE_PROVIDER=s3`,
        });
      }
    }
  });

/**
 * Validate server-side environment variables.
 * Call this once during server startup to fail fast with clear errors.
 */
export function validateServerEnv() {
  return serverSchema.parse(process.env);
}