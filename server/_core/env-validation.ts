import { z } from 'zod';

/**
 * Production-grade environment variable validation schema.
 * Validates all required and optional environment variables at runtime startup.
 * Fails fast with descriptive error messages if any critical var is missing or malformed.
 */
const EnvSchema = z.object({
  // ═══ DATABASE ════════════════════════════════════════════════════════════
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL').startsWith('postgresql://', {
    message: 'DATABASE_URL must start with postgresql://',
  }),

  // ═══ FIREBASE (SERVER) ═══════════════════════════════════════════════════
  FIREBASE_SERVICE_ACCOUNT: z.string()
    .transform((val, ctx) => {
      try {
        return JSON.parse(val);
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FIREBASE_SERVICE_ACCOUNT must be valid JSON',
        });
        return z.NEVER;
      }
    })
    .refine(
      (val) => val.type === 'service_account' && val.project_id && val.private_key,
      { message: 'FIREBASE_SERVICE_ACCOUNT must contain type, project_id, and private_key' }
    ),

  OWNER_FIREBASE_UID: z.string().min(1, 'OWNER_FIREBASE_UID is required for admin access'),

  // ═══ FIREBASE (CLIENT - PUBLIC) ══════════════════════════════════════════
  VITE_FIREBASE_API_KEY: z.string().min(1, 'VITE_FIREBASE_API_KEY is required'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'VITE_FIREBASE_AUTH_DOMAIN is required'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'VITE_FIREBASE_PROJECT_ID is required'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'VITE_FIREBASE_STORAGE_BUCKET is required'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'VITE_FIREBASE_MESSAGING_SENDER_ID is required'),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'VITE_FIREBASE_APP_ID is required'),

  // ═══ FORGE API (STORAGE + WHISPER) ═══════════════════════════════════════
  BUILT_IN_FORGE_API_URL: z.string().url('BUILT_IN_FORGE_API_URL must be a valid URL'),
  BUILT_IN_FORGE_API_KEY: z.string().min(1, 'BUILT_IN_FORGE_API_KEY is required'),

  // ═══ YOUTUBE OAUTH (OPTIONAL) ════════════════════════════════════════════
  YOUTUBE_CLIENT_ID: z.string().optional().default(''),
  YOUTUBE_CLIENT_SECRET: z.string().optional().default(''),
  YOUTUBE_REDIRECT_URI: z.string().url('YOUTUBE_REDIRECT_URI must be a valid URL').optional().default(''),

  // ═══ PEXELS B-ROLL (OPTIONAL) ════════════════════════════════════════════
  PEXELS_API_KEY: z.string().optional().default(''),

  // ═══ RUNTIME ═══════════════════════════════════════════════════���═════════
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional().default('5000').transform(Number),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

let _validatedEnv: ValidatedEnv | null = null;

/**
 * Validate and cache environment variables at application startup.
 * Throws with comprehensive error details if validation fails.
 */
export function getValidatedEnv(): ValidatedEnv {
  if (_validatedEnv) return _validatedEnv;

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(
        (issue) =>
          `  • ${issue.path.join('.')}: ${issue.message}`
      )
      .join('\n');

    throw new Error(
      `[Environment Validation] Failed to validate environment variables:\n${errors}`
    );
  }

  _validatedEnv = result.data;
  return _validatedEnv;
}

/**
 * Safe getter for optional YouTube OAuth credentials.
 */
export function getYouTubeOAuthConfig(env: ValidatedEnv) {
  if (env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REDIRECT_URI) {
    return {
      enabled: true,
      clientId: env.YOUTUBE_CLIENT_ID,
      clientSecret: env.YOUTUBE_CLIENT_SECRET,
      redirectUri: env.YOUTUBE_REDIRECT_URI,
    };
  }

  return {
    enabled: false,
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  };
}

/**
 * Safe getter for optional Pexels B-Roll API.
 */
export function getPexelsConfig(env: ValidatedEnv) {
  return {
    enabled: !!env.PEXELS_API_KEY,
    apiKey: env.PEXELS_API_KEY,
  };
}
