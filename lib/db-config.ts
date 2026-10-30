/**
 * SkillVerse Database Configuration & Least-Privilege Role Enforcement
 * Phase 44F — Runtime Role Enforcement & Staging Readiness Hardening
 *
 * Governs:
 * 1. Strict separation of runtime application role (skillverse_app) and migration runner role (skillverse_migrator)
 * 2. Fail-fast rejection of missing APP_DATABASE_URL or MIGRATOR_DATABASE_URL in production
 * 3. Prohibition of administrative/owner roles (e.g. neondb_owner) for application runtime
 * 4. Safe URL parsing with zero credential or secret exposure in diagnostic/error output
 * 5. Independent validation of staging targets to prevent accidental production mutations
 * 6. Elimination of silent fallback chains in production environments
 */

import { URL } from 'url';

/**
 * Roles that are strictly disallowed for application runtime in production.
 * Application runtime must never connect as superuser, administrative owner, or database administrator.
 */
export const DISALLOWED_APP_ROLES = Object.freeze([
  'neondb_owner',
  'postgres',
  'root',
  'admin',
  'administrator',
  'superuser',
  'cloudadmin',
]);

/**
 * Known production endpoints or signatures used to detect accidental production targeting
 * during operations explicitly designated as staging-only.
 */
export const KNOWN_PRODUCTION_HOST_SIGNATURES = Object.freeze([
  'ep-flat-rice-ao8kdffq',
  'ep-flat-rice-ao8kdffq-pooler',
]);

export interface ParsedDatabaseConfig {
  protocol: string;
  username: string;
  host: string;
  port: string;
  database: string;
  sslmode?: string;
  isPooler: boolean;
  redactedUrl: string;
}

export interface RuntimeDbConfig {
  connectionString: string;
  username: string;
  host: string;
  database: string;
  isProduction: boolean;
  redactedUrl: string;
}

export interface MigratorDbConfig {
  connectionString: string;
  username: string;
  host: string;
  database: string;
  isProduction: boolean;
  redactedUrl: string;
  isDisposableStaging?: boolean;
}

/**
 * Sanitizes a PostgreSQL connection URL by redacting the password and query parameter secrets.
 * Never prints plaintext passwords, auth tokens, or secret values.
 */
export function redactDatabaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '[EMPTY_OR_INVALID_URL]';
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '***';
    }
    // Also sanitize any query parameters that could carry tokens
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/password|secret|token|key|auth/i.test(key)) {
        parsed.searchParams.set(key, '***');
      }
    }
    return parsed.toString();
  } catch {
    // Regex fallback for non-standard or partially malformed URLs
    return rawUrl.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1***$3');
  }
}

/**
 * Parses and inspects a database connection URL with fail-fast error reporting
 * that never leaks credentials in thrown error messages.
 */
export function parseDatabaseUrl(rawUrl: string, variableName = 'DATABASE_URL'): ParsedDatabaseConfig {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    throw new Error(`[DB Security Failure] ${variableName} is empty or not configured.`);
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      `[DB Security Failure] Malformed database URL format in ${variableName}. Must be a valid postgresql:// connection URI.`
    );
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(
      `[DB Security Failure] Invalid protocol "${parsed.protocol}" in ${variableName}. Expected "postgresql:" or "postgres:".`
    );
  }

  const username = decodeURIComponent(parsed.username || '').trim();
  if (!username) {
    throw new Error(`[DB Security Failure] ${variableName} does not specify a database user.`);
  }

  const host = parsed.hostname;
  if (!host) {
    throw new Error(`[DB Security Failure] ${variableName} does not specify a valid database host.`);
  }

  const database = parsed.pathname.replace(/^\//, '').split('?')[0] || '';
  const sslmode = parsed.searchParams.get('sslmode') || undefined;
  const isPooler = host.includes('-pooler');

  return {
    protocol: parsed.protocol,
    username,
    host,
    port: parsed.port || '5432',
    database,
    sslmode,
    isPooler,
    redactedUrl: redactDatabaseUrl(trimmed),
  };
}

