/**
 * SkillVerse Phase 43C — Critical Security & Database Remediation Test Suite
 * 
 * Validates:
 * 1. Authentication bypass elimination (anonymous requests rejected with 401)
 * 2. Demo route lockdown in production mode (403 Forbidden regardless of payload)
 * 3. Removal of hardcoded master API token & rejection of invalid/revoked tokens
 * 4. Anti-IDOR enforcement (cross-user & cross-company access denied with 403)
 * 5. Elimination of fabricated success on database failures / missing records
 * 6. Non-execution of schema synchronization on module import
 */

import { NextRequest } from 'next/server';
import { getSessionUser, isDemoAuthEnabled } from '../services/supabase';
import { ApiAuthService } from '../services/api/auth';
import { AuthorizationGuard } from '../services/security/authorizer';
import { PersonalAccessTokenService } from '../services/api/tokens';
import { DataControlsService } from '../services/security/dataControls';

// Test harness
let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`   ✅ PASS: ${message}`);
  } else {
    console.error(`   ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSecurityTests() {
  console.log('\n================================================================');
  console.log('  🛡️ SKILLVERSE PHASE 43C — CRITICAL SECURITY REMEDIATION TESTS');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Test Suite 1: Authentication & Anonymous Access Enforcement
  // -------------------------------------------------------------------------
  console.log('▶ [1/6] Testing Authentication Enforcement & Anonymous Access Rejection...');
  {
    // Save original env
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;

    // Simulate production environment
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    assert(!isDemoAuthEnabled(), 'Demo authentication is strictly disabled in production mode');

    // Unauthenticated getSessionUser() must return null
    const sessionUser = await getSessionUser();
    assert(sessionUser === null, 'getSessionUser() returns null when unauthenticated (no dummy fallback)');

    // Anonymous API request rejected with 401
    const anonymousReq = new NextRequest('http://localhost:3000/api/profile', {
      method: 'GET',
    });

    const authResult = await AuthorizationGuard.requireAuth(anonymousReq);
    assert(!authResult.authorized, 'requireAuth() rejects anonymous request');
    assert(authResult.response?.status === 401, 'requireAuth() returns HTTP 401 status');

    // Restore env
    (process.env as any).NODE_ENV = origNodeEnv;
    if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
  }

  // -------------------------------------------------------------------------
  // Test Suite 2: Demo Authentication Route & Impersonation Lockdown
  // -------------------------------------------------------------------------
  console.log('\n▶ [2/6] Testing Demo Route Lockdown in Production Mode...');
  {
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;

    // Lock down to production
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    const { POST: demoPost, GET: demoGet, DELETE: demoDelete } = await import('../app/api/auth/demo/route');

    // Attempt demo login in production
    const impersonateReq = new NextRequest('http://localhost:3000/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001' }),
    });

    const postRes = await demoPost(impersonateReq);
    assert(postRes.status === 403, 'POST /api/auth/demo returns 403 Forbidden in production mode');

    const getRes = await demoGet(impersonateReq);
    assert(getRes.status === 403, 'GET /api/auth/demo returns 403 Forbidden in production mode');

    const deleteRes = await demoDelete(impersonateReq);
    assert(deleteRes.status === 403, 'DELETE /api/auth/demo returns 403 Forbidden in production mode');

    // Attempt IDE auth demo username impersonation in production
    const { POST: ideAuthPost } = await import('../app/api/ide/auth/route');
    const ideImpersonateReq = new NextRequest('http://localhost:3000/api/ide/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'siddharthkadbhane-pixel' }),
    });

    const idePostRes = await ideAuthPost(ideImpersonateReq);
    assert(idePostRes.status === 403, 'POST /api/ide/auth rejects username impersonation with 403 in production');

    // Restore env
    (process.env as any).NODE_ENV = origNodeEnv;
    if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
  }

  // -------------------------------------------------------------------------
  // Test Suite 3: Hardcoded Credential Removal & Token Validation
  // -------------------------------------------------------------------------
  console.log('\n▶ [3/6] Testing Hardcoded Credential Removal & Persistent Token Security...');
  {
    // The exposed master token from Phase 43B audit
    const EXPOSED_MASTER_KEY = 'sk_live_00000000_siddharth_lead_architect_key';

    const checkMasterKey = await PersonalAccessTokenService.validateToken(EXPOSED_MASTER_KEY);
    assert(!checkMasterKey.isValid, 'Hardcoded master developer key is rejected as invalid token');
    assert(checkMasterKey.errorReason === 'INVALID_TOKEN', 'Master key returns errorReason: INVALID_TOKEN');

    // Create a real personal access token
    const created = await PersonalAccessTokenService.createToken(
      '00000000-0000-0000-0000-000000000001',
      'Phase 43C Test Key',
      ['read:profile', 'read:dcc']
    );

    assert(created.rawToken.startsWith('sk_live_'), 'Generated token has correct prefix');
    assert(created.token.tokenPrefix.startsWith('sk_live_...'), 'Token prefix is safely masked');

    // Validate the token
    const validCheck = await PersonalAccessTokenService.validateToken(created.rawToken);
    assert(validCheck.isValid === true, 'Cryptographically generated token validates successfully');
    assert(validCheck.tokenData?.userId === '00000000-0000-0000-0000-000000000001', 'Token resolves correct userId');

    // Revoke the token (userId, tokenId)
    const revoked = await PersonalAccessTokenService.revokeToken('00000000-0000-0000-0000-000000000001', created.token.id);
    assert(revoked === true, 'Token revoked successfully');

    // Re-validate revoked token
    const postRevocationCheck = await PersonalAccessTokenService.validateToken(created.rawToken);
    assert(!postRevocationCheck.isValid, 'Revoked token is rejected');
    assert(postRevocationCheck.errorReason === 'REVOKED', 'Revocation error is explicitly REVOKED');

    // Request with revoked Bearer token is rejected with 401
    const revokedReq = new NextRequest('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${created.rawToken}` },
    });
    const authRevoked = await ApiAuthService.authenticate(revokedReq);
    assert(!authRevoked.success, 'ApiAuthService rejects request with revoked token');
    assert(authRevoked.errorCode === 'TOKEN_REVOKED', 'ErrorCode is TOKEN_REVOKED');
  }

  // -------------------------------------------------------------------------
  // Test Suite 4: Tenant Isolation & Anti-IDOR Enforcement
  // -------------------------------------------------------------------------
  console.log('\n▶ [4/6] Testing Anti-IDOR Enforcement & Tenant Scoping...');
  {
    // Create token for User A
    const userAToken = await PersonalAccessTokenService.createToken(
      '00000000-0000-0000-0000-000000000001',
      'User A Token',
      ['read:profile', 'write:repositories']
    );

    const userAReq = new NextRequest('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${userAToken.rawToken}` },
    });

    // User A accessing User A's resources -> Allowed
    const selfCheck = await AuthorizationGuard.requireResourceOwner(userAReq, '00000000-0000-0000-0000-000000000001');
    assert(selfCheck.authorized, 'User A is authorized to access own resource');

    // User A accessing User B's resources -> Forbidden (Anti-IDOR)
    const crossCheck = await AuthorizationGuard.requireResourceOwner(userAReq, '00000000-0000-0000-0000-000000000002');
    assert(!crossCheck.authorized, 'User A is blocked from accessing User B resource');
    assert(crossCheck.response?.status === 403, 'Cross-user access denied with HTTP 403');

    // User A accessing unauthorized company workspace -> Forbidden
    const companyCheck = await AuthorizationGuard.requireCompanyMembership(userAReq, 'comp_unauthorized_999');
    assert(!companyCheck.authorized, 'User A is blocked from foreign company workspace');
    assert(companyCheck.response?.status === 403, 'Cross-company access denied with HTTP 403');
  }

  // -------------------------------------------------------------------------
  // Test Suite 5: Elimination of Fabricated Responses on Database Failures
  // -------------------------------------------------------------------------
  console.log('\n▶ [5/6] Testing Safe Error Handling & No Fabricated Database Success...');
  {
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;

    // Production mode
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    // GDPR export for non-existent user must NOT fabricate user 0 dummy data
    let exportFailedSafely = false;
    try {
      await DataControlsService.exportUserData('99999999-9999-9999-9999-999999999999');
    } catch {
      exportFailedSafely = true;
    }
    assert(exportFailedSafely, 'DataControlsService.exportUserData throws error for missing user in production (no dummy fabrication)');

    // Account anonymization for non-existent user must return failure
    const anonResult = await DataControlsService.anonymizeUser('99999999-9999-9999-9999-999999999999');
    assert(!anonResult.success, 'DataControlsService.anonymizeUser returns success: false on missing user / DB error');

    // Restore env
    (process.env as any).NODE_ENV = origNodeEnv;
    if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
  }

  // -------------------------------------------------------------------------
  // Test Suite 6: Database Schema Synchronization Lifecycle Verification
  // -------------------------------------------------------------------------
  console.log('\n▶ [6/6] Verifying Schema Synchronization Is Explicit & Not Executed on Import...');
  {
    // Inspect source code of lib/drizzle.ts to confirm syncDatabaseSchema().catch() is absent
    const fs = await import('fs');
    const path = await import('path');
    const drizzleSource = fs.readFileSync(path.join(process.cwd(), 'lib', 'drizzle.ts'), 'utf-8');

    const hasAutoInvoke = drizzleSource.includes('syncDatabaseSchema().catch');
    assert(!hasAutoInvoke, 'lib/drizzle.ts does NOT automatically invoke syncDatabaseSchema() upon module import');

    // Verify Drizzle config prioritizes unpooled direct URL
    const drizzleConfigSource = fs.readFileSync(path.join(process.cwd(), 'drizzle.config.ts'), 'utf-8');
    const hasUnpooled = drizzleConfigSource.includes('DATABASE_URL_UNPOOLED');
    assert(hasUnpooled, 'drizzle.config.ts prioritizes DATABASE_URL_UNPOOLED for migration tooling');
  }

  console.log('\n================================================================');
  console.log(`  🎉 PHASE 43C COMPLETE: ${passedTests}/${totalTests} TESTS PASSED CLEANLY!`);
  console.log('================================================================\n');

  process.exit(0);
}

runSecurityTests().catch((err) => {
  console.error('\n❌ Uncaught error during security test execution:', err);
  process.exit(1);
});
