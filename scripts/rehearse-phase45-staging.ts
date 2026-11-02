/**
 * SkillVerse Phase 45: Live Staging Validation & Migration Rehearsal Runner
 * Target: Neon Serverless Branch "phase44-staging-rehearsal"
 * Host: ep-cool-water-ao1glsmz.c-2.ap-southeast-1.aws.neon.tech
 *
 * STRICT SAFETY RULES:
 * 1. Confirms target host is ep-cool-water-ao1glsmz. Rejects ep-flat-rice-ao8kdffq (PROD) with fatal halt.
 * 2. Connects with verified staging credentials and switches role to skillverse_migrator for DDL.
 * 3. Applies forward migration (phase45-provenance-and-deletion.sql).
 * 4. Empirically verifies added columns, defaults ('unknown'), nullability, and indexes.
 * 5. Performs live staging DML tests (review default provenance, tri-state updates, and atomic account deletion).
 * 6. Executes rollback migration (phase45-provenance-and-deletion-rollback.sql) and verifies clean reversal.
 * 7. Re-applies forward migration to leave staging in the verified forward state.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const PROD_HOST_SIGNATURE = 'ep-flat-rice-ao8kdffq';
const STAGING_HOST_SIGNATURE = 'ep-cool-water-ao1glsmz';
const STAGING_CONN_URL = 'postgresql://neondb_owner:npg_WnFmRkxzHg02@ep-cool-water-ao1glsmz.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(step: string, passed: boolean, details: string) {
  results.push({ step, passed, details });
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${icon} ${step}: ${details}`);
}

async function runStagingValidation() {
  console.log('\n=====================================================================');
  console.log('🛡️ SKILLVERSE PHASE 45: LIVE STAGING MIGRATION & REHEARSAL RUNNER');
  console.log('=====================================================================\n');

  // ---------------------------------------------------------------------------
  // STEP 1: Mandatory Host Safety Gate
  // ---------------------------------------------------------------------------
  console.log('▶ [1/6] Verifying Target Endpoint Safety Gate...');
  const parsed = new URL(STAGING_CONN_URL);
  if (parsed.hostname.includes(PROD_HOST_SIGNATURE)) {
    throw new Error(`CRITICAL SECURITY FAILURE: Target host "${parsed.hostname}" matches production signature!`);
  }
  if (!parsed.hostname.includes(STAGING_HOST_SIGNATURE)) {
    throw new Error(`CRITICAL SECURITY FAILURE: Target host "${parsed.hostname}" does not match staging compute!`);
  }
  record('Host Safety Gate', true, `Target confirmed as staging: ${parsed.hostname}`);

  const sql = postgres(STAGING_CONN_URL, { max: 1, connect_timeout: 15, ssl: 'require' });

  try {
    const [ident] = await sql`SELECT current_user, session_user, current_database()`;
    record('Staging Connection', true, `Connected as ${ident.session_user} to db ${ident.current_database}`);

    // Set role to skillverse_migrator for DDL
    await sql`SET ROLE skillverse_migrator`;
    const [migIdent] = await sql`SELECT current_user, session_user`;
    record('Migrator Role Activation', migIdent.current_user === 'skillverse_migrator', `Active role set to ${migIdent.current_user}`);

    // ---------------------------------------------------------------------------
    // STEP 2: Execute Forward Migration
    // ---------------------------------------------------------------------------
    console.log('\n▶ [2/6] Executing Phase 45 Forward Migration (phase45-provenance-and-deletion.sql)...');
    const migrationSqlPath = path.resolve(process.cwd(), 'database/migrations/phase45-provenance-and-deletion.sql');
    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf-8');

    await sql.unsafe(migrationSql);
    record('Migration DDL Execution', true, 'phase45-provenance-and-deletion.sql executed without error');

    // ---------------------------------------------------------------------------
    // STEP 3: Verify Schema Post-Migration
    // ---------------------------------------------------------------------------
    console.log('\n▶ [3/6] Verifying Applied Schema Columns, Defaults and Indexes...');

    // 3A. Check reviews columns
    const reviewsCols = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name IN ('provenance_status', 'model_provider', 'model_name')
      ORDER BY column_name
    `;
    const provCol = reviewsCols.find(c => c.column_name === 'provenance_status');
    const provDefaultCorrect = provCol && provCol.column_default?.includes('unknown') && provCol.is_nullable === 'NO';
    record('reviews.provenance_status column', Boolean(provDefaultCorrect), `default=${provCol?.column_default}, nullable=${provCol?.is_nullable}`);

    const provModel = reviewsCols.find(c => c.column_name === 'model_name');
    const provProvider = reviewsCols.find(c => c.column_name === 'model_provider');
    record('reviews model columns', Boolean(provModel && provProvider), `model_provider and model_name present`);

    // 3B. Check review_history columns
    const historyCols = await sql`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'review_history' AND column_name IN ('provenance_status', 'model_provider', 'model_name')
      ORDER BY column_name
    `;
    const histProv = historyCols.find(c => c.column_name === 'provenance_status');
    record('review_history provenance columns', Boolean(histProv?.column_default?.includes('unknown')), `default=${histProv?.column_default}`);

    // 3C. Check user_skills column
    const userSkillsCols = await sql`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_skills' AND column_name = 'provenance_status'
    `;
    const usProv = userSkillsCols[0];
    record('user_skills.provenance_status column', Boolean(usProv && usProv.column_default?.includes('unknown') && usProv.is_nullable === 'NO'), `default=${usProv?.column_default}, nullable=${usProv?.is_nullable}`);

    // 3D. Check indexes
    const indexes = await sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname IN ('idx_reviews_provenance', 'idx_user_skills_provenance')
      ORDER BY indexname
    `;
    record('Indexes Created', indexes.length === 2, `Found ${indexes.length}/2 indexes: ${indexes.map(i => i.indexname).join(', ')}`);

    // ---------------------------------------------------------------------------
    // STEP 4: Live Staging DML Verification
    // ---------------------------------------------------------------------------
    console.log('\n▶ [4/6] Executing Live Staging DML Tests (Default Provenance & Atomic Account Deletion)...');
    const probeRunId = Date.now().toString(36);
    const probeUserId = `00000000-0000-4000-a000-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;
    const probeRepoId = `11111111-0000-4000-a000-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;
    const probeCompanyId = `22222222-0000-4000-a000-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;
    const probeJobId = `33333333-0000-4000-a000-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;
    const probeSkillId = `44444444-0000-4000-a000-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;

    try {
      // 4A. Insert probe user
      await sql`
        INSERT INTO users (id, email, username, name, role, github_id, github_token, email_verified)
        VALUES (${probeUserId}, ${`probe_${probeRunId}@skillverse.dev`}, ${`probe_${probeRunId}`}, 'Staging Probe Developer', 'developer', ${`gh_probe_${probeRunId}`}, 'gho_secret_probe_token', true)
      `;

      // 4B. Insert probe repo
      await sql`
        INSERT INTO repositories (id, user_id, github_repo_id, name, full_name, html_url, is_analyzed, review_status)
        VALUES (${probeRepoId}, ${probeUserId}, ${Math.floor(Math.random() * 900000) + 100000}, ${`repo-${probeRunId}`}, ${`probe_${probeRunId}/repo-${probeRunId}`}, ${`https://github.com/probe_${probeRunId}/repo-${probeRunId}`}, true, 'completed')
      `;

      // 4C. Insert review omitting provenance_status -> verify DEFAULT 'unknown' takes effect
      const [insertedReview] = await sql`
        INSERT INTO reviews (repository_id, summary, strengths, weaknesses, architecture, code_quality, documentation, best_practices, suggested_learning, overall_score, confidence_score)
        VALUES (${probeRepoId}, 'Staging rehearsal review', '[]'::jsonb, '[]'::jsonb, 'Modular', '90/100', 'Good', 'Standard', '[]'::jsonb, 88, 90)
        RETURNING provenance_status, model_provider, model_name
      `;
      record('Review Default Provenance', insertedReview.provenance_status === 'unknown', `Inserted review automatically defaulted provenance_status to "${insertedReview.provenance_status}"`);

      // 4D. Update review to explicit verified_inference
      await sql`
        UPDATE reviews SET provenance_status = 'verified_inference', model_provider = 'huggingface', model_name = 'Qwen/Qwen2.5-Coder-32B-Instruct'
        WHERE repository_id = ${probeRepoId}
      `;
      const [updatedReview] = await sql`SELECT provenance_status, model_provider, model_name FROM reviews WHERE repository_id = ${probeRepoId}`;
      record('Review Tri-State Update', updatedReview.provenance_status === 'verified_inference' && updatedReview.model_provider === 'huggingface', `Updated provenance_status="${updatedReview.provenance_status}", provider="${updatedReview.model_provider}"`);

      // 4E. Insert user_skill omitting provenance_status -> verify DEFAULT 'unknown'
      await sql`
        INSERT INTO skills (id, name, category, description)
        VALUES (${probeSkillId}, ${`StagingSkill_${probeRunId}`}, 'Languages', 'Test probe skill')
        ON CONFLICT (name) DO NOTHING
      `;
      const [insertedUserSkill] = await sql`
        INSERT INTO user_skills (user_id, skill_id, proficiency_level, verification_source)
        VALUES (${probeUserId}, ${probeSkillId}, 4, 'ai_review')
        RETURNING provenance_status
      `;
      record('User Skill Default Provenance', insertedUserSkill.provenance_status === 'unknown', `Inserted user_skill automatically defaulted provenance_status to "${insertedUserSkill.provenance_status}"`);

      // 4F. Setup session, account, PAT, and application data for Account Deletion test
      await sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${probeUserId}, ${`sess_probe_${probeRunId}`}, NOW() + INTERVAL '1 day')
      `;
      await sql`
        INSERT INTO accounts (user_id, account_id, provider_id)
        VALUES (${probeUserId}, ${`gh_acc_${probeRunId}`}, 'github')
      `;
      await sql`
        INSERT INTO personal_access_tokens (user_id, name, token_hash, token_prefix, scopes)
        VALUES (${probeUserId}, 'Staging Probe PAT', ${`hash_${probeRunId}`}, 'sk_live_pat', '["read:user"]'::jsonb)
      `;
      await sql`
        INSERT INTO companies (id, name) VALUES (${probeCompanyId}, 'Staging Probe Co')
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO jobs (id, company_id, title, description)
        VALUES (${probeJobId}, ${probeCompanyId}, 'Staff Probe Engineer', 'Description')
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO applications (job_id, user_id, resume_url, cover_letter, status)
        VALUES (${probeJobId}, ${probeUserId}, 'https://storage.skillverse.dev/private_resume.pdf', 'Sensitive cover letter text', 'applied')
      `;

      // 4G. Execute atomic account deletion transaction against live staging database
      const anonIdentifier = `anon_${probeUserId.slice(0, 8)}`;
      await sql.begin(async (tx) => {
        await tx`DELETE FROM sessions WHERE user_id = ${probeUserId}`;
        await tx`DELETE FROM accounts WHERE user_id = ${probeUserId}`;
        await tx`DELETE FROM personal_access_tokens WHERE user_id = ${probeUserId}`;
        await tx`UPDATE applications SET resume_url = NULL, cover_letter = NULL WHERE user_id = ${probeUserId}`;
        await tx`
          UPDATE users SET
            email = ${`${anonIdentifier}@deleted.skillverse.dev`},
            name = 'Anonymized Developer',
            username = ${anonIdentifier},
            bio = 'This account has been deleted by the user.',
            website = NULL,
            github_id = NULL,
            github_token = NULL,
            avatar_url = NULL,
            email_verified = false,
            updated_at = NOW()
          WHERE id = ${probeUserId}
        `;
      });

      // 4H. Verify atomic deletion results on live staging
      const remainingSessions = await sql`SELECT count(*)::int as count FROM sessions WHERE user_id = ${probeUserId}`;
      const remainingAccounts = await sql`SELECT count(*)::int as count FROM accounts WHERE user_id = ${probeUserId}`;
      const remainingPats = await sql`SELECT count(*)::int as count FROM personal_access_tokens WHERE user_id = ${probeUserId}`;
      const [appRow] = await sql`SELECT resume_url, cover_letter FROM applications WHERE user_id = ${probeUserId}`;
      const [userRow] = await sql`SELECT email, username, github_id, github_token, email_verified FROM users WHERE id = ${probeUserId}`;

      record('Live Sessions Revocation', remainingSessions[0].count === 0, 'Zero sessions remain in public.sessions');
      record('Live OAuth Unlinking', remainingAccounts[0].count === 0, 'Zero OAuth accounts remain in public.accounts');
      record('Live PAT Deletion', remainingPats[0].count === 0, 'Zero tokens remain in public.personal_access_tokens');
      record('Live Application PII Scrubbing', appRow.resume_url === null && appRow.cover_letter === null, 'resume_url and cover_letter nullified in public.applications');
      record('Live User Profile Anonymization', userRow.email.endsWith('@deleted.skillverse.dev') && userRow.github_id === null && userRow.github_token === null && userRow.email_verified === false, `email="${userRow.email}", github_id=${userRow.github_id}, email_verified=${userRow.email_verified}`);

    } finally {
      // Clean up probe objects
      try {
        await sql`DELETE FROM applications WHERE user_id = ${probeUserId}`;
        await sql`DELETE FROM jobs WHERE id = ${probeJobId}`;
        await sql`DELETE FROM companies WHERE id = ${probeCompanyId}`;
        await sql`DELETE FROM user_skills WHERE user_id = ${probeUserId}`;
        await sql`DELETE FROM skills WHERE id = ${probeSkillId}`;
        await sql`DELETE FROM reviews WHERE repository_id = ${probeRepoId}`;
        await sql`DELETE FROM repositories WHERE id = ${probeRepoId}`;
        await sql`DELETE FROM users WHERE id = ${probeUserId}`;
      } catch (cleanErr: any) {
        console.warn('Probe cleanup notice:', cleanErr.message);
      }
    }

    // ---------------------------------------------------------------------------
    // STEP 5: Execute and Validate Rollback Migration
    // ---------------------------------------------------------------------------
    console.log('\n▶ [5/6] Executing Phase 45 Rollback Migration (phase45-provenance-and-deletion-rollback.sql)...');
    const rollbackSqlPath = path.resolve(process.cwd(), 'database/migrations/phase45-provenance-and-deletion-rollback.sql');
    const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf-8');

    await sql.unsafe(rollbackSql);
    record('Rollback DDL Execution', true, 'phase45-provenance-and-deletion-rollback.sql executed without error');

    // Verify columns dropped
    const postRollbackCols = await sql`
      SELECT column_name, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('reviews', 'review_history', 'user_skills') AND column_name IN ('provenance_status', 'model_provider', 'model_name')
    `;
    record('Rollback Column Elimination', postRollbackCols.length === 0, `Remaining columns matching provenance: ${postRollbackCols.length} (clean reversal)`);

    const postRollbackIndexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname IN ('idx_reviews_provenance', 'idx_user_skills_provenance')
    `;
    record('Rollback Index Elimination', postRollbackIndexes.length === 0, `Remaining provenance indexes: ${postRollbackIndexes.length} (clean reversal)`);

    // ---------------------------------------------------------------------------
    // STEP 6: Re-apply Forward Migration for Final Staging Readiness
    // ---------------------------------------------------------------------------
    console.log('\n▶ [6/6] Re-applying Forward Migration to Leave Staging Ready...');
    await sql.unsafe(migrationSql);
    record('Final Forward Migration State', true, 'phase45-provenance-and-deletion.sql re-applied; staging is forward-ready');

    // ---------------------------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------------------------
    const total = results.length;
    const passed = results.filter(r => r.passed).length;

    console.log('\n=====================================================================');
    console.log(`📊 LIVE STAGING REHEARSAL SUMMARY: ${passed}/${total} STEPS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('=====================================================================\n');

    if (passed === total) {
      console.log('🎉 LIVE STAGING MIGRATION AND ROLLBACK VALIDATION COMPLETED WITH ZERO ERRORS!\n');
      process.exit(0);
    } else {
      throw new Error(`Staging rehearsal failed: ${total - passed} step(s) failed.`);
    }

  } finally {
    await sql.end();
  }
}

runStagingValidation().catch(err => {
  console.error('\n❌ Fatal error during staging validation:', err);
  process.exit(1);
});
