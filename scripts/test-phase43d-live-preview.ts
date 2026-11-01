/**
 * SkillVerse Phase 43D-R3.19 — Live Preview Database Isolation Harness
 * 
 * Executes real route handlers and services against isolated synthetic test data
 * in a verified disposable Neon PostgreSQL preview branch.
 * 
 * Safety:
 * - Production database is STRICT NO-GO.
 * - Target branch identity is verified prior to any execution.
 * - Passwords, secrets and connection strings are NEVER printed.
 * - All synthetic records are cleanly purged at test completion.
 */

import fs from 'fs';
import path from 'path';

// 1. Safety Guard & Target Verification
const envPath = path.resolve(
  process.env.USERPROFILE || 'C:\\Users\\acer',
  '.gemini\\antigravity-ide\\brain\\541beeaf-39fe-42d5-a66a-1e9d23c9ec06\\scratch\\.preview-env.json'
);

if (!fs.existsSync(envPath)) {
  console.error('❌ [FATAL] Disposable preview environment config not found at:', envPath);
  process.exit(1);
}

const previewEnv = JSON.parse(fs.readFileSync(envPath, 'utf8'));

// Verify target is an explicitly disposable preview branch
const PROD_BRANCH_IDS = ['br-lucky-dawn-ao4a6rww'];
if (PROD_BRANCH_IDS.includes(previewEnv.branchId) || previewEnv.host.includes('lucky-dawn')) {
  console.error('🛑 [CRITICAL SAFETY STOP] Target host points to known production branch!');
  process.exit(1);
}

if (previewEnv.branchName !== 'preview-gate1-test' && !previewEnv.branchName.startsWith('preview-')) {
  console.error('🛑 [CRITICAL SAFETY STOP] Branch name does not match disposable preview pattern!');
  process.exit(1);
}

// Configure environment variables BEFORE importing application services
process.env.DATABASE_URL = previewEnv.pooledUrl;
process.env.DATABASE_URL_UNPOOLED = previewEnv.directUrl;
process.env.ENABLE_DEMO_AUTH = 'false'; // Strictly disable demo auth to enforce real DB checks
(process.env as any).NODE_ENV = 'production';

import postgres from 'postgres';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Synthetic Test Identities (UUID v4 isolated namespace)
const SYNTH_USER_A_ID = 'e1110000-0000-4000-8000-000000000001';
const SYNTH_USER_B_ID = 'e2220000-0000-4000-8000-000000000002';
const SYNTH_USER_C_ID = 'e3330000-0000-4000-8000-000000000003'; // Recruiter

const SYNTH_COMPANY_A_ID = 'e1000000-0000-4000-8000-000000000001';
const SYNTH_COMPANY_B_ID = 'e2000000-0000-4000-8000-000000000002';

const SYNTH_MEMBER_A1_ID = 'e1111111-0000-4000-8000-000000000001';
const SYNTH_MEMBER_A2_ID = 'e1111111-0000-4000-8000-000000000002';
const SYNTH_MEMBER_B1_ID = 'e2222222-0000-4000-8000-000000000001';

const RAW_TOKEN_A = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
const RAW_TOKEN_B = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
const RAW_TOKEN_C = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw.trim()).digest('hex');
}

let passedProbes = 0;
let totalProbes = 0;
const failures: string[] = [];

function assert(condition: boolean, testId: string, description: string, details?: any) {
  totalProbes++;
  if (condition) {
    passedProbes++;
    console.log(`  ✅ [PASS] ${testId}: ${description}`);
  } else {
    failures.push(`${testId}: ${description}`);
    console.error(`  ❌ [FAIL] ${testId}: ${description}`, details ? JSON.stringify(details) : '');
  }
}

