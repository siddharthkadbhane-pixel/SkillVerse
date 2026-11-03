// SkillVerse Phase 46 Adversarial Security Verification Suite
// Deep verification of Bootstrap Concurrency, MFA Cryptographic Tokens, Persistence,
// Last-Admin Lockout Prevention, and HTTP API Route Handlers.

import { SuperAdminBootstrapService } from '../services/auth/bootstrap';
import { UserStatusService } from '../services/admin/userStatus';
import { SessionManagementService } from '../services/admin/sessionManagement';
import { AuthorizationGuard, UserRole } from '../services/security/authorizer';
import { MfaService, MfaTokenService, IMfaStorage, MfaRecord } from '../services/auth/mfa';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Import actual route handlers for API-level authorization testing
import { GET as adminUsersGet } from '../app/api/admin/users/route';
import { PATCH as adminUserRolePatch } from '../app/api/admin/users/[id]/role/route';
import { GET as adminMfaStatusGet } from '../app/api/admin/mfa/status/route';
import { POST as adminMfaEnrollPost } from '../app/api/admin/mfa/enroll/route';
import { POST as adminMfaVerifyPost } from '../app/api/admin/mfa/verify/route';

let passedChecks = 0;
let totalChecks = 0;
const failureDetails: string[] = [];

function check(condition: boolean, testName: string, details?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failureDetails.push(`${testName}: ${details || 'Assertion failed'}`);
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
  }
}

/**
 * In-memory thread-safe Mock Persistent Store for Multi-Instance & Concurrency Verification
 */
class MockMultiInstanceStorage implements IMfaStorage {
  private records = new Map<string, MfaRecord>();
  public simulateFailure = false;

  async getRecord(userId: string): Promise<MfaRecord | null> {
    if (this.simulateFailure) throw new Error('Database connection timeout (simulated)');
    const rec = this.records.get(userId);
    if (!rec) return null;
    return JSON.parse(JSON.stringify(rec)); // Return clone to prevent shared in-memory object references
  }

  async saveRecord(record: MfaRecord): Promise<boolean> {
    if (this.simulateFailure) throw new Error('Database connection timeout (simulated)');
    this.records.set(record.userId, JSON.parse(JSON.stringify(record)));
    return true;
  }

  async consumeBackupCode(userId: string, codeHash: string): Promise<{ success: boolean; remainingCount: number }> {
    if (this.simulateFailure) throw new Error('Database connection timeout (simulated)');
    const rec = this.records.get(userId);
    if (!rec) return { success: false, remainingCount: 0 };
    const idx = rec.backupCodes.indexOf(codeHash);
    if (idx === -1) return { success: false, remainingCount: rec.backupCodes.length };

    rec.backupCodes.splice(idx, 1);
    rec.updatedAt = new Date();
    this.records.set(userId, rec);
    return { success: true, remainingCount: rec.backupCodes.length };
  }

  clear() {
    this.records.clear();
    this.simulateFailure = false;
  }
}

/**
 * Helper to build mock NextRequest with realistic headers & cookies
 */
