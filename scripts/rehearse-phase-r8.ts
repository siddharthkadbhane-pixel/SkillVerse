/**
 * SkillVerse Phase R8: Disposable Neon Staging Rehearsal Runner
 *
 * Performs a strictly controlled, end-to-end rehearsal against the newly created
 * disposable Neon branch "disposable-rehearsal-r8":
 * 1. Safety Gate Verification (Confirms disposable branch, non-production host)
 * 2. Forward Role Provisioning (phase44-least-privilege-roles.sql)
 * 3. Role Attribute Verification (NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS)
 * 4. Staging Credential Injection (CSPRNG 32-byte secrets via ALTER ROLE ... PASSWORD)
 * 5. Table, Sequence, Enum & Schema Ownership Verification
 * 6. Migration Execution as skillverse_migrator (phase44-better-auth-migration.sql)
 * 7. Runtime Least-Privilege DML & DDL Lockdown Checks as skillverse_app
 * 8. Symmetric Rollback Rehearsal as admin (phase44-least-privilege-roles-rollback.sql)
 * 9. Idempotent Rollback Re-execution on Clean Database
 * 10. Sanitized Reporting & Disposable Branch Teardown
 */

import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import assert from 'assert';

const DISPOSABLE_BRANCH_NAME = 'disposable-rehearsal-r8';
const PROD_SIGNATURE = 'ep-flat-rice-ao8kdffq';

interface StepResult {
  step: string;
  passed: boolean;
  details: string;
}

const results: StepResult[] = [];