function createRequest(
  url: string,
  options: { method?: string; body?: any; token?: string } = {}
): NextRequest {
  const headers = new Headers();
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }
  return new NextRequest(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function runLivePreviewTests() {
  console.log('=====================================================================');
  console.log('  🧪 SKILLVERSE PHASE 43D-R3.19 LIVE PREVIEW INTEGRATION HARNESS');
  console.log('=====================================================================');

  console.log(`[TARGET VERIFICATION] Branch Name: ${previewEnv.branchName}`);
  console.log(`[TARGET VERIFICATION] Branch ID:   ${previewEnv.branchId}`);
  console.log(`[TARGET VERIFICATION] Host:        ${previewEnv.host}`);
  console.log(`[TARGET VERIFICATION] Database:    ${previewEnv.dbname}`);
  console.log(`[TARGET VERIFICATION] Status:      CONFIRMED DISPOSABLE PREVIEW BRANCH\n`);

  // Dynamically load route handlers and drizzle NOW that environment variables are set
  const { recordDbSuccess } = await import('../lib/drizzle');
  recordDbSuccess();

  const { GET: getCompany, PATCH: patchCompany } = await import('../app/api/company/route');
  const { GET: getCompanyMembers, DELETE: deleteCompanyMember } = await import('../app/api/company/members/route');
  const { GET: getApplications } = await import('../app/api/applications/route');
  const { POST: joinChallenge } = await import('../app/api/challenges/[id]/join/route');
  const { GET: getJob } = await import('../app/api/jobs/[id]/route');

  const sql = postgres(previewEnv.pooledUrl, {
    ssl: 'require',
    connect_timeout: 15,
    max: 2,
  });

  try {
    // 2. Pre-cleanup any stale synthetic records
    await cleanupSyntheticData(sql);

    // 3. Seed Synthetic Data into Live Database
    console.log('[SETUP] Provisioning synthetic test records into live PostgreSQL schema...');
    
    // Users
    await sql`
      INSERT INTO users (id, email, username, name, role)
      VALUES 
        (${SYNTH_USER_A_ID}, 'synth.admin.a@preview.dev', 'synth_admin_a', 'Synthetic Admin A', 'company_admin'),
        (${SYNTH_USER_B_ID}, 'synth.admin.b@preview.dev', 'synth_admin_b', 'Synthetic Admin B', 'company_admin'),
        (${SYNTH_USER_C_ID}, 'synth.recruiter.a@preview.dev', 'synth_recruiter_a', 'Synthetic Recruiter A', 'recruiter');
    `;

    // Companies
    await sql`
      INSERT INTO companies (id, name, website, description, verified)
      VALUES
        (${SYNTH_COMPANY_A_ID}, 'Synthetic Alpha Corp', 'https://alpha.preview.dev', 'Original Alpha Description', true),
        (${SYNTH_COMPANY_B_ID}, 'Synthetic Beta Dynamics', 'https://beta.preview.dev', 'Original Beta Description', true);
    `;

    // Company Memberships
    await sql`
      INSERT INTO company_members (id, company_id, user_id, role, status)
      VALUES
        (${SYNTH_MEMBER_A1_ID}, ${SYNTH_COMPANY_A_ID}, ${SYNTH_USER_A_ID}, 'company_admin', 'active'),
        (${SYNTH_MEMBER_A2_ID}, ${SYNTH_COMPANY_A_ID}, ${SYNTH_USER_C_ID}, 'recruiter', 'active'),
        (${SYNTH_MEMBER_B1_ID}, ${SYNTH_COMPANY_B_ID}, ${SYNTH_USER_B_ID}, 'company_admin', 'active');
    `;

    // Personal Access Tokens
    const scopesJson = JSON.stringify(['read:profile', 'read:dcc', 'write:company', 'read:company']);
    await sql`
      INSERT INTO personal_access_tokens (id, user_id, name, token_hash, token_prefix, scopes)
      VALUES
        (${crypto.randomUUID()}, ${SYNTH_USER_A_ID}, 'Token A', ${hashToken(RAW_TOKEN_A)}, 'sk_live_...tokA', ${scopesJson}::jsonb),
        (${crypto.randomUUID()}, ${SYNTH_USER_B_ID}, 'Token B', ${hashToken(RAW_TOKEN_B)}, 'sk_live_...tokB', ${scopesJson}::jsonb),
        (${crypto.randomUUID()}, ${SYNTH_USER_C_ID}, 'Token C', ${hashToken(RAW_TOKEN_C)}, 'sk_live_...tokC', ${scopesJson}::jsonb);
    `;

    console.log('[SETUP] Synthetic records seeded successfully.\n');

    // --- Scenario 1: Cross-Tenant Read Prevention ---
    console.log('--- Scenario 1: Cross-Tenant Read Prevention (Live DB Checked) ---');

    // Probe 1: User B (Company B) tries to read Company A workspace profile
    const req1 = createRequest(`http://localhost:3000/api/company?companyId=${SYNTH_COMPANY_A_ID}`, {
      token: RAW_TOKEN_B,
    });
    const res1 = await getCompany(req1);
    const body1 = await res1.json();
    console.log('  [DEBUG LIVE-1.01]', res1.status, body1);
    assert(
      res1.status === 403 && (body1.code === 'ACCESS_DENIED_COMPANY_WORKSPACE' || body1.code === 'CROSS_COMPANY_ACCESS_DENIED'),
      'LIVE-1.01',
      'User B blocked from reading Company A profile (HTTP 403)',
      { status: res1.status, body: body1 }
    );

    // Probe 2: User B tries to read Company A member list
    const req2 = createRequest(`http://localhost:3000/api/company/members?companyId=${SYNTH_COMPANY_A_ID}`, {
      token: RAW_TOKEN_B,
    });
    const res2 = await getCompanyMembers(req2);
    const body2 = await res2.json();
    console.log('  [DEBUG LIVE-1.02]', res2.status, body2);
    assert(
      res2.status === 403 && (body2.code === 'ACCESS_DENIED_COMPANY_WORKSPACE' || body2.code === 'CROSS_COMPANY_ACCESS_DENIED'),
      'LIVE-1.02',
      'User B blocked from reading Company A members list (HTTP 403)',
      { status: res2.status, body: body2 }
    );

    // --- Scenario 2: Cross-Tenant Mutation Prevention with DB State Assertions ---
    console.log('\n--- Scenario 2: Cross-Tenant Mutation Prevention & DB State Invariance ---');

    // Capture DB state before attack
    const [compABefore] = await sql`SELECT name, description FROM companies WHERE id = ${SYNTH_COMPANY_A_ID}`;
    console.log(`  [DB State Before] Company A description: "${compABefore.description}"`);

    // Probe 3: User B attempts to overwrite Company A profile description
    const req3 = createRequest('http://localhost:3000/api/company', {
      method: 'PATCH',
      token: RAW_TOKEN_B,
      body: {
        companyId: SYNTH_COMPANY_A_ID,
        description: 'MALICIOUS_OVERWRITE_BY_ATTACKER_B',
      },
    });
    const res3 = await patchCompany(req3);
    const body3 = await res3.json();

    // Verify HTTP response
    assert(
      res3.status === 403 && (body3.code === 'ACCESS_DENIED_COMPANY_WORKSPACE' || body3.code === 'CROSS_COMPANY_ACCESS_DENIED'),
      'LIVE-2.01',
      'Cross-company profile mutation rejected with HTTP 403',
      { status: res3.status, body: body3 }
    );

    // Assert DB state after attack: strictly unchanged
    const [compAAfter] = await sql`SELECT name, description FROM companies WHERE id = ${SYNTH_COMPANY_A_ID}`;
    console.log(`  [DB State After]  Company A description: "${compAAfter.description}"`);
    assert(
      compAAfter.description === 'Original Alpha Description',
      'LIVE-2.02',
      'Live database assertion: Company A description is 100% UNCHANGED in PostgreSQL'
    );

    // Capture member count before attack
    const [memberCountBefore] = await sql`
      SELECT count(*)::int as count FROM company_members WHERE company_id = ${SYNTH_COMPANY_A_ID}
    `;
    console.log(`  [DB State Before] Company A member count: ${memberCountBefore.count}`);

    // Probe 4: User B attempts to delete Member A2 (Recruiter) from Company A
    const req4 = createRequest(
      `http://localhost:3000/api/company/members?companyId=${SYNTH_COMPANY_A_ID}&memberId=${SYNTH_MEMBER_A2_ID}`,
      {
        method: 'DELETE',
        token: RAW_TOKEN_B,
      }
    );
    const res4 = await deleteCompanyMember(req4);
    const body4 = await res4.json();
    assert(
      res4.status === 403 && (body4.code === 'ACCESS_DENIED_COMPANY_WORKSPACE' || body4.code === 'CROSS_COMPANY_ACCESS_DENIED'),
      'LIVE-2.03',
      'Unauthorized cross-company member deletion rejected with HTTP 403',
      { status: res4.status, body: body4 }
    );

    // Assert DB state after attack: member count strictly unchanged
    const [memberCountAfter] = await sql`
      SELECT count(*)::int as count FROM company_members WHERE company_id = ${SYNTH_COMPANY_A_ID}
    `;
    console.log(`  [DB State After]  Company A member count: ${memberCountAfter.count}`);
    assert(
      memberCountAfter.count === memberCountBefore.count,
      'LIVE-2.04',
      'Live database assertion: Company A member count is 100% UNCHANGED in PostgreSQL'
    );

    // --- Scenario 3: Privilege Separation within Same Company ---
    console.log('\n--- Scenario 3: Privilege Separation (Recruiter vs Company Admin) ---');

    // Probe 5: User C (Recruiter of Company A) attempts admin mutation on Company A
    const req5 = createRequest('http://localhost:3000/api/company', {
      method: 'PATCH',
      token: RAW_TOKEN_C,
      body: {
        companyId: SYNTH_COMPANY_A_ID,
        name: 'Recruiter Renamed Alpha',
      },
    });
    const res5 = await patchCompany(req5);
    const body5 = await res5.json();
    assert(
      res5.status === 403 && body5.code === 'INSUFFICIENT_COMPANY_PRIVILEGES',
      'LIVE-3.01',
      'Recruiter rejected from modifying company profile (HTTP 403 INSUFFICIENT_COMPANY_PRIVILEGES)'
    );

    // Assert DB state: name unchanged
    const [compANameCheck] = await sql`SELECT name FROM companies WHERE id = ${SYNTH_COMPANY_A_ID}`;
    assert(
      compANameCheck.name === 'Synthetic Alpha Corp',
      'LIVE-3.02',
      'Live database assertion: Company A name was NOT mutated by recruiter'
    );

    // --- Scenario 4: Legitimate Authorized Administrator Workflows ---
    console.log('\n--- Scenario 4: Legitimate Authorized Admin Actions (DB Verified) ---');

    // Probe 6: User A (Company A Admin) reads Company A profile
    const req6 = createRequest(`http://localhost:3000/api/company?companyId=${SYNTH_COMPANY_A_ID}`, {
      token: RAW_TOKEN_A,
    });
    const res6 = await getCompany(req6);
    const body6 = await res6.json();
    assert(
      res6.status === 200 && body6.success === true && body6.data.profile.name === 'Synthetic Alpha Corp',
      'LIVE-4.01',
      'Authorized Admin A successfully reads Company A profile (HTTP 200)'
    );

    // Probe 7: User A (Company A Admin) updates Company A description
    const NEW_DESCRIPTION = 'Legitimately Updated by Authorized Admin A';
    const req7 = createRequest('http://localhost:3000/api/company', {
      method: 'PATCH',
      token: RAW_TOKEN_A,
      body: {
        companyId: SYNTH_COMPANY_A_ID,
        description: NEW_DESCRIPTION,
      },
    });
    const res7 = await patchCompany(req7);
    const body7 = await res7.json();
    assert(
      res7.status === 200 && body7.success === true,
      'LIVE-4.02',
      'Authorized Admin A updates Company A profile (HTTP 200)'
    );

    // Assert DB state after legitimate mutation: updated in PostgreSQL
    const [compAUpdated] = await sql`SELECT description FROM companies WHERE id = ${SYNTH_COMPANY_A_ID}`;
    console.log(`  [DB State After]  Company A new description in PostgreSQL: "${compAUpdated.description}"`);
    assert(
      compAUpdated.description === NEW_DESCRIPTION,
      'LIVE-4.03',
      'Live database assertion: Authorized mutation successfully PERSISTED in PostgreSQL'
    );

    // --- Scenario 5: Residual Identity Cleanup Validation on Live System ---
    console.log('\n--- Scenario 5: Residual Identity Endpoints (Fail-Closed on Live DB) ---');

    // Probe 8: Anonymous GET /api/applications rejected with 401 (no dummy user 000...000)
    const req8 = createRequest('http://localhost:3000/api/applications');
    const res8 = await getApplications(req8);
    const body8 = await res8.json();
    console.log('  [DEBUG LIVE-5.01]', res8.status, body8);
    assert(
      res8.status === 401 && (body8.code === 'AUTHENTICATION_REQUIRED' || body8.code === 'UNAUTHORIZED'),
      'LIVE-5.01',
      'Anonymous GET /api/applications rejected with HTTP 401 (no dummy fallback)',
      { status: res8.status, body: body8 }
    );

    // Probe 9: Anonymous POST /api/challenges/[id]/join rejected with 401
    const req9 = createRequest('http://localhost:3000/api/challenges/test-chal-1/join', {
      method: 'POST',
    });
    const res9 = await joinChallenge(req9, { params: Promise.resolve({ id: 'test-chal-1' }) });
    const body9 = await res9.json();
    console.log('  [DEBUG LIVE-5.02]', res9.status, body9);
    assert(
      res9.status === 401 && (body9.code === 'AUTHENTICATION_REQUIRED' || body9.code === 'UNAUTHORIZED'),
      'LIVE-5.02',
      'Anonymous POST /api/challenges/[id]/join rejected with HTTP 401',
      { status: res9.status, body: body9 }
    );

    // Probe 10: Anonymous GET /api/jobs/[id] serves clean public info (no dummy applicant status)
    const req10 = createRequest('http://localhost:3000/api/jobs/test-job-1');
    const res10 = await getJob(req10, { params: Promise.resolve({ id: 'test-job-1' }) });
    const body10 = await res10.json();
    assert(
      res10.status === 200 && body10.data.hasApplied === false,
      'LIVE-5.03',
      'Anonymous GET /api/jobs/[id] returns clean public job details (hasApplied: false)'
    );

    // 4. Clean Up Synthetic Data
    console.log('\n[TEARDOWN] Purging synthetic records from live preview database...');
    await cleanupSyntheticData(sql);

    // Assert Teardown
    const [remainingUsers] = await sql`
      SELECT count(*)::int as count FROM users 
      WHERE id IN (${SYNTH_USER_A_ID}, ${SYNTH_USER_B_ID}, ${SYNTH_USER_C_ID})
    `;
    const [remainingCompanies] = await sql`
      SELECT count(*)::int as count FROM companies 
      WHERE id IN (${SYNTH_COMPANY_A_ID}, ${SYNTH_COMPANY_B_ID})
    `;
    assert(
      remainingUsers.count === 0 && remainingCompanies.count === 0,
      'LIVE-TEARDOWN',
      'Live database teardown assertion: 100% of synthetic records purged (0 remaining)'
    );

  } catch (err: any) {
    console.error('❌ [EXECUTION ERROR]:', err);
    failures.push(`Execution error: ${err.message}`);
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }

  console.log('\n=====================================================================');
  console.log(`  LIVE PREVIEW TEST RESULTS: ${passedProbes}/${totalProbes} PASSED`);
  if (failures.length > 0) {
    console.log(`  FAILURES (${failures.length}):`);
    failures.forEach(f => console.log(`   - ${f}`));
  }
  console.log('=====================================================================');

  if (failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

async function cleanupSyntheticData(sql: any) {
  await sql`DELETE FROM personal_access_tokens WHERE user_id IN (${SYNTH_USER_A_ID}, ${SYNTH_USER_B_ID}, ${SYNTH_USER_C_ID});`;
  await sql`DELETE FROM company_members WHERE company_id IN (${SYNTH_COMPANY_A_ID}, ${SYNTH_COMPANY_B_ID});`;
  await sql`DELETE FROM saved_developers WHERE company_id IN (${SYNTH_COMPANY_A_ID}, ${SYNTH_COMPANY_B_ID});`;
  await sql`DELETE FROM recruiter_notes WHERE company_id IN (${SYNTH_COMPANY_A_ID}, ${SYNTH_COMPANY_B_ID});`;
  await sql`DELETE FROM companies WHERE id IN (${SYNTH_COMPANY_A_ID}, ${SYNTH_COMPANY_B_ID});`;
  await sql`DELETE FROM users WHERE id IN (${SYNTH_USER_A_ID}, ${SYNTH_USER_B_ID}, ${SYNTH_USER_C_ID});`;
}

runLivePreviewTests();