/**
 * Validates database configuration for the application runtime.
 *
 * Rules:
 * - Production:
 *   1. Requires explicit APP_DATABASE_URL.
 *   2. Rejects missing APP_DATABASE_URL rather than silently falling back to DATABASE_URL.
 *   3. Rejects known administrative or owner roles (e.g., neondb_owner).
 *   4. Rejects empty, malformed, or unsafe URLs without printing credentials.
 * - Development:
 *   Explicit fallback: APP_DATABASE_URL || DATABASE_URL || localhost default.
 *   Logs safe diagnostic warning if neondb_owner is detected.
 */
export type EnvironmentVariables = Record<string, string | undefined>;

export function validateRuntimeDatabaseConfig(env: EnvironmentVariables = process.env): RuntimeDbConfig {
  const isProduction = env.NODE_ENV === 'production';
  const appUrl = env.APP_DATABASE_URL;
  const fallbackUrl = env.DATABASE_URL;

  if (isProduction) {
    if (!appUrl || appUrl.trim().length === 0) {
      if (fallbackUrl && fallbackUrl.trim().length > 0) {
        throw new Error(
          '[DB Security Failure] Production application runtime requires APP_DATABASE_URL. ' +
          'Found only DATABASE_URL, which is prohibited in production to prevent unintended administrative ' +
          'or owner role connections. Configure APP_DATABASE_URL with a dedicated least-privilege role (e.g., "skillverse_app").'
        );
      }
      throw new Error(
        '[DB Security Failure] Production application runtime requires an explicitly configured APP_DATABASE_URL environment variable.'
      );
    }

    const parsed = parseDatabaseUrl(appUrl, 'APP_DATABASE_URL');

    // Reject administrative / owner roles in application runtime
    if (DISALLOWED_APP_ROLES.includes(parsed.username.toLowerCase())) {
      throw new Error(
        `[DB Security Failure] Production application runtime rejected connection configured with administrative/owner role "${parsed.username}". ` +
        'Application runtime must use a dedicated least-privilege role (e.g., "skillverse_app") without superuser, DDL, or role administration privileges.'
      );
    }

    return {
      connectionString: appUrl.trim(),
      username: parsed.username,
      host: parsed.host,
      database: parsed.database,
      isProduction: true,
      redactedUrl: parsed.redactedUrl,
    };
  }

  // Development / Test mode
  const effectiveUrl = appUrl || fallbackUrl || 'postgresql://postgres:postgres@localhost:5432/postgres';
  let username = 'postgres';
  let host = 'localhost';
  let database = 'postgres';
  let redactedUrl = effectiveUrl;

  try {
    const parsed = parseDatabaseUrl(effectiveUrl, 'APP_DATABASE_URL/DATABASE_URL');
    username = parsed.username;
    host = parsed.host;
    database = parsed.database;
    redactedUrl = parsed.redactedUrl;

    if (username === 'neondb_owner') {
      console.warn(
        `[DB Security Notice] Runtime connected as "${username}" in development mode. Note: Production requires APP_DATABASE_URL with least-privilege role "skillverse_app".`
      );
    }
  } catch {
    // Development fallback parsing error handled gracefully
  }

  return {
    connectionString: effectiveUrl,
    username,
    host,
    database,
    isProduction: false,
    redactedUrl,
  };
}

/**
 * Validates database configuration for the migration runner (Drizzle Kit / deploy scripts).
 *
 * Rules:
 * - Production:
 *   1. Requires explicit MIGRATOR_DATABASE_URL.
 *   2. Rejects silent fallback to DATABASE_URL or DATABASE_URL_UNPOOLED.
 *   3. Rejects application runtime role (skillverse_app) for migrations (needs DDL capability).
 * - Staging-only operations:
 *   1. Enforces that target host is not a known production endpoint.
 *   2. Requires independent verification proof before executing staging-only operations.
 */