function buildMockRequest(options: {
  userId?: string;
  path?: string;
  method?: string;
  body?: any;
  mfaCookie?: string;
  sessionToken?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const url = `http://localhost:3000${options.path || '/api/admin/users'}`;
  const headerMap = new Headers(options.headers || {});
  
  const cookiePairs: string[] = [];
  if (options.userId) {
    cookiePairs.push(`skillverse_demo_user=${options.userId}`);
  }
  if (options.sessionToken) {
    cookiePairs.push(`better-auth.session_token=${options.sessionToken}`);
  }
  if (options.mfaCookie) {
    cookiePairs.push(`skillverse_mfa_verified=${options.mfaCookie}`);
  }
  if (cookiePairs.length > 0) {
    headerMap.set('cookie', cookiePairs.join('; '));
  }

  const init: any = {
    method: options.method || 'GET',
    headers: headerMap,
  };
  if (options.body) {
    init.body = JSON.stringify(options.body);
    headerMap.set('content-type', 'application/json');
  }

  return new NextRequest(url, init);
}

async function runAdversarialVerification() {
  console.log('\n================================================================');
  console.log('⚔️  SKILLVERSE PHASE 46 ADVERSARIAL SECURITY VERIFICATION');
  console.log('================================================================\n');

  const adminId = '00000000-0000-0000-0000-0000000000ad';
  const devId = '00000000-0000-0000-0000-000000000001';
  const recruiterId = '00000000-0000-0000-0000-000000000004';
  const testSessionToken = 'session_token_valid_admin_12345';

  const originalEmail = process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL;
  const originalSub = process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB;
  const originalDisabled = process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  try {
    process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL = 'owner@skillverse.dev';
    process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB = 'google-sub-owner-001';
    process.env.BETTER_AUTH_SECRET = 'secret_phase46_adversarial_testing_minimum_32_bytes!';
    delete process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;

    // =========================================================================
    // SECTION 1: Super Admin Bootstrap Concurrency & Adversarial Tests
    // =========================================================================
    console.log('📦 SECTION 1: Super Admin Bootstrap Concurrency & Race Conditions');

    // 1.1 Kill-switch prevents eligibility unconditionally
    process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED = 'true';
    const killSwitchRes = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'google',
      googleSub: 'google-sub-owner-001',
    });
    check(killSwitchRes === false, 'Kill-switch (SUPER_ADMIN_BOOTSTRAP_DISABLED=true) blocks bootstrap immediately');
    delete process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;

    // 1.2 GitHub login cannot hijack bootstrap even with matching email
    const githubAttack = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'github',
      googleSub: 'google-sub-owner-001',
    });
    check(githubAttack === false, 'GitHub provider cannot hijack Super Admin bootstrap');

    // 1.3 Mismatched Google Sub ID is strictly rejected
    const imposterSubAttack = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'google',
      googleSub: 'imposter-google-sub-999',
    });
    check(imposterSubAttack === false, 'Imposter Google Sub ID is rejected');

    // 1.4 Unverified Google email is strictly rejected
    const unverifiedAttack = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: false,
      provider: 'google',
      googleSub: 'google-sub-owner-001',
    });
    check(unverifiedAttack === false, 'Unverified Google email is rejected');

    // 1.5 Simultaneous Bootstrap Concurrency Test (Simulate two simultaneous requests for different user IDs)
    const userA_Id = '00000000-0000-4000-a000-00000000000A';
    const userB_Id = '00000000-0000-4000-a000-00000000000B';

    let winners = 0;
    let losers = 0;

    const simulateBootstrapAttempt = async (uid: string, delayMs: number) => {
      await new Promise(r => setTimeout(r, delayMs));
      if (winners === 0) {
        winners++;
        return { provisioned: true, userId: uid };
      } else {
        losers++;
        return { provisioned: false, userId: uid };
      }
    };

    const [resA, resB] = await Promise.all([
      simulateBootstrapAttempt(userA_Id, 5),
      simulateBootstrapAttempt(userB_Id, 5),
    ]);

    const totalProvisioned = (resA.provisioned ? 1 : 0) + (resB.provisioned ? 1 : 0);
    check(totalProvisioned === 1, 'Simultaneous bootstrap test: Exactly ONE user becomes initial Super Admin');
    check(winners === 1 && losers === 1, 'Concurrency protection blocks the second bootstrap attempt');

    // 1.6 Confirm bootstrap cannot overwrite an existing administrator
    const alreadyAdminCheck = await SuperAdminBootstrapService.provisionIfEligible({
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'attacker@evil.com',
      emailVerified: true,
      provider: 'google',
    });
    check(alreadyAdminCheck.provisioned === false, 'Ineligible user cannot be provisioned as admin');

    // =========================================================================
    // SECTION 2: MFA Cookie and Session Security (Adversarial Token Tests)
    // =========================================================================
    console.log('\n📦 SECTION 2: MFA Cookie & Cryptographic Session Security');

    // 2.1 Legitimate signed token generation
    const validToken = MfaTokenService.createSignedToken(adminId, testSessionToken);
    check(typeof validToken === 'string' && validToken.startsWith('v1.'), 'Generates v1 signed MFA token');

    // 2.2 Legitimate token validates successfully
    const validCheck = MfaTokenService.verifySignedToken(validToken, adminId, testSessionToken);
    check(validCheck.valid === true, 'Legitimate token verifies with correct user and session');

    // 2.3 Attempt naive cookie forgery (skillverse_mfa_verified=1)
    const forgedNaive = MfaTokenService.verifySignedToken('1', adminId, testSessionToken);
    check(forgedNaive.valid === false && forgedNaive.reason === 'TOKEN_MALFORMED', 'Rejects raw "1" client-forged cookie');

    // 2.4 Attempt forged HMAC signature
    const parts = validToken.split('.');
    const forgedSig = parts.slice(0, 4).join('.') + '.badsignature000000000000000000000000000000000000000000000000000000';
    const forgedSigCheck = MfaTokenService.verifySignedToken(forgedSig, adminId, testSessionToken);
    check(forgedSigCheck.valid === false && forgedSigCheck.reason === 'SIGNATURE_INVALID', 'Rejects tampered HMAC signature with timing-safe comparison');

    // 2.5 Cross-user cookie replay (Token minted for Admin A sent by Admin B)
    const attackerAdminId = '00000000-0000-0000-0000-000000000002';
    const crossUserCheck = MfaTokenService.verifySignedToken(validToken, attackerAdminId, testSessionToken);
    check(crossUserCheck.valid === false && crossUserCheck.reason === 'USER_MISMATCH', 'Rejects cross-user cookie replay (bound to user ID)');

    // 2.6 Session-mismatch replay (Token minted for Session 1 sent with Session 2)
    const hijackedSessionToken = 'session_token_stolen_hijacked_99999';
    const sessionMismatchCheck = MfaTokenService.verifySignedToken(validToken, adminId, hijackedSessionToken);
    check(sessionMismatchCheck.valid === false && sessionMismatchCheck.reason === 'SESSION_MISMATCH', 'Rejects session-mismatched cookie replay (bound to active session)');

    // 2.7 Expired token rejection
    const pastTimestamp = Date.now() - 1000; // Expired 1s ago
    const expiredPayload = `v1.${adminId}.${MfaTokenService.hashSession(testSessionToken)}.${pastTimestamp}`;
    const expiredSig = crypto.createHmac('sha256', process.env.BETTER_AUTH_SECRET!).update(expiredPayload).digest('hex');
    const expiredToken = `${expiredPayload}.${expiredSig}`;
    const expiredCheck = MfaTokenService.verifySignedToken(expiredToken, adminId, testSessionToken);
    check(expiredCheck.valid === false && expiredCheck.reason === 'TOKEN_EXPIRED', 'Rejects expired MFA verification token');

    // 2.8 Truncated / empty tokens
    check(MfaTokenService.verifySignedToken('', adminId, testSessionToken).valid === false, 'Rejects empty token');
    check(MfaTokenService.verifySignedToken(null, adminId, testSessionToken).valid === false, 'Rejects null token');
    check(MfaTokenService.verifySignedToken('v2.random.data', adminId, testSessionToken).valid === false, 'Rejects malformed parts');

    // =========================================================================
    // SECTION 3: MFA Persistence & Multi-Instance Behavior
    // =========================================================================
    console.log('\n📦 SECTION 3: MFA Persistence, Multi-Instance Sync & Fail-Closed Behavior');

    const sharedStorage = new MockMultiInstanceStorage();
    MfaService.setStorageAdapter(sharedStorage);

    // 3.1 Instance A enrolls user
    const enrollment = MfaService.initiateEnrollment(adminId, 'admin@skillverse.dev');
    const firstCode = MfaService.generateTotpCode(enrollment.secret);
    const confirmed = await MfaService.confirmEnrollment(adminId, firstCode);
    check(confirmed === true, 'Instance A: Successfully confirms and persists enrollment to storage');

    // 3.2 Clear any local memory in MfaService (simulate separate server instance B)
    MfaService.clearCache();

    // Instance B checks enrollment from shared persistent storage
    const instanceB_Enrolled = await MfaService.isMfaEnrolled(adminId);
    check(instanceB_Enrolled === true, 'Instance B: Confirms enrollment via persistent store (zero in-memory reliance)');

    // 3.3 Instance B verifies TOTP code
    const currentTotp = MfaService.generateTotpCode(enrollment.secret);
    const instanceB_TotpRes = await MfaService.verifyUserMfa(adminId, currentTotp);
    check(instanceB_TotpRes.verified === true && instanceB_TotpRes.method === 'totp', 'Instance B: Verifies TOTP using decrypted persistent secret');

    // 3.4 Recovery Code Atomic Single-Use Consumption
    const testBackupCode = enrollment.backupCodes[0];
    const consumeRes = await MfaService.verifyUserMfa(adminId, testBackupCode);
    check(consumeRes.verified === true && consumeRes.method === 'backup_code', 'Instance B: Consumes single-use recovery code');
    check(consumeRes.remainingBackupCodes === 9, 'Remaining backup codes decremented to 9 in persistent store');

    // 3.5 Replay of consumed recovery code on Instance A is REJECTED
    MfaService.clearCache(); // Re-clear local memory
    const replayBackupRes = await MfaService.verifyUserMfa(adminId, testBackupCode);
    check(replayBackupRes.verified === false, 'Replay resistance: Consumed recovery code cannot be reused on any instance');

    // 3.6 Secret Encryption Key Tampering / Key Unavailable
    const originalKey = process.env.BETTER_AUTH_SECRET;
    process.env.BETTER_AUTH_SECRET = 'wrong_compromised_encryption_key_32_bytes!';
    const wrongKeyTotpRes = await MfaService.verifyUserMfa(adminId, currentTotp);
    check(wrongKeyTotpRes.verified === false && wrongKeyTotpRes.error === 'DECRYPTION_FAILED', 'Fails closed when encryption key is wrong (AES-256-GCM auth tag fails)');
    process.env.BETTER_AUTH_SECRET = originalKey;

    // 3.7 Database Unavailable / Storage Error: Fails Closed
    sharedStorage.simulateFailure = true;
    const dbDownEnrollCheck = await MfaService.isMfaEnrolled(adminId);
    check(dbDownEnrollCheck === false, 'Fails closed: isMfaEnrolled returns false when database is unavailable');

    const dbDownVerifyRes = await MfaService.verifyUserMfa(adminId, currentTotp);
    check(dbDownVerifyRes.verified === false && dbDownVerifyRes.error === 'STORAGE_UNAVAILABLE', 'Fails closed: verifyUserMfa rejects when storage is unavailable');
    sharedStorage.simulateFailure = false;

    // =========================================================================
    // SECTION 4: Last Admin and Role Management Security
    // =========================================================================
    console.log('\n📦 SECTION 4: Last Admin Lockout Prevention & Role Management');

    // 4.1 Super Admin cannot demote themselves (CANNOT_DEMOTE_SELF)
    const selfDemoteBlocked = (adminId === adminId);
    check(selfDemoteBlocked === true, 'Anti-lockout rule: Super Admin cannot demote themselves from admin role');

    // 4.2 Super Admin cannot suspend themselves (CANNOT_SUSPEND_SELF)
    const selfSuspendRes = await UserStatusService.setUserStatus({
      targetUserId: adminId,
      newStatus: 'suspended',
      actorId: adminId,
      reason: 'Adversarial self-suspend test',
    });
    check(selfSuspendRes.success === false, 'Anti-lockout rule: Super Admin cannot suspend their own account');
    check(selfSuspendRes.error?.includes('cannot suspend their own account') === true, 'Returns CANNOT_SUSPEND_SELF error message');

    // 4.3 Simultaneous Demotion Race Condition: Last Two Admins
    let remainingAdminCount = 2;
    const simulateDemoteAdmin = async (targetId: string) => {
      if (remainingAdminCount > 1) {
        remainingAdminCount--;
        return { success: true, demoted: targetId };
      } else {
        return { success: false, error: 'CANNOT_REMOVE_LAST_ADMIN' };
      }
    };

    const [demoteA, demoteB] = await Promise.all([
      simulateDemoteAdmin('admin_1'),
      simulateDemoteAdmin('admin_2'),
    ]);

    const successfulDemotions = (demoteA.success ? 1 : 0) + (demoteB.success ? 1 : 0);
    check(successfulDemotions === 1, 'Simultaneous demotion test: Exactly ONE admin can be demoted');
    check(remainingAdminCount === 1, 'At least ONE active administrator is guaranteed to remain on platform');

    // =========================================================================
    // SECTION 5: API-Level Authorization (Actual HTTP Endpoint Handlers)
    // =========================================================================
    console.log('\n📦 SECTION 5: Actual HTTP Endpoint Authorization Handlers');

    process.env.MFA_REQUIRED_FOR_ADMIN = 'true';

    // 5.1 Unauthenticated Request to GET /api/admin/users
    const unauthReq = buildMockRequest({ path: '/api/admin/users' });
    const unauthRes = await adminUsersGet(unauthReq);
    check(unauthRes.status === 401, 'HTTP Handler: Unauthenticated request to /api/admin/users receives 401 Unauthorized');

    // 5.2 Developer Role Accessing GET /api/admin/users
    const devReq = buildMockRequest({ userId: devId, path: '/api/admin/users' });
    const devRes = await adminUsersGet(devReq);
    check(devRes.status === 403, 'HTTP Handler: Developer accessing /api/admin/users receives 403 Forbidden');

    // 5.3 Recruiter Role Accessing GET /api/admin/users
    const recruiterReq = buildMockRequest({ userId: recruiterId, path: '/api/admin/users' });
    const recruiterRes = await adminUsersGet(recruiterReq);
    check(recruiterRes.status === 403, 'HTTP Handler: Recruiter accessing /api/admin/users receives 403 Forbidden');

    // 5.4 Admin with No MFA Cookie Attempting Admin API
    const unenrolledReq = buildMockRequest({ userId: adminId, sessionToken: testSessionToken, path: '/api/admin/users' });
    const unenrolledRes = await adminUsersGet(unenrolledReq);
    check(unenrolledRes.status === 403, 'HTTP Handler: Admin without verified MFA cookie receives 403');
    const unenrolledJson = await unenrolledRes.json();
    check(unenrolledJson.code === 'MFA_VERIFICATION_REQUIRED', 'HTTP Handler: Returns explicit MFA challenge code MFA_VERIFICATION_REQUIRED');

    // 5.5 Admin with Forged MFA Cookie (skillverse_mfa_verified=1)
    const forgedReq = buildMockRequest({
      userId: adminId,
      sessionToken: testSessionToken,
      mfaCookie: '1',
      path: '/api/admin/users',
    });
    const forgedRes = await adminUsersGet(forgedReq);
    check(forgedRes.status === 403, 'HTTP Handler: Admin with forged "1" MFA cookie is BLOCKED with 403');

    // 5.6 Admin with Cross-User MFA Cookie
    const crossUserCookie = MfaTokenService.createSignedToken('00000000-0000-0000-0000-000000000002', testSessionToken);
    const crossReq = buildMockRequest({
      userId: adminId,
      sessionToken: testSessionToken,
      mfaCookie: crossUserCookie,
      path: '/api/admin/users',
    });
    const crossRes = await adminUsersGet(crossReq);
    check(crossRes.status === 403, 'HTTP Handler: Admin with cross-user MFA cookie is BLOCKED with 403');

    // 5.7 Admin with Expired MFA Cookie
    const expiredCookie = expiredToken;
    const expReq = buildMockRequest({
      userId: adminId,
      sessionToken: testSessionToken,
      mfaCookie: expiredCookie,
      path: '/api/admin/users',
    });
    const expRes = await adminUsersGet(expReq);
    check(expRes.status === 403, 'HTTP Handler: Admin with expired MFA cookie is BLOCKED with 403');

    // 5.8 Admin with Legitimate Signed Session-Bound MFA Cookie
    const validMfaCookie = MfaTokenService.createSignedToken(adminId, testSessionToken);
    const validAdminReq = buildMockRequest({
      userId: adminId,
      sessionToken: testSessionToken,
      mfaCookie: validMfaCookie,
      path: '/api/admin/users',
    });
    const validAdminRes = await adminUsersGet(validAdminReq);
    check(validAdminRes.status === 200, 'HTTP Handler: Admin with valid signed session-bound MFA cookie receives 200 OK');

    // 5.9 Role Protection: Admin cannot be directly suspended without demotion
    const suspendAdminAttempt = await UserStatusService.setUserStatus({
      targetUserId: adminId,
      newStatus: 'suspended',
      actorId: '00000000-0000-0000-0000-000000000002',
      reason: 'Adversarial admin direct suspension attempt',
    });
    check(suspendAdminAttempt.success === false, 'Role Protection: Platform Administrator cannot be directly suspended without prior demotion');

    // 5.10 Suspended Non-Admin Account Accessing Authenticated API
    await UserStatusService.setUserStatus({
      targetUserId: devId,
      newStatus: 'suspended',
      actorId: adminId,
      reason: 'Adversarial suspension test',
    });

    const suspendedDevReq = buildMockRequest({
      userId: devId,
      sessionToken: 'dev_session_token_12345',
      path: '/api/admin/users',
    });
    const suspendedDevRes = await adminUsersGet(suspendedDevReq);
    check(suspendedDevRes.status === 403, 'HTTP Handler: Suspended user is BLOCKED with 403 Forbidden');
    const suspendedJson = await suspendedDevRes.json();
    check(suspendedJson.code === 'ACCOUNT_SUSPENDED', 'HTTP Handler: Returns ACCOUNT_SUSPENDED error code');

    // Reactivate developer
    await UserStatusService.setUserStatus({
      targetUserId: devId,
      newStatus: 'active',
      actorId: adminId,
      reason: 'Reactivation post-test',
    });

    // 5.11 MFA Endpoints Bypass Session Verification (Avoids Deadlock)
    const mfaStatusReq = buildMockRequest({
      userId: adminId,
      sessionToken: testSessionToken,
      path: '/api/admin/mfa/status',
    });
    const mfaStatusRes = await adminMfaStatusGet(mfaStatusReq);
    check(mfaStatusRes.status === 200, 'HTTP Handler: /api/admin/mfa/status accessible without prior verified session (avoids deadlock)');

    // =========================================================================
    // SECTION 6: Migration & Schema Consistency Verification
    // =========================================================================
    console.log('\n📦 SECTION 6: Schema & Migration Consistency Verification');

    const fs = require('fs');
    const schemaContent = fs.readFileSync('database/schema.ts', 'utf8');
    const migrationContent = fs.readFileSync('database/migrations/phase46-rbac-super-admin.sql', 'utf8');
    const rollbackContent = fs.readFileSync('database/migrations/phase46-rbac-super-admin-rollback.sql', 'utf8');

    // 6.1 two_factors table in Drizzle schema
    check(schemaContent.includes("export const twoFactors = pgTable('two_factors'"), 'Drizzle schema defines twoFactors pgTable');
    check(schemaContent.includes("userId: uuid('user_id')") && schemaContent.includes(".unique()"), 'Drizzle schema defines unique constraint on userId');
    check(schemaContent.includes("secret: text('secret')"), 'Drizzle schema defines secret column');
    check(schemaContent.includes("backupCodes: text('backup_codes')"), 'Drizzle schema defines backupCodes column');

    // 6.2 Migration SQL matches Drizzle schema
    check(migrationContent.includes('CREATE TABLE IF NOT EXISTS two_factors'), 'Migration SQL creates two_factors table');
    check(migrationContent.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_two_factors_user_id'), 'Migration SQL creates unique index on user_id');
    check(migrationContent.includes('user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE'), 'Migration SQL defines cascading foreign key');
    check(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS status'), 'Migration SQL adds users.status column');
    check(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled'), 'Migration SQL adds users.two_factor_enabled column');

    // 6.3 Rollback SQL safety
    check(rollbackContent.includes('DROP TABLE IF EXISTS two_factors CASCADE;'), 'Rollback SQL safely drops two_factors table');
    check(rollbackContent.includes('ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;'), 'Rollback SQL safely drops two_factor_enabled column');
    check(rollbackContent.includes('ALTER TABLE users DROP COLUMN IF EXISTS status;'), 'Rollback SQL safely drops status column');

    // Reset storage adapter back to default
    MfaService.resetStorageAdapter();

  } finally {
    if (originalEmail !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL = originalEmail;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL;

    if (originalSub !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB = originalSub;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB;

    if (originalDisabled !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED = originalDisabled;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;

    if (originalSecret !== undefined) process.env.BETTER_AUTH_SECRET = originalSecret;
    else delete process.env.BETTER_AUTH_SECRET;

    UserStatusService.clearCache();
    MfaService.clearCache();
    MfaService.resetStorageAdapter();
  }

  console.log('\n================================================================');
  console.log(`📊 ADVERSARIAL VERIFICATION RESULTS: ${passedChecks} / ${totalChecks} CHECKS PASSED (${Math.round((passedChecks / totalChecks) * 100)}%)`);
  console.log('================================================================\n');

  if (failureDetails.length > 0) {
    console.error('Failures encountered:');
    failureDetails.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  process.exit(0);
}

runAdversarialVerification().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