function record(step: string, passed: boolean, details: string) {
  results.push({ step, passed, details });
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${icon} ${step}: ${details}`);
}

async function runRehearsal() {
  console.log('=====================================================================');
  console.log('  🛡️ SKILLVERSE PHASE R8 — DISPOSABLE NEON STAGING REHEARSAL');
  console.log('=====================================================================\n');

  // ---------------------------------------------------------------------------
  // STEP 1: Mandatory Safety Gate Verification
  // ---------------------------------------------------------------------------
  console.log('▶ [1/8] Verifying Safety Gate & Disposable Target Identity...');

  let adminConnString: string;
  try {
    adminConnString = execSync(`neon connection-string ${DISPOSABLE_BRANCH_NAME}`, {
      encoding: 'utf-8',
    }).trim();
  } catch (err: any) {
    throw new Error(`Failed to retrieve connection string for ${DISPOSABLE_BRANCH_NAME}: ${err.message}`);
  }

  const parsedAdminUrl = new URL(adminConnString);
  const host = parsedAdminUrl.hostname;
  const dbName = parsedAdminUrl.pathname.replace(/^\//, '');

  if (host.includes(PROD_SIGNATURE)) {
    throw new Error(`CRITICAL SECURITY HALT: Target host "${host}" matches known production signature!`);
  }

  record(
    'Step 1.01: Target Isolation',
    !host.includes(PROD_SIGNATURE),
    `Target host "${host}" is distinct from production. Database: "${dbName}"`
  );

  const adminClient = postgres(adminConnString, { ssl: 'require', max: 1, prepare: false });

  try {
    // Confirm connection as administrative owner
    const [userRes] = await adminClient`SELECT current_user, current_database();`;
    const adminUser = userRes.current_user;
    record(
      'Step 1.02: Admin Connection Handshake',
      Boolean(adminUser),
      `Connected to disposable branch as "${adminUser}" in "${userRes.current_database}"`
    );

    // -------------------------------------------------------------------------
    // STEP 2: Forward Provisioning Rehearsal
    // -------------------------------------------------------------------------
    console.log('\n▶ [2/8] Executing Forward Role Provisioning (phase44-least-privilege-roles.sql)...');

    const forwardSqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles.sql');
    const forwardSql = fs.readFileSync(forwardSqlPath, 'utf-8');

    // Execute forward migration SQL as admin
    await adminClient.unsafe(forwardSql);
    record('Step 2.01: Forward Migration Execution', true, 'phase44-least-privilege-roles.sql executed successfully');

    // Inspect role attributes
    const roleRows = await adminClient`
      SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolinherit, rolbypassrls
      FROM pg_catalog.pg_roles
      WHERE rolname IN ('skillverse_app', 'skillverse_migrator')
      ORDER BY rolname;
    `;

    assert.strictEqual(roleRows.length, 2, 'Both roles must exist in pg_roles');

    const appRole = roleRows.find((r: any) => r.rolname === 'skillverse_app');
    const migratorRole = roleRows.find((r: any) => r.rolname === 'skillverse_migrator');

    assert(appRole, 'skillverse_app must exist');
    assert(migratorRole, 'skillverse_migrator must exist');

    // Verify NOLOGIN initially
    assert.strictEqual(appRole.rolcanlogin, false, 'skillverse_app must initially have NOLOGIN');
    assert.strictEqual(migratorRole.rolcanlogin, false, 'skillverse_migrator must initially have NOLOGIN');
    record('Step 2.02: Initial NOLOGIN Verification', true, 'Both roles verified with NOLOGIN (no static passwords)');

    // Verify explicit security attributes
    assert.strictEqual(appRole.rolsuper, false, 'skillverse_app NOSUPERUSER');
    assert.strictEqual(appRole.rolcreatedb, false, 'skillverse_app NOCREATEDB');
    assert.strictEqual(appRole.rolcreaterole, false, 'skillverse_app NOCREATEROLE');
    assert.strictEqual(appRole.rolbypassrls, false, 'skillverse_app NOBYPASSRLS');
    assert.strictEqual(appRole.rolinherit, false, 'skillverse_app NOINHERIT');

    assert.strictEqual(migratorRole.rolsuper, false, 'skillverse_migrator NOSUPERUSER');
    assert.strictEqual(migratorRole.rolcreatedb, false, 'skillverse_migrator NOCREATEDB');
    assert.strictEqual(migratorRole.rolcreaterole, false, 'skillverse_migrator NOCREATEROLE');
    assert.strictEqual(migratorRole.rolbypassrls, false, 'skillverse_migrator NOBYPASSRLS');
    assert.strictEqual(migratorRole.rolinherit, true, 'skillverse_migrator INHERIT');

    record('Step 2.03: Role Security Attributes', true, 'NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS verified on both roles');

    // -------------------------------------------------------------------------
    // STEP 3: Staging Credential Injection & Authentication Verification
    // -------------------------------------------------------------------------
    console.log('\n▶ [3/8] Injecting 32-Byte CSPRNG Staging Secrets & Verifying Login...');

    const stagingAppSecret = crypto.randomBytes(32).toString('hex');
    const stagingMigratorSecret = crypto.randomBytes(32).toString('hex');

    // Securely bind passwords and enable login
    await adminClient.unsafe(`ALTER ROLE skillverse_app WITH LOGIN PASSWORD '${stagingAppSecret}';`);
    await adminClient.unsafe(`ALTER ROLE skillverse_migrator WITH LOGIN PASSWORD '${stagingMigratorSecret}';`);

    record('Step 3.01: Credential Binding', true, 'Distinct 64-hex (32-byte) CSPRNG passwords bound via ALTER ROLE');

    // Build connection strings for both roles (direct unpooled endpoint)
    const appConnUrl = new URL(adminConnString);
    appConnUrl.username = 'skillverse_app';
    appConnUrl.password = stagingAppSecret;

    const migratorConnUrl = new URL(adminConnString);
    migratorConnUrl.username = 'skillverse_migrator';
    migratorConnUrl.password = stagingMigratorSecret;

    // Verify login as skillverse_app
    const testAppClient = postgres(appConnUrl.toString(), { ssl: 'require', max: 1, prepare: false });
    const [appCheck] = await testAppClient`SELECT current_user;`;
    assert.strictEqual(appCheck.current_user, 'skillverse_app');
    await testAppClient.end();
    record('Step 3.02: App Role Login Handshake', true, 'Connected successfully as skillverse_app');

    // Verify login as skillverse_migrator
    const testMigratorClient = postgres(migratorConnUrl.toString(), { ssl: 'require', max: 1, prepare: false });
    const [migratorCheck] = await testMigratorClient`SELECT current_user;`;
    assert.strictEqual(migratorCheck.current_user, 'skillverse_migrator');
    record('Step 3.03: Migrator Role Login Handshake', true, 'Connected successfully as skillverse_migrator');

    // -------------------------------------------------------------------------
    // STEP 4: Scoped Ownership Verification
    // -------------------------------------------------------------------------
    console.log('\n▶ [4/8] Verifying Scoped Table, Sequence, Enum & Schema Ownership...');

    const tableRows = await adminClient`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public';
    `;
    const nonMigratorTables = tableRows.filter((r: any) => r.tableowner !== 'skillverse_migrator');
    assert.strictEqual(nonMigratorTables.length, 0, `All public tables must be owned by skillverse_migrator (untransferred: ${nonMigratorTables.length})`);
    record('Step 4.01: Table Ownership', true, `All ${tableRows.length} public tables verified owned by skillverse_migrator`);

    const seqRows = await adminClient`
      SELECT sequencename, sequenceowner
      FROM pg_sequences
      WHERE schemaname = 'public';
    `;
    const nonMigratorSeqs = seqRows.filter((r: any) => r.sequenceowner !== 'skillverse_migrator');
    assert.strictEqual(nonMigratorSeqs.length, 0, `All public sequences must be owned by skillverse_migrator (untransferred: ${nonMigratorSeqs.length})`);
    record('Step 4.02: Sequence Ownership', true, `All ${seqRows.length} public sequences verified owned by skillverse_migrator`);

    const enumRows = await adminClient`
      SELECT t.typname, t.typowner::regrole::text as owner
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e';
    `;
    const nonMigratorEnums = enumRows.filter((r: any) => r.owner !== 'skillverse_migrator');
    assert.strictEqual(nonMigratorEnums.length, 0, `All custom enums must be owned by skillverse_migrator (untransferred: ${nonMigratorEnums.length})`);
    record('Step 4.03: Enum Ownership', true, `All ${enumRows.length} public enum types verified owned by skillverse_migrator`);

    const [drizzleSchema] = await adminClient`
      SELECT schema_owner
      FROM information_schema.schemata
      WHERE schema_name = 'drizzle';
    `;
    assert.strictEqual(drizzleSchema?.schema_owner, 'skillverse_migrator');
    record('Step 4.04: Schema Drizzle Ownership', true, 'drizzle schema verified owned by skillverse_migrator');

    // -------------------------------------------------------------------------
    // STEP 5: Migration Execution as skillverse_migrator
    // -------------------------------------------------------------------------
    console.log('\n▶ [5/8] Running Phase 44 Migration as skillverse_migrator (phase44-better-auth-migration.sql)...');

    const betterAuthSqlPath = path.resolve(__dirname, '../database/migrations/phase44-better-auth-migration.sql');
    const betterAuthSql = fs.readFileSync(betterAuthSqlPath, 'utf-8');

    // Execute migration using migrator connection
    await testMigratorClient.unsafe(betterAuthSql);
    record('Step 5.01: DDL Migration Execution', true, 'Executed phase44-better-auth-migration.sql under skillverse_migrator with ZERO errors');

    // Verify Better Auth tables exist
    const authTableRows = await testMigratorClient`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('sessions', 'accounts', 'verifications');
    `;
    assert.strictEqual(authTableRows.length, 3, 'sessions, accounts, verifications must exist');
    assert(authTableRows.every((r: any) => r.tableowner === 'skillverse_migrator'), 'New tables must be owned by skillverse_migrator');
    record('Step 5.02: Better Auth Tables Created', true, 'sessions, accounts, verifications exist and owned by skillverse_migrator');

    // Verify email_verified column on users
    const [colCheck] = await testMigratorClient`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email_verified';
    `;
    assert.strictEqual(colCheck?.column_name, 'email_verified');
    record('Step 5.03: users.email_verified Column', true, 'Column email_verified added to users table');

    // Verify unique index on sessions(token) and absence of duplicate index
    const indexRows = await testMigratorClient`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'sessions';
    `;
    const hasUniqueConstraintIndex = indexRows.some((r: any) => r.indexname.includes('token_key') || r.indexdef.includes('UNIQUE'));
    const hasDuplicateSecondaryIndex = indexRows.some((r: any) => r.indexname === 'idx_sessions_token');

    assert(hasUniqueConstraintIndex, 'sessions table must have unique constraint on token');
    assert(!hasDuplicateSecondaryIndex, 'sessions table must NOT have duplicate idx_sessions_token index');
    record('Step 5.04: Index Optimization Verification', true, 'Unique constraint index active; duplicate secondary index absent');

    await testMigratorClient.end();

    // -------------------------------------------------------------------------
    // STEP 6: Runtime Least-Privilege Verification as skillverse_app
    // -------------------------------------------------------------------------
    console.log('\n▶ [6/8] Testing Runtime Least-Privilege DML & DDL Lockdown as skillverse_app...');

    const appClient = postgres(appConnUrl.toString(), { ssl: 'require', max: 1, prepare: false });

    // DML Tests (using disposable test user)
    const testUserId = crypto.randomUUID();
    const testEmail = `rehearsal_${Date.now()}@skillverse.dev`;

    await appClient`
      INSERT INTO users (id, email, username, name, role)
      VALUES (${testUserId}, ${testEmail}, ${'rehearsal_' + testUserId.slice(0, 8)}, 'Rehearsal User', 'developer');
    `;
    record('Step 6.01: Runtime DML INSERT', true, 'INSERT into users succeeded');

    const [readRow] = await appClient`SELECT id, email, role FROM users WHERE id = ${testUserId};`;
    assert.strictEqual(readRow?.email, testEmail);
    record('Step 6.02: Runtime DML SELECT', true, 'SELECT from users succeeded');

    await appClient`UPDATE users SET name = 'Updated Rehearsal User' WHERE id = ${testUserId};`;
    record('Step 6.03: Runtime DML UPDATE', true, 'UPDATE on users succeeded');

    await appClient`DELETE FROM users WHERE id = ${testUserId};`;
    record('Step 6.04: Runtime DML DELETE', true, 'DELETE on users succeeded');

    // DDL Lockdown Test: CREATE TABLE must fail
    let createBlocked = false;
    try {
      await appClient.unsafe('CREATE TABLE test_unauthorized_table (id int);');
    } catch (err: any) {
      createBlocked = err.message.includes('permission denied for schema public');
    }
    assert(createBlocked, 'skillverse_app must be blocked from CREATE TABLE');
    record('Step 6.05: DDL Lockdown (CREATE TABLE)', true, 'CREATE TABLE blocked: "permission denied for schema public"');

    // TRUNCATE Lockdown Test: TRUNCATE TABLE must fail
    let truncateBlocked = false;
    try {
      await appClient.unsafe('TRUNCATE TABLE users;');
    } catch (err: any) {
      truncateBlocked = err.message.includes('permission denied for table users');
    }
    assert(truncateBlocked, 'skillverse_app must be blocked from TRUNCATE TABLE');
    record('Step 6.06: TRUNCATE Lockdown', true, 'TRUNCATE TABLE blocked: "permission denied for table users"');

    await appClient.end();

    // -------------------------------------------------------------------------
    // STEP 7: Rollback Rehearsal
    // -------------------------------------------------------------------------
    console.log('\n▶ [7/8] Executing Rollback Rehearsal (phase44-least-privilege-roles-rollback.sql)...');

    // First revert Better Auth schema changes
    const rollbackAuthSqlPath = path.resolve(__dirname, '../database/migrations/phase44-better-auth-rollback.sql');
    const rollbackAuthSql = fs.readFileSync(rollbackAuthSqlPath, 'utf-8');
    await adminClient.unsafe(rollbackAuthSql);
    record('Step 7.01: Better Auth Rollback', true, 'Dropped sessions, accounts, verifications and email_verified');

    // Then execute least-privilege roles rollback
    const rollbackRolesSqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles-rollback.sql');
    const rollbackRolesSql = fs.readFileSync(rollbackRolesSqlPath, 'utf-8');
    await adminClient.unsafe(rollbackRolesSql);
    record('Step 7.02: Role Rollback Execution', true, 'phase44-least-privilege-roles-rollback.sql executed successfully');

    // Verify ownership restored to admin
    const [sampleTable] = await adminClient`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public'
      LIMIT 1;
    `;
    assert.strictEqual(sampleTable.tableowner, adminUser);
    record('Step 7.03: Table Ownership Reversion', true, `Table ownership restored to administrative owner "${adminUser}"`);

    // Verify roles dropped
    const remainingRoles = await adminClient`
      SELECT rolname FROM pg_roles WHERE rolname IN ('skillverse_app', 'skillverse_migrator');
    `;
    assert.strictEqual(remainingRoles.length, 0, 'Roles must be dropped cleanly');
    record('Step 7.04: Roles Dropped Cleanly', true, 'skillverse_app and skillverse_migrator dropped from pg_roles');

    // Verify idempotent rollback re-execution on clean database
    await adminClient.unsafe(rollbackRolesSql);
    record('Step 7.05: Rollback Idempotency', true, 'Repeated rollback on clean database succeeded with zero errors');

    console.log('\n=====================================================================');
    console.log('  🎉 ALL DISPOSABLE STAGING REHEARSAL STEPS PASSED CLEANLY!');
    console.log('=====================================================================\n');
  } finally {
    await adminClient.end();
  }

  // ---------------------------------------------------------------------------
  // STEP 8: Cleanup — Delete Disposable Branch
  // ---------------------------------------------------------------------------
  console.log('▶ [8/8] Tearing Down Disposable Branch...');
  try {
    execSync(`neon branches delete ${DISPOSABLE_BRANCH_NAME}`, { stdio: 'inherit' });
    record('Step 8.01: Teardown', true, `Disposable branch "${DISPOSABLE_BRANCH_NAME}" deleted successfully`);
  } catch (err: any) {
    record('Step 8.01: Teardown', false, `Failed to delete branch: ${err.message}`);
  }
}

runRehearsal().catch((err) => {
  console.error('\n❌ REHEARSAL FAILED:', err.message);
  process.exit(1);
});