export function validateMigratorDatabaseConfig(
  env: EnvironmentVariables = process.env,
  options?: { stagingOnly?: boolean }
): MigratorDbConfig {
  const isProduction = env.NODE_ENV === 'production';
  const migratorUrl = env.MIGRATOR_DATABASE_URL;
  const unpooledUrl = env.DATABASE_URL_UNPOOLED;
  const directUrl = env.DIRECT_URL;
  const fallbackUrl = env.DATABASE_URL;

  const isStagingOnly =
    options?.stagingOnly === true ||
    env.STAGING_VERIFICATION === 'true' ||
    env.REQUIRE_STAGING === 'true';

  let effectiveUrl: string;

  if (isProduction) {
    if (!migratorUrl || migratorUrl.trim().length === 0) {
      if (unpooledUrl || directUrl || fallbackUrl) {
        throw new Error(
          '[DB Security Failure] Production migration execution requires MIGRATOR_DATABASE_URL. ' +
          'Found only fallback connection variables (DATABASE_URL / DATABASE_URL_UNPOOLED / DIRECT_URL), ' +
          'which is prohibited in production to prevent unintended execution using runtime or unverified credentials. ' +
          'Configure MIGRATOR_DATABASE_URL with dedicated migration credentials.'
        );
      }
      throw new Error(
        '[DB Security Failure] Production migration execution requires an explicitly configured MIGRATOR_DATABASE_URL environment variable.'
      );
    }

    effectiveUrl = migratorUrl.trim();
  } else {
    // Development / Test mode preserves fallback chain for local testing
    effectiveUrl =
      migratorUrl ||
      unpooledUrl ||
      directUrl ||
      fallbackUrl ||
      'postgresql://postgres:postgres@localhost:5432/postgres';
  }

  const parsed = parseDatabaseUrl(effectiveUrl, 'MIGRATOR_DATABASE_URL');

  // Prevent application runtime role from being used as migrator (lacks DDL grants)
  if (parsed.username === 'skillverse_app') {
    throw new Error(
      '[DB Security Failure] Migration runner cannot use application runtime role "skillverse_app". ' +
      'Migrations require schema management privileges (e.g. "skillverse_migrator").'
    );
  }

  // Staging-only guard: prevent accidental production target selection
  if (isStagingOnly) {
    const isProductionHost =
      KNOWN_PRODUCTION_HOST_SIGNATURES.some((sig) => parsed.host.includes(sig)) ||
      (env.PRODUCTION_DATABASE_HOST && parsed.host === env.PRODUCTION_DATABASE_HOST);

    if (isProductionHost) {
      throw new Error(
        `[DB Security Failure] Safety stop: Migration target host "${parsed.host}" matches known production endpoint during an operation marked as staging-only. ` +
        'Operations targeting staging must use an independently verified disposable branch.'
      );
    }

    // Require independent verification proof that target branch is disposable
    const hasBranchProof =
      env.NEON_DISPOSABLE_BRANCH_VERIFIED === 'true' ||
      (env.NEON_BRANCH && env.NEON_BRANCH !== 'production' && env.NEON_BRANCH !== 'main');

    if (!hasBranchProof) {
      throw new Error(
        '[DB Security Failure] Safety stop: Staging migration target cannot be verified as disposable. ' +
        'A local string comparison or environment variable name is not sufficient proof. ' +
        'Authorized operators must verify the Neon branch identity and set NEON_DISPOSABLE_BRANCH_VERIFIED="true".'
      );
    }
  }

  return {
    connectionString: effectiveUrl,
    username: parsed.username,
    host: parsed.host,
    database: parsed.database,
    isProduction,
    redactedUrl: parsed.redactedUrl,
    isDisposableStaging: isStagingOnly,
  };
}

/**
 * Asserts that application runtime and migration runner credentials are fundamentally independent.
 * Rejects configuration where both roles share the same identity.
 */
export function validateRoleSeparation(
  appConfig: RuntimeDbConfig,
  migratorConfig: MigratorDbConfig
): void {
  const appUser = appConfig.username.trim().toLowerCase();
  const migratorUser = migratorConfig.username.trim().toLowerCase();

  if (appUser === migratorUser) {
    throw new Error(
      `[DB Security Failure] Database role separation violation: Application runtime and migration runner cannot use the same database identity ("${appConfig.username}"). ` +
      'Runtime must use least-privilege role (e.g. "skillverse_app") and migrator must use dedicated schema role (e.g. "skillverse_migrator").'
    );
  }
}

/**
 * Asserts that runtime schema synchronization or auto-DDL cannot be executed in production.
 */
export function assertNoAutoDDLInProduction(action = 'schema synchronization'): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[DB Security Block] ${action} cannot be executed in production. ` +
      'Runtime schema synchronization and auto-DDL are strictly prohibited. ' +
      'Schema changes must be applied via drizzle-kit migrations using MIGRATOR_DATABASE_URL.'
    );
  }
}
