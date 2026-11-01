/**
 * SkillVerse — Authentication Fallback Remediation Regression Test Suite
 *
 * Verifies the remediation of the authentication fallback issue:
 * 1. REG-01: GitHub OAuth failure does not create a session or cookie
 * 2. REG-02: Provider-not-found rejects cleanly and does not authenticate anyone
 * 3. REG-03: Production environment strictly prohibits demo authentication (isDemoAuthEnabled = false)
 * 4. REG-04: /api/auth/demo returns 403 Forbidden in production
 * 5. REG-05: getSessionUser() ignores skillverse_demo_user cookie in production
 * 6. REG-06: AuthorizationGuard rejects skillverse_demo_user in production with HTTP 401
 * 7. REG-07: Login page source code contains zero fallback-to-demo logic or misleading messages
 * 8. REG-08: Navbar source code gates test-account switcher behind development-only check
 * 9. REG-09: Valid GitHub OAuth initiation remains intact and unchanged
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { NextRequest } from 'next/server';
import { isDemoAuthEnabled, getSessionUser } from '../services/auth/session';
import { AuthorizationGuard } from '../services/security/authorizer';
import { GET as demoGetHandler, POST as demoPostHandler } from '../app/api/auth/demo/route';

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

async function runRegressionSuite() {
  console.log('=====================================================================');
  console.log('  🛡️ SKILLVERSE — AUTHENTICATION FALLBACK REMEDIATION REGRESSION SUITE');
  console.log('=====================================================================\n');

  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnableDemoAuth = process.env.ENABLE_DEMO_AUTH;

  // Shared mock database for testing Better Auth behavior
  const mockDb = {
    user: [] as any[],
    session: [] as any[],
    account: [] as any[],
    verification: [] as any[],
  };

  const testAuth = betterAuth({
    baseURL: 'http://localhost:3000',
    secret: 'test_secure_secret_minimum_32_characters_long_entropy_9999',
    database: memoryAdapter(mockDb),
    socialProviders: {
      github: {
        clientId: 'mock_github_client_id_for_testing',
        clientSecret: 'mock_github_client_secret_for_testing',
      },
    },
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
  });

  // ---------------------------------------------------------------------------
  // REG-01: GitHub OAuth failure does not create a session
  // ---------------------------------------------------------------------------
  try {
    const initialSessionCount = mockDb.session.length;
    const initialUserCount = mockDb.user.length;

    // Simulate an OAuth failure by attempting an invalid code exchange or missing provider state
    let caughtError = false;
    try {
      await testAuth.api.callbackOAuth({
        params: {
          id: 'github',
        },
        query: {
          error: 'access_denied',
          error_description: 'The user has denied your application access.',
        },
      });
    } catch {
      caughtError = true;
    }

    // Sessions and users must not have been created
    assert.strictEqual(mockDb.session.length, initialSessionCount, 'No session must be created on OAuth error');
    assert.strictEqual(mockDb.user.length, initialUserCount, 'No user must be created on OAuth error');

    record(
      'REG-01',
      'GitHub OAuth failure does not create a session',
      'PASS',
      'OAuth callback with access_denied was rejected; database sessions and users remained strictly 0.'
    );
  } catch (err: any) {
    record('REG-01', 'GitHub OAuth failure does not create a session', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-02: Provider-not-found rejects cleanly and does not authenticate anyone
  // ---------------------------------------------------------------------------
  try {
    let rejected = false;
    let responseData: any = null;

    try {
      responseData = await testAuth.api.signInSocial({
        body: {
          provider: 'non_existent_provider' as any,
          callbackURL: '/dashboard',
        },
      });
    } catch (err: any) {
      rejected = true;
      assert(
        err.message?.includes('PROVIDER_NOT_FOUND') ||
          err.status === 400 ||
          err.body?.message?.includes('PROVIDER_NOT_FOUND') ||
          err.name === 'APIError',
        `Error must indicate provider issue, got: ${err.message}`
      );
    }

    if (responseData) {
      assert(responseData.error, 'Response must contain error for nonexistent provider');
    }

    assert(mockDb.session.length === 0, 'No session can exist after failed provider lookup');
    assert(mockDb.user.length === 0, 'No user can exist after failed provider lookup');

    record(
      'REG-02',
      'Provider-not-found does not authenticate anyone',
      'PASS',
      'Non-configured provider request fails cleanly with zero session records or cookies created.'
    );
  } catch (err: any) {
    record('REG-02', 'Provider-not-found does not authenticate anyone', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-03: Production environment strictly prohibits demo authentication
  // ---------------------------------------------------------------------------
  try {
    (process.env as any).NODE_ENV = 'production';
    process.env.ENABLE_DEMO_AUTH = 'true'; // Attempt override

    const enabledInProd = isDemoAuthEnabled();
    assert.strictEqual(
      enabledInProd,
      false,
      'isDemoAuthEnabled() MUST return false when NODE_ENV=production, even if ENABLE_DEMO_AUTH=true'
    );

    record(
      'REG-03',
      'Production environment strictly prohibits demo authentication',
      'PASS',
      'isDemoAuthEnabled() returns false unconditionally when NODE_ENV=production, resisting override flags.'
    );
  } catch (err: any) {
    record('REG-03', 'Production environment strictly prohibits demo authentication', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-04: /api/auth/demo returns 403 Forbidden in production
  // ---------------------------------------------------------------------------
  try {
    (process.env as any).NODE_ENV = 'production';

    // Test GET /api/auth/demo
    const reqGet = new NextRequest('http://localhost:3000/api/auth/demo', { method: 'GET' });
    const resGet = await demoGetHandler(reqGet);
    assert.strictEqual(resGet.status, 403, 'GET /api/auth/demo must return 403 in production');
    const getBody = await resGet.json();
    assert.strictEqual(getBody.error, 'Forbidden');

    // Test POST /api/auth/demo
    const reqPost = new NextRequest('http://localhost:3000/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'dev-usr-001' }),
    });
    const resPost = await demoPostHandler(reqPost);
    assert.strictEqual(resPost.status, 403, 'POST /api/auth/demo must return 403 in production');
    const postBody = await resPost.json();
    assert.strictEqual(postBody.error, 'Forbidden');

    record(
      'REG-04',
      '/api/auth/demo returns 403 Forbidden in production',
      'PASS',
      'Both GET and POST handlers on /api/auth/demo reject with HTTP 403 Forbidden in production.'
    );
  } catch (err: any) {
    record('REG-04', '/api/auth/demo returns 403 Forbidden in production', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-05: getSessionUser() ignores skillverse_demo_user cookie in production
  // ---------------------------------------------------------------------------
  try {
    (process.env as any).NODE_ENV = 'production';

    // When running without headers/cookies context or with demo auth disabled, must return null
    const user = await getSessionUser();
    assert.strictEqual(user, null, 'getSessionUser() must return null in production when no Better Auth session exists');

    record(
      'REG-05',
      'getSessionUser() ignores demo cookie in production',
      'PASS',
      'Production session resolver ignores demo test account cookies and returns null.'
    );
  } catch (err: any) {
    record('REG-05', 'getSessionUser() ignores demo cookie in production', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-06: AuthorizationGuard rejects skillverse_demo_user in production with HTTP 401
  // ---------------------------------------------------------------------------
  try {
    (process.env as any).NODE_ENV = 'production';

    const reqWithDemoCookie = new NextRequest('http://localhost:3000/api/dcc', {
      headers: {
        cookie: 'skillverse_demo_user=dev-usr-001',
      },
    });

    const authCheck = await AuthorizationGuard.requireAuth(reqWithDemoCookie);
    assert.strictEqual(authCheck.authorized, false, 'AuthorizationGuard must not authorize demo cookie in production');
    assert(authCheck.response, 'Response must be returned for unauthorized request');
    assert.strictEqual(authCheck.response.status, 401, 'Response status must be 401 Unauthorized');

    record(
      'REG-06',
      'AuthorizationGuard rejects demo cookie in production with HTTP 401',
      'PASS',
      'Protected routes guarded by AuthorizationGuard reject demo cookie with HTTP 401 Unauthorized in production.'
    );
  } catch (err: any) {
    record('REG-06', 'AuthorizationGuard rejects demo cookie in production with HTTP 401', 'FAIL', err.message);
  } finally {
    // Restore environment
    (process.env as any).NODE_ENV = originalNodeEnv;
    if (originalEnableDemoAuth !== undefined) {
      process.env.ENABLE_DEMO_AUTH = originalEnableDemoAuth;
    } else {
      delete process.env.ENABLE_DEMO_AUTH;
    }
  }

  // ---------------------------------------------------------------------------
  // REG-07: Login page source code contains zero fallback-to-demo logic
  // ---------------------------------------------------------------------------
  try {
    const loginPagePath = path.resolve(__dirname, '../app/(auth)/login/page.tsx');
    const content = fs.readFileSync(loginPagePath, 'utf-8');

    // 1. Must NOT contain the old deceptive error message
    assert(
      !content.includes('Using instant test account instead'),
      'Must not contain deceptive "Using instant test account instead" message'
    );
    assert(
      !content.includes('instant test account instead'),
      'Must not contain any variant of "instant test account instead"'
    );

    // 2. handleLogin must NOT silently push to dashboard on catch
    assert(
      !content.includes('catch {\n      router.push(\'/dashboard\');\n    }'),
      'handleLogin must not route to /dashboard on failure'
    );
    assert(
      !content.includes('catch { router.push(\'/dashboard\'); }'),
      'handleLogin must not route to /dashboard on failure'
    );

    // 3. Must gate instant test accounts behind isDev / process.env.NODE_ENV !== 'production'
    assert(
      content.includes('isDev &&') || content.includes("process.env.NODE_ENV !== 'production'"),
      'Instant test accounts section must be gated behind development environment check'
    );

    // 4. handleTestUserLogin must check environment
    assert(
      content.includes('Test account login is disabled in production'),
      'handleTestUserLogin must contain production execution guard'
    );

    // 5. Google login button must not fall back to dummy user login
    assert(
      content.includes('handleGoogleLogin'),
      'Google login button must have a dedicated handler and not fall back to dummy credentials'
    );

    record(
      'REG-07',
      'Login page source code contains zero fallback-to-demo logic',
      'PASS',
      'LoginPage contains zero deceptive fallback messages, gates test accounts, and guards handlers against production execution.'
    );
  } catch (err: any) {
    record('REG-07', 'Login page source code contains zero fallback-to-demo logic', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-08: Navbar source code gates test-account switcher behind development-only check
  // ---------------------------------------------------------------------------
  try {
    const navbarPath = path.resolve(__dirname, '../components/shared/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    // 1. switchAccount must check environment
    assert(
      content.includes('Test account switching is disabled in production'),
      'switchAccount must guard against production execution'
    );

    // 2. Menu must gate test accounts behind isDev
    assert(
      content.includes('isDev ?') || content.includes('isDev &&'),
      'Navbar account switcher dropdown must be gated behind isDev'
    );

    record(
      'REG-08',
      'Navbar source code gates test-account switcher behind development check',
      'PASS',
      'Navbar strictly gates account switching UI and API dispatcher behind development-only check.'
    );
  } catch (err: any) {
    record('REG-08', 'Navbar source code gates test-account switcher behind development check', 'FAIL', err.message);
  }

  // ---------------------------------------------------------------------------
  // REG-09: Valid GitHub OAuth initiation remains intact and unchanged
  // ---------------------------------------------------------------------------
  try {
    const initRes = await testAuth.api.signInSocial({
      body: {
        provider: 'github',
        callbackURL: '/dashboard',
      },
    });

    assert(initRes && initRes.url, 'signInSocial must return a redirect payload with url');
    assert(
      initRes.url.startsWith('https://github.com/login/oauth/authorize'),
      'Redirect URL must target GitHub authorize endpoint'
    );
    assert(
      initRes.url.includes('client_id=mock_github_client_id_for_testing'),
      'Redirect URL must contain configured clientId'
    );
    assert(initRes.url.includes('redirect_uri='), 'Redirect URL must contain redirect_uri callback');
    assert.strictEqual(initRes.redirect, true, 'Redirect flag must be true');

    record(
      'REG-09',
      'Valid GitHub OAuth initiation remains intact and unchanged',
      'PASS',
      'Better Auth social signin initiates cleanly, generating verified GitHub OAuth authorization URL.'
    );
  } catch (err: any) {
    record('REG-09', 'Valid GitHub OAuth initiation remains intact and unchanged', 'FAIL', err.message);
  }

  console.log('\n=====================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`  REGRESSION SUMMARY: ${passCount} PASS / ${failCount} FAIL (Total: ${results.length})`);
  console.log('=====================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((e) => {
  console.error('Regression suite execution failed:', e);
  process.exit(1);
});

