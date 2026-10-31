import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/drizzle';
import { users, sessions, accounts, verifications } from '@/database/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { redactDatabaseUrl } from '@/lib/db-config';

export const DEV_FALLBACK_SECRET = 'skillverse_development_better_auth_secret_minimum_32_bytes_long';

export interface AuthConfigValidation {
  valid: boolean;
  secret: string;
  baseURL: string;
  githubEnabled: boolean;
  errors: string[];
}

export function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Generates a cryptographically secure random authentication secret (32 bytes / 64 hex chars).
 * Suitable for provisioning BETTER_AUTH_SECRET in staging and production environments.
 */
export function generateSecureAuthSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates Better Auth and OAuth environment configuration.
 * In production mode, enforces that BETTER_AUTH_SECRET is present, distinct from the
 * dev fallback, at least 32 characters long, and passes heuristic defense-in-depth checks
 * against simple patterns, repetitive characters, and known placeholders.
 *
 * NOTE: Heuristic checks (Shannon entropy, character diversity) reject trivially weak strings
 * but do not mathematically prove cryptographic unpredictability. Secrets must always be
 * generated using a CSPRNG such as `crypto.randomBytes(32)`.
 */
export function validateAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfigValidation {
  const errors: string[] = [];
  const isProduction = env.NODE_ENV === 'production';
  const rawSecret = env.BETTER_AUTH_SECRET;

  let secret = rawSecret || '';

  if (isProduction) {
    if (!rawSecret || rawSecret.trim().length === 0) {
      errors.push('CRITICAL: BETTER_AUTH_SECRET environment variable is missing in production.');
    } else if (rawSecret.length < 32) {
      errors.push(`CRITICAL: BETTER_AUTH_SECRET must be at least 32 characters long in production (provided ${rawSecret.length} chars).`);
    } else if (rawSecret === DEV_FALLBACK_SECRET || rawSecret.includes('placeholder') || rawSecret.includes('REPLACE_WITH')) {
      errors.push('CRITICAL: Insecure default or placeholder secret detected for BETTER_AUTH_SECRET in production.');
    } else {
      const distinctChars = new Set(rawSecret).size;
      const entropy = calculateEntropy(rawSecret);
      const isPureDigits = /^\d+$/.test(rawSecret);
      const hasRepetition = /(.{4,})\1{2,}/.test(rawSecret);

      if (distinctChars < 12 || entropy < 3.2 || isPureDigits || hasRepetition) {
        errors.push(`CRITICAL: BETTER_AUTH_SECRET lacks sufficient cryptographic entropy (${entropy.toFixed(2)} bits/char, ${distinctChars} distinct chars). Secrets must not be repetitive, numeric-only, or simple patterns.`);
      }
    }
  } else {
    if (!secret || secret.trim().length === 0) {
      secret = DEV_FALLBACK_SECRET;
    }
  }

  // Base URL validation
  const rawBaseURL = env.BETTER_AUTH_URL || env.NEXT_PUBLIC_APP_URL || (!isProduction ? 'http://localhost:3000' : '');
  let baseURL = rawBaseURL;

  if (isProduction) {
    if (!rawBaseURL || rawBaseURL.trim().length === 0) {
      errors.push('CRITICAL: BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be configured in production.');
    } else {
      try {
        const parsed = new URL(rawBaseURL);
        if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
          errors.push(`CRITICAL: BETTER_AUTH_URL must use https: in production (received ${parsed.protocol}).`);
        }
      } catch {
        errors.push(`CRITICAL: BETTER_AUTH_URL is an invalid URL format: "${rawBaseURL}".`);
      }
    }
  }

  // GitHub OAuth validation
  const githubClientId = env.GITHUB_CLIENT_ID || env.GITHUB_ID || '';
  const githubClientSecret = env.GITHUB_CLIENT_SECRET || env.GITHUB_SECRET || '';
  const githubEnabled = Boolean(githubClientId && githubClientSecret);

  if (isProduction) {
    if (githubClientId && !githubClientSecret) {
      errors.push('CRITICAL: GITHUB_CLIENT_ID was provided without GITHUB_CLIENT_SECRET.');
    } else if (!githubClientId && githubClientSecret) {
      errors.push('CRITICAL: GITHUB_CLIENT_SECRET was provided without GITHUB_CLIENT_ID.');
    } else if (githubClientId.includes('placeholder') || githubClientSecret.includes('placeholder')) {
      errors.push('CRITICAL: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET contains placeholder values in production.');
    }
  }

  if (errors.length > 0 && isProduction) {
    throw new Error(`[BetterAuth Configuration Failure]\n- ${errors.join('\n- ')}`);
  }

  return {
    valid: errors.length === 0,
    secret,
    baseURL: baseURL || 'http://localhost:3000',
    githubEnabled,
    errors,
  };
}

