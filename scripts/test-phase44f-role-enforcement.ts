/**
 * SkillVerse Phase 44F — Runtime Role Enforcement & Staging Readiness Adversarial Suite
 *
 * Validates:
 * 1. Production startup with APP_DATABASE_URL missing.
 * 2. Production startup with only DATABASE_URL configured.
 * 3. Production runtime configured with neondb_owner or other admin roles.
 * 4. Production runtime configured with approved application role (skillverse_app).
 * 5. Malformed and incomplete database URLs without leaking credentials.
 * 6. Production migration startup without MIGRATOR_DATABASE_URL.
 * 7. Production migration startup with only DATABASE_URL.
 * 8. Migration and runtime credentials configured to the same identity.
 * 9. Accidental production target selection during a staging-only operation.
 * 10. Secret generation and insecure-placeholder rejection.
 * 11. Redaction of sensitive connection information in all diagnostic paths.
 * 12. Alternate database initialization paths that bypass validation (auto-DDL lockdown).
 * 13. Fail-closed behavior when database configuration is invalid.
 * 14. Regression coverage for authentication and authorization guards.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  validateRuntimeDatabaseConfig,
  validateMigratorDatabaseConfig,
  validateRoleSeparation,
  redactDatabaseUrl,
  parseDatabaseUrl,
  assertNoAutoDDLInProduction,
  DISALLOWED_APP_ROLES,
} from '../lib/db-config';
import { syncDatabaseSchema } from '../lib/drizzle';
import {
  validateAuthConfig,
  generateSecureAuthSecret,
  DEV_FALLBACK_SECRET,
} from '../lib/auth';
import { isDemoAuthEnabled } from '../services/auth/session';
import { AuthorizationGuard } from '../services/security/authorizer';
import { NextRequest } from 'next/server';

async function runPhase44FTests() {
  console.log('=====================================================================');
  console.log('  🛡️ SKILLVERSE PHASE 44F — RUNTIME ROLE ENFORCEMENT & ADVERSARIAL SUITE');
  console.log('=====================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Production startup with APP_DATABASE_URL missing
  // ---------------------------------------------------------------------------
  console.log('▶ [1/14] Testing Production Runtime Missing APP_DATABASE_URL...');

  await test('TEST-1.01: Production rejects startup when APP_DATABASE_URL is not set', () => {
    let failed = false;
    try {
      validateRuntimeDatabaseConfig({
        NODE_ENV: 'production',
        // Neither APP_DATABASE_URL nor DATABASE_URL
      });
    } catch (err: any) {
      failed = err.message.includes('Production application runtime requires an explicitly configured APP_DATABASE_URL');
    }
    assert(failed, 'Must reject startup when APP_DATABASE_URL is completely missing in production');
  });

  await test('TEST-1.02: Production rejects startup when APP_DATABASE_URL is empty whitespace', () => {
    let failed = false;
    try {
      validateRuntimeDatabaseConfig({
        NODE_ENV: 'production',
        APP_DATABASE_URL: '   ',
      });
    } catch (err: any) {
      failed = err.message.includes('Production application runtime requires an explicitly configured APP_DATABASE_URL');
    }
    assert(failed, 'Must reject startup when APP_DATABASE_URL is whitespace in production');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Production startup with only DATABASE_URL configured
  // ---------------------------------------------------------------------------
  console.log('\n▶ [2/14] Testing Rejection of Silent Fallback to DATABASE_URL in Production...');

  await test('TEST-2.01: Production rejects DATABASE_URL fallback when APP_DATABASE_URL is absent', () => {
    let failed = false;
    try {
      validateRuntimeDatabaseConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://skillverse_app:pass@ep-staging-pooler.neon.tech/neondb?sslmode=require',
      });
    } catch (err: any) {
      failed = err.message.includes('Found only DATABASE_URL, which is prohibited in production');
    }
    assert(failed, 'Must reject silent fallback to DATABASE_URL in production');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Production runtime configured with neondb_owner or admin roles
  // ---------------------------------------------------------------------------
  console.log('\n▶ [3/14] Testing Administrative & Owner Role Rejection for App Runtime...');

  await test('TEST-3.01: Production runtime rejects neondb_owner credentials', () => {
    let failed = false;
    try {
      validateRuntimeDatabaseConfig({
        NODE_ENV: 'production',
        APP_DATABASE_URL: 'postgresql://neondb_owner:SecretPassword123@ep-staging-pooler.neon.tech/neondb?sslmode=require',
      });
    } catch (err: any) {
      failed =
        err.message.includes('rejected connection configured with administrative/owner role "neondb_owner"') &&
        !err.message.includes('SecretPassword123'); // Password must NOT be in error message!
    }
    assert(failed, 'Must reject neondb_owner in production runtime without printing password');
  });

  await test('TEST-3.02: Production runtime rejects other administrative roles (postgres, root, superuser)', () => {
    for (const role of DISALLOWED_APP_ROLES) {
      let failed = false;
      try {
        validateRuntimeDatabaseConfig({
          NODE_ENV: 'production',
          APP_DATABASE_URL: `postgresql://${role}:SecretPass@ep-staging-pooler.neon.tech/neondb?sslmode=require`,
        });
      } catch (err: any) {
        failed = err.message.includes(`rejected connection configured with administrative/owner role "${role}"`);
      }
      assert(failed, `Must reject administrative role "${role}" for application runtime`);
    }
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Production runtime configured with approved application role
  // ---------------------------------------------------------------------------
  console.log('\n▶ [4/14] Testing Approved Least-Privilege Role (skillverse_app)...');

  await test('TEST-4.01: Production runtime accepts skillverse_app on pooled host', () => {
    const config = validateRuntimeDatabaseConfig({
      NODE_ENV: 'production',
      APP_DATABASE_URL: 'postgresql://skillverse_app:SecretAppPassword999@ep-staging-pooler.neon.tech/neondb?sslmode=require',
    });
    assert.strictEqual(config.username, 'skillverse_app');
    assert.strictEqual(config.isProduction, true);
    assert.strictEqual(config.host, 'ep-staging-pooler.neon.tech');
    assert.strictEqual(config.database, 'neondb');
    assert(!config.redactedUrl.includes('SecretAppPassword999'), 'Redacted URL must mask password');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Malformed and incomplete database URLs
  // ---------------------------------------------------------------------------
  console.log('\n▶ [5/14] Testing Malformed and Incomplete Database URLs...');

  await test('TEST-5.01: Rejects non-URL string safely', () => {
    let failed = false;
    try {
      parseDatabaseUrl('not_a_valid_postgres_url', 'TEST_URL');
    } catch (err: any) {
      failed = err.message.includes('Malformed database URL format');
    }
    assert(failed, 'Must reject non-URL string');
  });

  await test('TEST-5.02: Rejects invalid protocol (http: instead of postgresql:)', () => {
    let failed = false;
    try {
      parseDatabaseUrl('http://user:pass@localhost:5432/db', 'TEST_URL');
    } catch (err: any) {
      failed = err.message.includes('Invalid protocol "http:"');
    }
    assert(failed, 'Must reject non-PostgreSQL protocol');
  });

  await test('TEST-5.03: Rejects URL missing username', () => {
    let failed = false;
    try {
      parseDatabaseUrl('postgresql://:pass@localhost:5432/db', 'TEST_URL');
    } catch (err: any) {
      failed = err.message.includes('does not specify a database user');
    }
    assert(failed, 'Must reject URL missing username');
  });

  await test('TEST-5.04: Rejects URL missing host', () => {
    let failed = false;
    try {
      parseDatabaseUrl('postgresql://user:pass@/db', 'TEST_URL');
    } catch (err: any) {
      failed = err.message.includes('does not specify a valid database host') || err.message.includes('Malformed database URL');
    }
    assert(failed, 'Must reject URL missing host');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Production migration startup without MIGRATOR_DATABASE_URL
  // ---------------------------------------------------------------------------
  console.log('\n▶ [6/14] Testing Production Migration Missing MIGRATOR_DATABASE_URL...');

  await test('TEST-6.01: Production migration rejects startup when MIGRATOR_DATABASE_URL is missing', () => {
    let failed = false;
    try {
      validateMigratorDatabaseConfig({
        NODE_ENV: 'production',
      });
    } catch (err: any) {
      failed = err.message.includes('Production migration execution requires an explicitly configured MIGRATOR_DATABASE_URL');
    }
    assert(failed, 'Must reject migration startup without MIGRATOR_DATABASE_URL in production');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 7: Production migration startup with only DATABASE_URL
  // ---------------------------------------------------------------------------
  console.log('\n▶ [7/14] Testing Production Migration Silent Fallback Rejection...');

  await test('TEST-7.01: Production migration rejects fallback to DATABASE_URL or DATABASE_URL_UNPOOLED', () => {
    let failed = false;
    try {
      validateMigratorDatabaseConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://skillverse_migrator:pass@ep-staging.neon.tech/neondb',
      });
    } catch (err: any) {
      failed = err.message.includes('Found only fallback connection variables (DATABASE_URL / DATABASE_URL_UNPOOLED / DIRECT_URL)');
    }
    assert(failed, 'Must reject fallback to DATABASE_URL for migrations in production');
  });

  await test('TEST-7.02: Production migration rejects application role (skillverse_app)', () => {
    let failed = false;
    try {
      validateMigratorDatabaseConfig({
        NODE_ENV: 'production',
        MIGRATOR_DATABASE_URL: 'postgresql://skillverse_app:pass@ep-staging.neon.tech/neondb',
      });
    } catch (err: any) {
      failed = err.message.includes('Migration runner cannot use application runtime role "skillverse_app"');
    }
    assert(failed, 'Must reject skillverse_app role for running migrations');
  });

  await test('TEST-7.03: Migration runner rejects PgBouncer connection pooler host (-pooler)', () => {
    let failed = false;
    try {
      validateMigratorDatabaseConfig({
        NODE_ENV: 'production',
        MIGRATOR_DATABASE_URL: 'postgresql://skillverse_migrator:pass@ep-staging-pooler.neon.tech/neondb',
      });
    } catch (err: any) {
      failed =
        err.message.includes('Migration runner rejected connection configured with connection pooler host') &&
        err.message.includes('ep-staging-pooler.neon.tech');
    }
    assert(failed, 'Must reject pooled connections for migration runner');
  });

  await test('TEST-7.04: Migration runner accepts direct unpooled connection host', () => {
    const config = validateMigratorDatabaseConfig({
      NODE_ENV: 'production',
      MIGRATOR_DATABASE_URL: 'postgresql://skillverse_migrator:pass@ep-staging-direct.neon.tech/neondb',
    });
    assert.strictEqual(config.username, 'skillverse_migrator');
    assert.strictEqual(config.host, 'ep-staging-direct.neon.tech');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 8: Migration & runtime credentials configured to same identity
  // ---------------------------------------------------------------------------
  console.log('\n▶ [8/14] Testing Separation Violation When Both Roles Share Identity...');

  await test('TEST-8.01: Rejects configuration when app and migrator share same username', () => {
    let failed = false;
    try {
      const appConfig = {
        connectionString: 'postgresql://shared_user:pass@ep-staging.neon.tech/neondb',
        username: 'shared_user',
        host: 'ep-staging.neon.tech',
        database: 'neondb',
        isProduction: true,
        redactedUrl: 'postgresql://shared_user:***@ep-staging.neon.tech/neondb',
      };
      const migratorConfig = {
        connectionString: 'postgresql://shared_user:pass@ep-staging.neon.tech/neondb',
        username: 'shared_user',
        host: 'ep-staging.neon.tech',
        database: 'neondb',
        isProduction: true,
        redactedUrl: 'postgresql://shared_user:***@ep-staging.neon.tech/neondb',
      };
      validateRoleSeparation(appConfig, migratorConfig);
    } catch (err: any) {
      failed = err.message.includes('Database role separation violation: Application runtime and migration runner cannot use the same database identity');
    }
    assert(failed, 'Must reject identical usernames between app and migrator');
  });

  await test('TEST-8.02: Accepts distinct app (skillverse_app) and migrator (skillverse_migrator) roles', () => {
    const appConfig = {
      connectionString: 'postgresql://skillverse_app:pass@ep-staging.neon.tech/neondb',
      username: 'skillverse_app',
      host: 'ep-staging.neon.tech',
      database: 'neondb',
      isProduction: true,
      redactedUrl: 'postgresql://skillverse_app:***@ep-staging.neon.tech/neondb',
    };
    const migratorConfig = {
      connectionString: 'postgresql://skillverse_migrator:pass@ep-staging.neon.tech/neondb',
      username: 'skillverse_migrator',
      host: 'ep-staging.neon.tech',
      database: 'neondb',
      isProduction: true,
      redactedUrl: 'postgresql://skillverse_migrator:***@ep-staging.neon.tech/neondb',
    };
    // Should not throw
    validateRoleSeparation(appConfig, migratorConfig);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 9: Accidental production target selection during staging-only operation
  // ---------------------------------------------------------------------------
  console.log('\n▶ [9/14] Testing Staging Target Isolation Guard...');

  await test('TEST-9.01: Rejects known production host during staging-only migration', () => {
    let failed = false;
    try {
      validateMigratorDatabaseConfig(
        {
          MIGRATOR_DATABASE_URL: 'postgresql://skillverse_migrator:pass@ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech/neondb',
          STAGING_VERIFICATION: 'true',
        },
        { stagingOnly: true }
      );
    } catch (err: any) {
      failed = err.message.includes('Safety stop: Migration target host') && err.message.includes('matches known production endpoint');
    }
    assert(failed, 'Must halt if target matches production endpoint during staging-only operation');
  });

  await test('TEST-9.02: Rejects staging migration without independent disposable branch verification proof', () => {
    let failed = false;
    try {
      validateMigratorDatabaseConfig(
        {
          MIGRATOR_DATABASE_URL: 'postgresql://skillverse_migrator:pass@ep-some-other-host.ap-southeast-1.aws.neon.tech/neondb',
          STAGING_VERIFICATION: 'true',
          // NEON_DISPOSABLE_BRANCH_VERIFIED missing
        },
        { stagingOnly: true }
      );
    } catch (err: any) {
      failed = err.message.includes('Safety stop: Staging migration target cannot be verified as disposable');
    }
    assert(failed, 'Must require verified disposable branch proof before staging migration');
  });

  await test('TEST-9.03: Accepts staging migration with verified disposable branch proof', () => {
    const config = validateMigratorDatabaseConfig(
      {
        MIGRATOR_DATABASE_URL: 'postgresql://skillverse_migrator:pass@ep-disposable-staging-branch.ap-southeast-1.aws.neon.tech/neondb',
        STAGING_VERIFICATION: 'true',
        NEON_DISPOSABLE_BRANCH_VERIFIED: 'true',
        NEON_BRANCH: 'staging-phase44-gate',
      },
      { stagingOnly: true }
    );
    assert.strictEqual(config.username, 'skillverse_migrator');
    assert.strictEqual(config.isDisposableStaging, true);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 10: Secret generation and insecure-placeholder rejection
  // ---------------------------------------------------------------------------
  console.log('\n▶ [10/14] Testing Secret Generation & Placeholder Rejection...');

  await test('TEST-10.01: generateSecureAuthSecret() produces 64-character hex CSPRNG string', () => {
    const secret = generateSecureAuthSecret();
    assert.strictEqual(secret.length, 64);
    assert(/^[a-f0-9]{64}$/.test(secret), 'Secret must be valid 64-hex lowercase string');
  });

  await test('TEST-10.02: Production rejects placeholder and low-diversity secrets', () => {
    const badSecrets = [
      '',
      'short',
      DEV_FALLBACK_SECRET,
      'REPLACE_WITH_CRYPTOGRAPHICALLY_SECURE_32_BYTE_STRING',
      'placeholder_secret_for_development_purposes',
      'a'.repeat(40),
      '12345678901234567890123456789012',
    ];

    for (const bad of badSecrets) {
      let threw = false;
      try {
        validateAuthConfig({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: bad,
          BETTER_AUTH_URL: 'https://staging.skillverse.dev',
        });
      } catch {
        threw = true;
      }
      assert(threw, `Must reject insecure secret: "${bad.slice(0, 15)}..."`);
    }
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 11: Redaction of sensitive connection information
  // ---------------------------------------------------------------------------
  console.log('\n▶ [11/14] Testing Redaction of Sensitive Connection Information...');

  await test('TEST-11.01: redactDatabaseUrl masks passwords and query secrets', () => {
    const raw = 'postgresql://skillverse_app:MySuperSecretP@ssw0rd!@ep-xyz-pooler.neon.tech/neondb?sslmode=require&auth_token=tok_secret123';
    const redacted = redactDatabaseUrl(raw);
    assert(!redacted.includes('MySuperSecretP@ssw0rd!'), 'Must not contain plaintext password');
    assert(!redacted.includes('tok_secret123'), 'Must not contain token query param');
    assert(redacted.includes('***'), 'Must contain masked *** placeholder');
    assert(redacted.includes('skillverse_app'), 'Must preserve username');
    assert(redacted.includes('ep-xyz-pooler.neon.tech'), 'Must preserve host');
  });

  await test('TEST-11.02: Database parsing error messages do not leak passwords', () => {
    try {
      parseDatabaseUrl('postgresql://invalid_admin:SuperSecretPlaintextPassword@/db', 'TEST_VAR');
      assert.fail('Should have thrown on invalid host');
    } catch (err: any) {
      assert(!err.message.includes('SuperSecretPlaintextPassword'), 'Error message must not contain password');
    }
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 12: Alternate database initialization paths & auto-DDL lockdown
  // ---------------------------------------------------------------------------
  console.log('\n▶ [12/14] Testing Alternate Initialization Paths & Auto-DDL Lockdown...');

  await test('TEST-12.01: syncDatabaseSchema() throws immediately in production mode', async () => {
    const origEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    try {
      let blocked = false;
      try {
        await syncDatabaseSchema();
      } catch (err: any) {
        blocked = err.message.includes('Runtime schema synchronization and auto-DDL are strictly prohibited');
      }
      assert(blocked, 'syncDatabaseSchema() must be strictly blocked in production');
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });

  await test('TEST-12.02: assertNoAutoDDLInProduction throws with explicit action name', () => {
    const origEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    try {
      let blocked = false;
      try {
        assertNoAutoDDLInProduction('automated table migration');
      } catch (err: any) {
        blocked = err.message.includes('automated table migration cannot be executed in production');
      }
      assert(blocked, 'Must throw error specifying action');
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 13: Fail-closed behavior when configuration is invalid
  // ---------------------------------------------------------------------------
  console.log('\n▶ [13/14] Testing Fail-Closed Synchronous Behavior...');

  await test('TEST-13.01: validateRuntimeDatabaseConfig throws synchronously on invalid config', () => {
    assert.throws(
      () => validateRuntimeDatabaseConfig({ NODE_ENV: 'production' }),
      /\[DB Security Failure\]/
    );
  });

  await test('TEST-13.02: validateMigratorDatabaseConfig throws synchronously on invalid config', () => {
    assert.throws(
      () => validateMigratorDatabaseConfig({ NODE_ENV: 'production' }),
      /\[DB Security Failure\]/
    );
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 14: Regression coverage for authentication & authorization
  // ---------------------------------------------------------------------------
  console.log('\n▶ [14/14] Testing Authentication & Authorization Regression Coverage...');

  await test('TEST-14.01: Development mode safely uses fallback without throwing', () => {
    const config = validateRuntimeDatabaseConfig({ NODE_ENV: 'development' });
    assert.strictEqual(config.isProduction, false);
    assert(config.connectionString.length > 0);
  });

  await test('TEST-14.02: Demo auth is strictly disabled in production mode', () => {
    const origEnv = process.env.NODE_ENV;
    const origDemo = process.env.ENABLE_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    process.env.ENABLE_DEMO_AUTH = 'true'; // Attempt override

    try {
      assert.strictEqual(isDemoAuthEnabled(), false, 'Demo auth must remain false in production');
    } finally {
      (process.env as any).NODE_ENV = origEnv;
      if (origDemo !== undefined) process.env.ENABLE_DEMO_AUTH = origDemo;
      else delete process.env.ENABLE_DEMO_AUTH;
    }
  });

  await test('TEST-14.03: AuthorizationGuard.requireResourceOwner blocks cross-user IDOR', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-user-id': '00000000-0000-0000-0000-000000000001' },
    });
    // In unauthenticated context, requireResourceOwner returns 401 or 403
    const authResult = await AuthorizationGuard.requireResourceOwner(req, '00000000-0000-0000-0000-000000000002');
    assert(!authResult.authorized, 'Cross-user access must be denied');
    assert(authResult.response !== undefined);
  });

  await test('TEST-14.04: AuthorizationGuard.requireCompanyMembership blocks cross-company access', async () => {
    const req = new NextRequest('http://localhost:3000/api/company/test', {
      headers: { 'x-company-id': '00000000-0000-0000-0000-000000000001' },
    });
    const authResult = await AuthorizationGuard.requireCompanyMembership(
      req,
      '00000000-0000-0000-0000-000000000002',
      'company_admin'
    );
    assert(!authResult.authorized, 'Cross-company access must be denied');
    assert(authResult.response !== undefined);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 15: Static SQL Security & Idempotency Invariants (Phase R7B)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [15/15] Testing Static Migration SQL Invariants & Ownership Model...');

  await test('TEST-15.01: phase44-least-privilege-roles.sql provisions roles with NOLOGIN and NO placeholder passwords', () => {
    const sqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    assert(!content.includes('REPLACE_WITH_STAGING_APP_SECRET'), 'Must not contain static app placeholder password');
    assert(!content.includes('REPLACE_WITH_STAGING_MIGRATOR_SECRET'), 'Must not contain static migrator placeholder password');
    const nonCommentSql = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    assert(!nonCommentSql.includes("PASSWORD '"), 'Must not embed static PASSWORD clauses in executable role creation');
    assert(nonCommentSql.includes('NOLOGIN'), 'Roles must initially be provisioned with NOLOGIN');
  });

  await test('TEST-15.02: phase44-least-privilege-roles.sql explicitly declares NOBYPASSRLS on both roles', () => {
    const sqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    const matches = content.match(/NOBYPASSRLS/g) || [];
    assert(matches.length >= 2, `Both skillverse_app and skillverse_migrator must declare NOBYPASSRLS (found ${matches.length})`);
  });

  await test('TEST-15.03: phase44-least-privilege-roles.sql transfers table and sequence ownership to skillverse_migrator', () => {
    const sqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    assert(content.includes('ALTER TABLE public.%I OWNER TO skillverse_migrator'), 'Must transfer table ownership to skillverse_migrator');
    assert(content.includes('ALTER SEQUENCE public.%I OWNER TO skillverse_migrator'), 'Must transfer sequence ownership to skillverse_migrator');
    assert(content.includes('ALTER SCHEMA drizzle OWNER TO skillverse_migrator'), 'Must transfer drizzle schema ownership to skillverse_migrator');
  });

  await test('TEST-15.04: phase44-least-privilege-roles-rollback.sql guards role commands with existence checks', () => {
    const sqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles-rollback.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    assert(content.includes('v_migrator_exists'), 'Must check if skillverse_migrator exists');
    assert(content.includes('v_app_exists'), 'Must check if skillverse_app exists');
    assert(content.includes('DROP ROLE IF EXISTS skillverse_app'), 'Must use DROP ROLE IF EXISTS for skillverse_app');
    assert(content.includes('DROP ROLE IF EXISTS skillverse_migrator'), 'Must use DROP ROLE IF EXISTS for skillverse_migrator');
  });

  await test('TEST-15.05: phase44-better-auth-migration.sql does not define redundant secondary index on sessions.token', () => {
    const sqlPath = path.resolve(__dirname, '../database/migrations/phase44-better-auth-migration.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    assert(!content.includes('CREATE INDEX IF NOT EXISTS idx_sessions_token'), 'Must not define redundant secondary index on sessions.token');
    assert(content.includes('token text NOT NULL UNIQUE'), 'Must define UNIQUE constraint on token');
  });

  await test('TEST-15.06: Custom enum type ownership transfer is present, scoped, and restored symmetrically', () => {
    const forwardPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles.sql');
    const rollbackPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles-rollback.sql');
    const forwardContent = fs.readFileSync(forwardPath, 'utf-8');
    const rollbackContent = fs.readFileSync(rollbackPath, 'utf-8');

    // Forward verification
    assert(forwardContent.includes("ALTER TYPE public.%I OWNER TO skillverse_migrator"), 'Must transfer enum types to skillverse_migrator');
    assert(forwardContent.includes("n.nspname = 'public'"), 'Enum transfer must strictly scope to schema public');
    assert(forwardContent.includes("t.typtype = 'e'"), 'Type transfer must strictly target enum types (typtype = e)');
    assert(forwardContent.includes("t.typowner = v_db_owner::regrole"), 'Type transfer must filter to db owner');

    // Rollback symmetry verification
    assert(rollbackContent.includes("REASSIGN OWNED BY skillverse_migrator TO %I"), 'Rollback must reassign all migrator-owned objects (including types) to db owner');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 16: Operational Runbook, Credential Handling & Draining Gates (Phase 44H)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [16/16] Testing Operational Runbooks, Credential Safety & Connection Draining Gates...');

  await test('TEST-16.01: Production runbooks pass zero password-bearing connection URIs to psql', () => {
    const prodRunbookPath = path.resolve(__dirname, '../docs/PHASE_44_PRODUCTION_RUNBOOK.md');
    const rollbackRunbookPath = path.resolve(__dirname, '../docs/PHASE_44_ROLLBACK_AND_RECOVERY_RUNBOOK.md');
    const prodRunbook = fs.readFileSync(prodRunbookPath, 'utf-8');
    const rollbackRunbook = fs.readFileSync(rollbackRunbookPath, 'utf-8');

    // Reject psql "postgres://...:password@..." or psql "$MIGRATOR_URL" where URL has password
    const psqlUriRegex = /psql\s+["']?postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/i;
    assert(!psqlUriRegex.test(prodRunbook), 'Production runbook must not pass password-bearing URI to psql CLI');
    assert(!psqlUriRegex.test(rollbackRunbook), 'Rollback runbook must not pass password-bearing URI to psql CLI');
    assert(!prodRunbook.includes('psql "$MIGRATOR_URL"'), 'Production runbook must not pass $MIGRATOR_URL CLI argument');

    // Confirm presence of secure PGPASSFILE standard
    assert(prodRunbook.includes('PGPASSFILE'), 'Production runbook must instruct PGPASSFILE authentication');
    assert(rollbackRunbook.includes('PGPASSFILE'), 'Rollback runbook must instruct PGPASSFILE authentication');
  });

  await test('TEST-16.02: Zero hardcoded or static credentials exist in migration scripts and runbooks', () => {
    const forwardSqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles.sql');
    const rollbackSqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles-rollback.sql');
    const authSqlPath = path.resolve(__dirname, '../database/migrations/phase44-better-auth-migration.sql');
    const prodRunbookPath = path.resolve(__dirname, '../docs/PHASE_44_PRODUCTION_RUNBOOK.md');

    const forwardSql = fs.readFileSync(forwardSqlPath, 'utf-8');
    const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf-8');
    const authSql = fs.readFileSync(authSqlPath, 'utf-8');
    const prodRunbook = fs.readFileSync(prodRunbookPath, 'utf-8');

    assert(!forwardSql.includes('__APP_ROLE_PASSWORD__'), 'Must not contain old placeholder password');
    assert(!forwardSql.includes('__MIGRATOR_ROLE_PASSWORD__'), 'Must not contain old placeholder password');
    assert(!prodRunbook.includes('__APP_ROLE_PASSWORD__'), 'Runbook must not reference outdated placeholders');
    assert(!rollbackSql.includes('PASSWORD'), 'Rollback SQL must not contain credentials');
    assert(!authSql.includes('PASSWORD'), 'Auth SQL must not contain credentials');
  });

  await test('TEST-16.03: Rollback instructions enforce mandatory connection draining gate before role drop', () => {
    const rollbackRunbookPath = path.resolve(__dirname, '../docs/PHASE_44_ROLLBACK_AND_RECOVERY_RUNBOOK.md');
    const content = fs.readFileSync(rollbackRunbookPath, 'utf-8');

    // Confirm the required 7-step operational lifecycle is documented
    assert(content.includes('Stop or Redirect Application Traffic'), 'Must document traffic redirection');
    assert(content.includes('Update Vercel Environment Configuration'), 'Must document Vercel env update');
    assert(content.includes('Redeploy or Enforce Maintenance Mode'), 'Must document redeployment/maintenance mode');
    assert(content.includes('Drain Application Connection Pools'), 'Must document pool draining');
    assert(content.includes('Verify Zero Remaining Connections'), 'Must document mandatory verification gate');
    assert(content.includes('Execute Rollback Only After Verification Gate Passes'), 'Must enforce gate before rollback');
    assert(content.includes('Verify Ownership Restoration & Role Removal'), 'Must document verification of ownership and role removal');

    // Confirm pg_stat_activity query for verification gate
    assert(content.includes('pg_catalog.pg_stat_activity'), 'Must query pg_stat_activity for verification gate');
    assert(content.includes("WHERE usename IN ('skillverse_app', 'skillverse_migrator')"), 'Must filter to target roles');
  });

  await test('TEST-16.04: Administrative connections are strictly excluded from termination in rollback SQL', () => {
    const rollbackSqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles-rollback.sql');
    const content = fs.readFileSync(rollbackSqlPath, 'utf-8');

    assert(content.includes('SELECT pg_terminate_backend(pid)'), 'Must call pg_terminate_backend');
    assert(content.includes("WHERE usename IN ('skillverse_app', 'skillverse_migrator')"), 'Termination must target only app and migrator roles');
    assert(content.includes('AND pid <> pg_backend_pid()'), 'Must explicitly exclude administrative caller session from termination');
  });

  await test('TEST-16.05: Production runtime configuration continues rejecting administrative credentials', () => {
    const adminRoles = ['neondb_owner', 'postgres', 'root', 'superuser'];
    for (const role of adminRoles) {
      let rejected = false;
      try {
        validateRuntimeDatabaseConfig({
          NODE_ENV: 'production',
          APP_DATABASE_URL: `postgresql://${role}:StrongPass123@ep-staging-pooler.neon.tech/neondb?sslmode=require`,
        });
      } catch (err: any) {
        rejected =
          err.message.includes('rejected connection configured with administrative/owner role') &&
          !err.message.includes('StrongPass123');
      }
      assert(rejected, `Runtime must reject administrative role "${role}" in production`);
    }
  });

  console.log('\n=====================================================================');
  console.log(`  🎉 ALL ${passed}/${total} PHASE 44F ADVERSARIAL TESTS PASSED CLEANLY!`);
  console.log('=====================================================================\n');
}

runPhase44FTests().catch((e) => {
  console.error('Phase 44F test execution failed:', e);
  process.exit(1);
});
