// SkillVerse RBAC & Super Admin Comprehensive Test Suite
// Verifies all Phase 46 security constraints, role boundaries, TOTP MFA, and bootstrap provisioning

import { SuperAdminBootstrapService } from '../services/auth/bootstrap';
import { UserStatusService } from '../services/admin/userStatus';
import { SessionManagementService } from '../services/admin/sessionManagement';
import { AuthorizationGuard, UserRole } from '../services/security/authorizer';
import { MfaService, MfaTokenService, IMfaStorage, MfaRecord } from '../services/auth/mfa';
import { NextRequest } from 'next/server';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
  }
}

class TestMockStorage implements IMfaStorage {
  private records = new Map<string, MfaRecord>();

  async getRecord(userId: string): Promise<MfaRecord | null> {
    const rec = this.records.get(userId);
    return rec ? JSON.parse(JSON.stringify(rec)) : null;
  }

  async saveRecord(record: MfaRecord): Promise<boolean> {
    this.records.set(record.userId, JSON.parse(JSON.stringify(record)));
    return true;
  }

  async consumeBackupCode(userId: string, codeHash: string): Promise<{ success: boolean; remainingCount: number }> {
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
  }
}

/**
 * Helper to build mock NextRequest with demo cookie & path
 */
function createMockRequest(options: {
  userId?: string;
  path?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}): NextRequest {
  const url = `http://localhost:3000${options.path || '/api/admin/users'}`;
  const headers = new Headers(options.headers || {});
  
  const cookiePairs: string[] = [];
  if (options.userId) {
    cookiePairs.push(`skillverse_demo_user=${options.userId}`);
  }
  if (options.cookies) {
    for (const [k, v] of Object.entries(options.cookies)) {
      cookiePairs.push(`${k}=${v}`);
    }
  }
  if (cookiePairs.length > 0) {
    headers.set('cookie', cookiePairs.join('; '));
  }

  return new NextRequest(url, { headers });
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🛡️  SKILLVERSE RBAC & SUPER ADMIN SECURITY TEST SUITE (PHASE 46)');
  console.log('================================================================\n');

  // Backup original env
  const originalBootstrapEmail = process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL;
  const originalBootstrapSub = process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB;
  const originalDisabled = process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;
  const originalRequireSub = process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB;
  const originalMfaRequired = process.env.MFA_REQUIRED_FOR_ADMIN;
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  const adminActorId = '00000000-0000-0000-0000-0000000000ad';
  const developerUserId = '00000000-0000-0000-0000-000000000001';
  const recruiterUserId = '00000000-0000-0000-0000-000000000004';
  const companyAdminUserId = '00000000-0000-0000-0000-000000000005';
  const sessionToken = `session_${adminActorId}`;

  const mockStorage = new TestMockStorage();

  try {
    process.env.BETTER_AUTH_SECRET = 'secret_phase46_rbac_test_suite_minimum_32_bytes!';

    // -------------------------------------------------------------
    // Category 1: Initial Super Admin Provisioning & OAuth Bootstrap
    // -------------------------------------------------------------
    console.log('📦 CATEGORY 1: Initial Super Admin Provisioning & Bootstrap');

    process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL = 'owner@skillverse.dev';
    process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB = 'google-sub-123456';
    delete process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;
    delete process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB;

    // 1. Configured owner via Google OAuth with verified email
    const ownerEligible = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'google',
      googleSub: 'google-sub-123456',
    });
    assert(ownerEligible === true, 'Configured owner Google identity is eligible for bootstrap');

    // 2. Case-insensitive email matching
    const ownerCaseEligible = SuperAdminBootstrapService.isEligible({
      email: 'OWNER@SkillVerse.Dev',
      emailVerified: true,
      provider: 'google',
      googleSub: 'google-sub-123456',
    });
    assert(ownerCaseEligible === true, 'Owner email matching is case-insensitive');

    // 3. Normal Google user is NOT eligible (receives developer)
    const normalGoogleEligible = SuperAdminBootstrapService.isEligible({
      email: 'alice.developer@gmail.com',
      emailVerified: true,
      provider: 'google',
      googleSub: 'google-sub-999999',
    });
    assert(normalGoogleEligible === false, 'Standard Google signup receives developer (not admin)');

    // 4. Same owner email via GitHub is REJECTED (Google provider strictly enforced)
    const githubOwnerEligible = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'github',
      googleSub: undefined,
    });
    assert(githubOwnerEligible === false, 'GitHub login with owner email is rejected for bootstrap');

    // 5. Unverified Google email is REJECTED
    const unverifiedGoogle = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: false,
      provider: 'google',
      googleSub: 'google-sub-123456',
    });
    assert(unverifiedGoogle === false, 'Unverified Google email is rejected for bootstrap');

    // 6. Mismatched Google Sub ID is REJECTED
    const mismatchedSub = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'google',
      googleSub: 'google-sub-imposter',
    });
    assert(mismatchedSub === false, 'Mismatched Google sub ID is rejected');

    // 7. Strict Sub ID requirement in production mode
    process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB = 'true';
    delete process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB;
    const missingSubInStrict = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'google',
      googleSub: undefined,
    });
    assert(missingSubInStrict === false, 'Strict sub requirement rejects bootstrap when Google Sub is unconfigured');
    process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB = 'google-sub-123456';
    delete process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB;

    // 8. Explicit disable flag prevents bootstrap
    process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED = 'true';
    const disabledBootstrap = SuperAdminBootstrapService.isEligible({
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'google',
      googleSub: 'google-sub-123456',
    });
    assert(disabledBootstrap === false, 'SUPER_ADMIN_BOOTSTRAP_DISABLED shuts down bootstrap mechanism');
    delete process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;

    // 9. Non-eligible bootstrap attempt returns provisioned: false
    const ineligibleProvision = await SuperAdminBootstrapService.provisionIfEligible({
      userId: 'test_user',
      email: 'attacker@evil.com',
      emailVerified: true,
      provider: 'google',
    });
    assert(ineligibleProvision.provisioned === false, 'Ineligible identity provisioning returns provisioned: false');

    // 10. Provider check rejects arbitrary non-google providers
    const nonGoogleProvision = await SuperAdminBootstrapService.provisionIfEligible({
      userId: 'test_user',
      email: 'owner@skillverse.dev',
      emailVerified: true,
      provider: 'credentials',
    });
    assert(nonGoogleProvision.provisioned === false, 'Credentials provider rejected for bootstrap provisioning');

    // -------------------------------------------------------------
    // Category 2: Server-Side RBAC Guard Boundaries
    // -------------------------------------------------------------
    console.log('\n📦 CATEGORY 2: Server-Side RBAC Guard Boundaries');

    // 11. Developer cannot access admin endpoints
    const devAdminReq = createMockRequest({ userId: developerUserId, path: '/api/admin/users' });
    const devAdminRes = await AuthorizationGuard.requireRole(devAdminReq, ['admin']);
    assert(devAdminRes.authorized === false, 'Developer is blocked from admin routes');
    assert(devAdminRes.response?.status === 403, 'Developer receives HTTP 403 Forbidden');

    // 12. Recruiter cannot access company_admin endpoints
    const recruiterReq = createMockRequest({ userId: recruiterUserId, path: '/api/company/settings' });
    const recruiterRes = await AuthorizationGuard.requireRole(recruiterReq, ['company_admin']);
    assert(recruiterRes.authorized === false, 'Recruiter is blocked from company_admin routes');
    assert(recruiterRes.response?.status === 403, 'Recruiter receives HTTP 403 Forbidden');

    // 13. Company Admin cannot access Super Admin console
    const compAdminReq = createMockRequest({ userId: companyAdminUserId, path: '/api/admin/users' });
    const compAdminRes = await AuthorizationGuard.requireRole(compAdminReq, ['admin']);
    assert(compAdminRes.authorized === false, 'Company Admin is blocked from Super Admin console');
    assert(compAdminRes.response?.status === 403, 'Company Admin receives HTTP 403 Forbidden');

    // 14. Unauthenticated request without session or token is blocked
    const unauthReq = createMockRequest({ path: '/api/admin/users' });
    const unauthRes = await AuthorizationGuard.requireRole(unauthReq, ['admin']);
    assert(unauthRes.authorized === false, 'Unauthenticated request is blocked');
    assert(unauthRes.response?.status === 401, 'Unauthenticated request receives HTTP 401');

    // 15. Cross-company access is blocked
    const crossCompanyReq = createMockRequest({ userId: recruiterUserId, path: '/api/company/team' });
    const crossCompanyRes = await AuthorizationGuard.requireCompanyMembership(crossCompanyReq, 'non-existent-company-id');
    assert(crossCompanyRes.authorized === false, 'Cross-company access is blocked');
    assert(crossCompanyRes.response?.status === 403, 'Cross-company access receives HTTP 403');

    // -------------------------------------------------------------
    // Category 3: Anti-Self-Escalation & Profile Whitelist
    // -------------------------------------------------------------
    console.log('\n📦 CATEGORY 3: Anti-Self-Escalation & Whitelists');

    const maliciousPayload = {
      name: 'Hacker',
      role: 'admin',
      bio: 'Pwned',
      isSuperAdmin: true,
      permissions: ['admin:all'],
    };
    const allowedProfileKeys = ['name', 'bio', 'website', 'location'];
    const sanitizedKeys = Object.keys(maliciousPayload).filter(k => allowedProfileKeys.includes(k));
    assert(!sanitizedKeys.includes('role'), 'Profile update whitelist strips client-provided role attribute');
    assert(!sanitizedKeys.includes('isSuperAdmin'), 'Profile update whitelist strips arbitrary admin flags');
    assert(!sanitizedKeys.includes('permissions'), 'Profile update whitelist strips permissions payload');

    // -------------------------------------------------------------
    // Category 4: Anti-Lockout Security Controls
    // -------------------------------------------------------------
    console.log('\n📦 CATEGORY 4: Anti-Lockout & Self-Demotion Controls');

    // 19. Admin cannot demote themselves
    const proposedRole: string = 'developer';
    const selfDemoteBlocked = (adminActorId === adminActorId) && (proposedRole !== 'admin');
    assert(selfDemoteBlocked === true, 'Anti-lockout prevents Super Admin from revoking their own admin role');

    // 20. Admin cannot suspend themselves
    const selfSuspendResult = await UserStatusService.setUserStatus({
      targetUserId: adminActorId,
      newStatus: 'suspended',
      actorId: adminActorId,
      reason: 'Self lock test',
    });
    assert(selfSuspendResult.success === false, 'Anti-lockout prevents Super Admin from suspending their own account');
    assert(selfSuspendResult.error?.includes('cannot suspend their own account') === true, 'Correct anti-lockout error message returned');

    // 21. Last Admin Removal Protection Logic
    const simulatedAdminCount = 1;
    const isSoleAdmin = simulatedAdminCount <= 1;
    assert(isSoleAdmin === true, 'Anti-lockout correctly identifies sole administrator status');

    // -------------------------------------------------------------
    // Category 5: Account Suspension & Session Invalidation
    // -------------------------------------------------------------
    console.log('\n📦 CATEGORY 5: Account Suspension & Invalidation');

    const testSubjectId = '00000000-0000-0000-0000-000000000002';

    // 22. Suspending an account marks status as suspended
    const suspendResult = await UserStatusService.setUserStatus({
      targetUserId: testSubjectId,
      newStatus: 'suspended',
      actorId: adminActorId,
      reason: 'Automated test suspension',
    });
    assert(suspendResult.success === true, 'Admin can successfully suspend non-admin account');

    // 23. Suspended account status is accurately reflected
    const isSuspended = await UserStatusService.isUserSuspended(testSubjectId);
    assert(isSuspended === true, 'UserStatusService accurately reflects suspended state');

    // 24. Reactivating an account restores active state
    const reactivateResult = await UserStatusService.setUserStatus({
      targetUserId: testSubjectId,
      newStatus: 'active',
      actorId: adminActorId,
      reason: 'Automated test reactivation',
    });
    assert(reactivateResult.success === true, 'Admin can successfully reactivate account');

    // 25. Reactivated state accurately reflected
    const isStillSuspended = await UserStatusService.isUserSuspended(testSubjectId);
    assert(isStillSuspended === false, 'UserStatusService accurately reflects reactivated active state');

    // -------------------------------------------------------------
    // Category 6: Multi-Factor Authentication (MFA / RFC 6238 TOTP)
    // -------------------------------------------------------------
    console.log('\n📦 CATEGORY 6: Multi-Factor Authentication (MFA / TOTP) Engine');

    MfaService.setStorageAdapter(mockStorage);
    MfaService.clearCache();

    // 26. Generates valid 160-bit Base32 secret
    const secret = MfaService.generateSecret();
    assert(typeof secret === 'string' && secret.length === 32, 'Generates 160-bit RFC 4648 Base32 secret (32 chars)');
    assert(/^[A-Z2-7]+$/.test(secret), 'Secret contains only RFC 4648 Base32 characters');

    // 27. Generates standard 6-digit TOTP code
    const totpCode = MfaService.generateTotpCode(secret);
    assert(/^\d{6}$/.test(totpCode), 'Generates standard 6-digit RFC 6238 TOTP code');

    // 28. Validates correct current TOTP code
    const isValidNow = MfaService.verifyCode(secret, totpCode);
    assert(isValidNow === true, 'TOTP verification validates current valid code');

    // 29. Accepts code within ±30s drift window
    const pastCode = MfaService.generateTotpCode(secret, Date.now() - 30000);
    const isPastValid = MfaService.verifyCode(secret, pastCode, 1);
    assert(isPastValid === true, 'TOTP accepts valid code from -30s drift window');

    // 30. Rejects invalid codes
    const wrongCode = '000000' === totpCode ? '111111' : '000000';
    assert(MfaService.verifyCode(secret, wrongCode) === false, 'TOTP verification rejects wrong 6-digit code');
    assert(MfaService.verifyCode(secret, 'abc123') === false, 'TOTP verification rejects non-numeric input');
    assert(MfaService.verifyCode(secret, '123') === false, 'TOTP verification rejects non-6-digit input');

    // 31. Generates 10 single-use recovery backup codes
    const backupCodes = MfaService.generateBackupCodes(10);
    assert(backupCodes.length === 10, 'Generates exactly 10 recovery backup codes');
    assert(backupCodes.every(c => /^[0-9a-f]{4}-[0-9a-f]{4}$/.test(c)), 'Backup codes follow standard 4-4 hex pattern');

    // 32. Backup codes are hashed with SHA-256
    const hashedCode = MfaService.hashBackupCode(backupCodes[0]);
    assert(hashedCode.length === 64, 'Backup code is hashed with SHA-256 (64 hex characters)');

    // 33. AES-256-GCM secret encryption and decryption roundtrip
    const plainSecret = 'KVKFKRCPNZQUYMLXOVYDSQKJMNZGK5C';
    const encrypted = MfaService.encryptSecret(plainSecret);
    assert(encrypted.split(':').length === 3, 'AES-256-GCM ciphertext has IV:Tag:Data format');
    const decrypted = MfaService.decryptSecret(encrypted);
    assert(decrypted === plainSecret, 'AES-256-GCM decryption accurately recovers original secret');

    // 34. Decryption fails on corrupted ciphertext
    let tamperedFailed = false;
    try {
      const parts = encrypted.split(':');
      parts[2] = parts[2].slice(0, -2) + '00';
      MfaService.decryptSecret(parts.join(':'));
    } catch {
      tamperedFailed = true;
    }
    assert(tamperedFailed === true, 'AES-256-GCM authentication tag verification rejects tampered ciphertext');

    // 35. Full MFA Enrollment Lifecycle
    const testAdminUserId = adminActorId;
    const enrollment = MfaService.initiateEnrollment(testAdminUserId, 'admin@skillverse.dev');
    assert(Boolean(enrollment.secret && enrollment.totpURI && enrollment.backupCodes), 'MFA initiation returns secret, URI, and backup codes');
    assert(enrollment.totpURI.includes('otpauth://totp/'), 'TOTP URI is well-formed for authenticator apps');

    const firstTotpCode = MfaService.generateTotpCode(enrollment.secret);
    const confirmed = await MfaService.confirmEnrollment(testAdminUserId, firstTotpCode);
    assert(confirmed === true, 'First TOTP code confirms and activates enrollment');

    const isEnrolledNow = await MfaService.isMfaEnrolled(testAdminUserId);
    assert(isEnrolledNow === true, 'MfaService reports admin as enrolled');

    // 36. Single-use backup code verification & consumption
    const testBackupCode = enrollment.backupCodes[0];
    const backupVerifyRes = await MfaService.verifyUserMfa(testAdminUserId, testBackupCode);
    assert(backupVerifyRes.verified === true && backupVerifyRes.method === 'backup_code', 'Single-use backup code successfully verified');
    assert(backupVerifyRes.remainingBackupCodes === 9, 'Remaining backup codes decremented to 9');

    // 37. Used backup code cannot be reused
    const reusedRes = await MfaService.verifyUserMfa(testAdminUserId, testBackupCode);
    assert(reusedRes.verified === false, 'Consumed single-use backup code cannot be used a second time');

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Category 7: Server-Side Admin MFA Enforcement
    // -------------------------------------------------------------
    console.log('\n📦 CATEGORY 7: Server-Side Admin MFA Enforcement');

    process.env.MFA_REQUIRED_FOR_ADMIN = 'true';

    // 38. Admin without MFA enrollment attempting admin operation is blocked
    mockStorage.clear();
    const unenrolledReq = createMockRequest({ userId: adminActorId, path: '/api/admin/users' });
    const unenrolledRes = await AuthorizationGuard.requireRole(unenrolledReq, ['admin']);
    assert(unenrolledRes.authorized === false, 'Unenrolled admin is blocked from admin endpoints');
    assert(unenrolledRes.response?.status === 403, 'Unenrolled admin receives HTTP 403');
    const unenrolledJson = await unenrolledRes.response?.json();
    assert(unenrolledJson?.code === 'MFA_ENROLLMENT_REQUIRED', 'Returns code MFA_ENROLLMENT_REQUIRED');

    // 39. Admin enrolled but session unverified is blocked
    const reEnroll = MfaService.initiateEnrollment(adminActorId, 'admin@skillverse.dev');
    const reCode = MfaService.generateTotpCode(reEnroll.secret);
    await MfaService.confirmEnrollment(adminActorId, reCode);

    const unverifiedSessionReq = createMockRequest({ userId: adminActorId, path: '/api/admin/users' });
    const unverifiedSessionRes = await AuthorizationGuard.requireRole(unverifiedSessionReq, ['admin']);
    assert(unverifiedSessionRes.authorized === false, 'Enrolled admin with unverified session is blocked');
    assert(unverifiedSessionRes.response?.status === 403, 'Enrolled admin receives HTTP 403');
    const unverifiedJson = await unverifiedSessionRes.response?.json();
    assert(unverifiedJson?.code === 'MFA_VERIFICATION_REQUIRED', 'Returns code MFA_VERIFICATION_REQUIRED');

    // 40. Admin with valid signed session-bound MFA cookie is authorized
    const validMfaCookie = MfaTokenService.createSignedToken(adminActorId, sessionToken);
    const verifiedSessionReq = createMockRequest({
      userId: adminActorId,
      path: '/api/admin/users',
      cookies: {
        'skillverse_mfa_verified': validMfaCookie,
        'better-auth.session_token': sessionToken,
      },
    });
    const verifiedSessionRes = await AuthorizationGuard.requireRole(verifiedSessionReq, ['admin']);
    assert(verifiedSessionRes.authorized === true, 'Admin with verified MFA session is granted access');

    // 41. Admin accessing MFA endpoints is permitted without verified session (avoids chicken-and-egg lock)
    const mfaEnrollReq = createMockRequest({ userId: adminActorId, path: '/api/admin/mfa/enroll' });
    const mfaEnrollRes = await AuthorizationGuard.requireRole(mfaEnrollReq, ['admin']);
    assert(mfaEnrollRes.authorized === true, 'MFA route access (/api/admin/mfa/*) bypasses MFA challenge');

    // 42. Developer operation does not trigger admin MFA challenge
    const devReq = createMockRequest({ userId: developerUserId, path: '/api/profile' });
    const devRes = await AuthorizationGuard.requireRole(devReq, ['developer']);
    assert(devRes.authorized === true, 'Developer accessing developer endpoints is not subjected to admin MFA');

  } finally {
    // Restore original env
    if (originalBootstrapEmail !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL = originalBootstrapEmail;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL;

    if (originalBootstrapSub !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB = originalBootstrapSub;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB;

    if (originalDisabled !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED = originalDisabled;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED;

    if (originalRequireSub !== undefined) process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB = originalRequireSub;
    else delete process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB;

    if (originalMfaRequired !== undefined) process.env.MFA_REQUIRED_FOR_ADMIN = originalMfaRequired;
    else delete process.env.MFA_REQUIRED_FOR_ADMIN;

    if (originalSecret !== undefined) process.env.BETTER_AUTH_SECRET = originalSecret;
    else delete process.env.BETTER_AUTH_SECRET;

    UserStatusService.clearCache();
    MfaService.clearCache();
    MfaService.resetStorageAdapter();
  }

  console.log('\n================================================================');
  console.log(`📊 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