/**
 * Resolves a unique username for incoming GitHub profiles without swallowing DB errors.
 * Preserves account identity, bounds length to schema varchar(100), and handles collisions.
 */
export async function resolveUniqueUsername(
  profile: { login?: string; email?: string; id?: string | number },
  dbInstance: any = db
): Promise<string> {
  let baseUsername = profile.login || profile.email?.split('@')[0] || `user_${profile.id || 'dev'}`;
  baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!baseUsername || baseUsername.length === 0) {
    baseUsername = `dev_${profile.id || crypto.randomBytes(3).toString('hex')}`;
  }

  // Cap base length at 90 characters to safely allow _ + 6 hex characters <= 97 <= 100 varchar limit
  baseUsername = baseUsername.slice(0, 90);

  // Check database for existing username
  let existingUser: { id: string; email: string; username?: string } | null | undefined;
  try {
    existingUser = await dbInstance.query.users.findFirst({
      where: eq(users.username, baseUsername),
      columns: { id: true, email: true, username: true },
    });
  } catch (err: any) {
    // Fail closed: Do NOT swallow database errors during identity resolution!
    const sanitizedMsg = redactDatabaseUrl(err?.message || 'Database unavailable');
    console.error('[BetterAuth resolveUniqueUsername] Database error during collision check:', sanitizedMsg);
    throw new Error(`Database error during username collision check: ${sanitizedMsg}`);
  }

  // Case 1: Username is completely free
  if (!existingUser) {
    return baseUsername;
  }

  // Case 2: Same email - this is the existing user account linking scenario
  if (profile.email && existingUser.email && existingUser.email.toLowerCase() === profile.email.toLowerCase()) {
    return existingUser.username || baseUsername;
  }

  // Case 3: Different email owns baseUsername - generate unique username with bounded retry
  for (let attempt = 1; attempt <= 3; attempt++) {
    const entropy = crypto.randomBytes(3).toString('hex'); // 6 hex characters
    const candidateUsername = `${baseUsername}_${entropy}`; // length <= 97 <= 100

    try {
      const collisionCheck = await dbInstance.query.users.findFirst({
        where: eq(users.username, candidateUsername),
        columns: { id: true },
      });

      if (!collisionCheck) {
        return candidateUsername;
      }
    } catch (err: any) {
      const sanitizedMsg = redactDatabaseUrl(err?.message || 'Database unavailable');
      throw new Error(`Database error during collision retry: ${sanitizedMsg}`);
    }
  }

  // Extreme fallback with timestamp entropy
  const timestampSuffix = Date.now().toString(36).slice(-6);
  return `${baseUsername.slice(0, 88)}_${timestampSuffix}_${crypto.randomBytes(2).toString('hex')}`;
}

const authConfig = validateAuthConfig();

export const auth = betterAuth({
  baseURL: authConfig.baseURL,
  secret: authConfig.secret,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  user: {
    fields: {
      image: 'avatarUrl',
    },
    additionalFields: {
      username: { type: 'string', required: true },
      role: { type: 'string', required: false, defaultValue: 'developer' },
      githubId: { type: 'string', required: false },
      githubToken: { type: 'string', required: false },
      bio: { type: 'string', required: false },
      website: { type: 'string', required: false },
      location: { type: 'string', required: false },
      companyId: { type: 'string', required: false },
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_SECRET || '',
      scope: ['read:user', 'repo'],
      enabled: authConfig.githubEnabled,
      mapProfileToUser: async (profile: any) => {
        const username = await resolveUniqueUsername(profile);
        const fullName = profile.name || profile.login || username;
        const avatarUrl = profile.avatar_url || '';
        const githubId = String(profile.id || '');
        return {
          name: fullName,
          username,
          avatarUrl,
          githubId,
          role: 'developer',
        };
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github'],
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account: any) => {
          if (account.providerId === 'github' && account.accessToken) {
            try {
              await db
                .update(users)
                .set({ 
                  githubToken: account.accessToken, 
                  githubId: String(account.accountId),
                  updatedAt: new Date() 
                })
                .where(eq(users.id, account.userId));
            } catch (err) {
              console.error('[BetterAuth Hook] Failed to sync githubToken on account create:', err);
            }
          }
        },
      },
      update: {
        after: async (account: any) => {
          if (account.providerId === 'github' && account.accessToken) {
            try {
              await db
                .update(users)
                .set({ 
                  githubToken: account.accessToken, 
                  githubId: String(account.accountId),
                  updatedAt: new Date() 
                })
                .where(eq(users.id, account.userId));
            } catch (err) {
              console.error('[BetterAuth Hook] Failed to sync githubToken on account update:', err);
            }
          }
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
});
