/**
 * SkillVerse — Phase 44 Rollback Schema Safety Verification
 *
 * Verifies that phase44-least-privilege-roles-rollback.sql:
 * 1. Does NOT drop schema drizzle or execute CASCADE deletion.
 * 2. Safely restores ownership of schema drizzle and drizzle.__drizzle_migrations to the database owner.
 * 3. Restores all public tables, sequences, and enums to the database owner via REASSIGN OWNED.
 * 4. Ensures zero data deletion, zero drop of application tables, and zero loss of migration ledgers.
 * 5. Handles connection termination and role removal idempotently.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function record(id: string, name: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ id, name, status, details });
  const icon = status === 'PASS' ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${icon} ${id}: ${name}`);
  console.log(`     └─ ${details}`);
}

async function runRollbackSafetyChecks() {
  console.log('=====================================================================');
  console.log('  🛡️ SKILLVERSE — PHASE 44 ROLLBACK SCHEMA SAFETY VERIFICATION');
  console.log('=====================================================================\n');

  const rollbackSqlPath = path.resolve(__dirname, '../database/migrations/phase44-least-privilege-roles-rollback.sql');
  assert(fs.existsSync(rollbackSqlPath), 'Rollback script must exist');
  const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf-8');

  const runbookPath = path.resolve(__dirname, '../docs/PHASE_44_ROLLBACK_AND_RECOVERY_RUNBOOK.md');
  assert(fs.existsSync(runbookPath), 'Rollback runbook must exist');
  const runbookContent = fs.readFileSync(runbookPath, 'utf-8');

  // ---------------------------------------------------------------------------
  // TEST 1: No Unsafe DROP SCHEMA ... CASCADE
  // ---------------------------------------------------------------------------
  try {
    // Strip comments to test actual SQL execution statements
    const sqlWithoutComments = rollbackSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    const hasDropSchemaCascade = /DROP\s+SCHEMA\s+(?:IF\s+EXISTS\s+)?drizzle\s+CASCADE/i.test(sqlWithoutComments);
    assert(!hasDropSchemaCascade, 'Rollback script must NOT drop schema drizzle with CASCADE');

    const hasAnyDropSchema = /DROP\s+SCHEMA\s+/i.test(sqlWithoutComments);
    assert(!hasAnyDropSchema, 'Rollback script must NOT drop any schema');

    record(
      'SAFE-01',
      'No broad DROP SCHEMA ... CASCADE in rollback',
      'PASS',
      'Confirmed absence of DROP SCHEMA drizzle CASCADE. The Drizzle schema cannot be deleted.'
    );
  } catch (err: any) {
    record('SAFE-01', 'No broad DROP SCHEMA ... CASCADE in rollback', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Preserves and Restores drizzle Schema Ownership
  // ---------------------------------------------------------------------------
  try {
    assert(
      rollbackSql.includes("ALTER SCHEMA drizzle OWNER TO"),
      'Must restore schema drizzle ownership to database owner'
    );
    assert(
      rollbackSql.includes("ALTER TABLE drizzle.__drizzle_migrations OWNER TO"),
      'Must restore drizzle.__drizzle_migrations table ownership to database owner'
    );
    assert(
      rollbackSql.includes("ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO"),
      'Must restore drizzle.__drizzle_migrations_id_seq sequence ownership to database owner'
    );

    record(
      'SAFE-02',
      'Explicit drizzle schema and migration ledger ownership restoration',
      'PASS',
      'Verified ownership of schema drizzle, __drizzle_migrations table, and sequence are restored to v_db_owner.'
    );
  } catch (err: any) {
    record('SAFE-02', 'Explicit drizzle schema and migration ledger ownership restoration', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Zero Application Table Drops or Data Deletion
  // ---------------------------------------------------------------------------
  try {
    // Assert no DROP TABLE statements
    const dropTableMatches = rollbackSql.match(/DROP\s+TABLE\s+[^;]+;/gi) || [];
    assert.strictEqual(
      dropTableMatches.length,
      0,
      `Rollback script must NOT contain DROP TABLE statements, found: ${dropTableMatches.join(', ')}`
    );

    // Assert no DELETE FROM statements
    const deleteMatches = rollbackSql.match(/DELETE\s+FROM\s+/gi) || [];
    assert.strictEqual(
      deleteMatches.length,
      0,
      `Rollback script must NOT contain DELETE FROM statements, found: ${deleteMatches.join(', ')}`
    );

    // Assert no TRUNCATE statements
    const truncateMatches = rollbackSql.match(/TRUNCATE\s+/gi) || [];
    assert.strictEqual(
      truncateMatches.length,
      0,
      `Rollback script must NOT contain TRUNCATE statements, found: ${truncateMatches.join(', ')}`
    );

    record(
      'SAFE-03',
      'Zero application table drops, truncations, or deletions',
      'PASS',
      'Confirmed 0 DROP TABLE, 0 DELETE FROM, and 0 TRUNCATE statements in role rollback script.'
    );
  } catch (err: any) {
    record('SAFE-03', 'Zero application table drops, truncations, or deletions', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Reassign Owned and Drop Owned Safeguards
  // ---------------------------------------------------------------------------
  try {
    assert(
      rollbackSql.includes('REASSIGN OWNED BY skillverse_migrator TO'),
      'Must reassign all objects owned by skillverse_migrator to v_db_owner'
    );
    assert(
      rollbackSql.includes('DROP OWNED BY skillverse_migrator'),
      'Must drop remaining privileges owned by skillverse_migrator before dropping role'
    );
    assert(
      rollbackSql.includes('DROP OWNED BY skillverse_app'),
      'Must drop remaining privileges owned by skillverse_app before dropping role'
    );

    record(
      'SAFE-04',
      'Complete object reassignment before role dropping',
      'PASS',
      'Verified REASSIGN OWNED BY skillverse_migrator TO v_db_owner reclaims all schema objects.'
    );
  } catch (err: any) {
    record('SAFE-04', 'Complete object reassignment before role dropping', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Active Connection Termination and Safe Role Drop
  // ---------------------------------------------------------------------------
  try {
    assert(
      rollbackSql.includes('pg_terminate_backend(pid)'),
      'Must terminate active connections for target roles'
    );
    assert(
      rollbackSql.includes("usename IN ('skillverse_app', 'skillverse_migrator')"),
      'Must target connections for skillverse_app and skillverse_migrator'
    );
    assert(
      rollbackSql.includes('DROP ROLE IF EXISTS skillverse_app;'),
      'Must drop skillverse_app safely with IF EXISTS'
    );
    assert(
      rollbackSql.includes('DROP ROLE IF EXISTS skillverse_migrator;'),
      'Must drop skillverse_migrator safely with IF EXISTS'
    );

    record(
      'SAFE-05',
      'Connection draining and idempotent role removal',
      'PASS',
      'Verified active connections are terminated and roles are dropped with IF EXISTS.'
    );
  } catch (err: any) {
    record('SAFE-05', 'Connection draining and idempotent role removal', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Rollback Runbook Documentation Alignment
  // ---------------------------------------------------------------------------
  try {
    assert(
      runbookContent.includes('drizzle schema and migration ledger preserved and restored to neondb_owner'),
      'Runbook must verify that drizzle schema and ledger are preserved'
    );
    assert(
      runbookContent.includes("WHERE n.nspname = 'drizzle' AND t.tableowner != 'neondb_owner'"),
      'Runbook must include exact verification query for drizzle schema post-rollback'
    );

    record(
      'SAFE-06',
      'Rollback runbook verification query alignment',
      'PASS',
      'Runbook documents non-destructive schema preservation and includes post-rollback verification queries.'
    );
  } catch (err: any) {
    record('SAFE-06', 'Rollback runbook verification query alignment', 'FAIL', err.message);
  }

  console.log('\n=====================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`  VERIFICATION SUMMARY: ${passCount} PASS / ${failCount} FAIL (Total: ${results.length})`);
  console.log('=====================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runRollbackSafetyChecks().catch((err) => {
  console.error('Safety check failed:', err);
  process.exit(1);
});
