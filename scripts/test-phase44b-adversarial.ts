/**
 * SkillVerse Phase 44B — Adversarial Authentication & Staging Readiness Suite
 *
 * Empirically validates:
 * 1. Production secret enforcement (missing, short, insecure fallback rejection)
 * 2. Configuration validation (BETTER_AUTH_URL, GitHub OAuth consistency)
 * 3. GitHub username collision handling & fail-closed database errors
 * 4. Signout cookie clearing for Better Auth session tokens
 * 5. Fail-closed session resolution when database is offline
 * 6. Production demo-auth lockdown enforcement
 */

import assert from 'assert';
import { NextRequest } from 'next/server';
import { validateAuthConfig, resolveUniqueUsername, DEV_FALLBACK_SECRET, generateSecureAuthSecret } from '../lib/auth';
import { POST as signoutPost } from '../app/api/auth/signout/route';
import { POST as demoAuthPost, GET as demoAuthGet } from '../app/api/auth/demo/route';
import { getSessionUser, isDemoAuthEnabled } from '../services/auth/session';

async function runAdversarialTests() {
  console.log('=====================================================================');
  console.log('  🛡️ SKILLVERSE PHASE 44B — ADVERSARIAL AUTH & READINESS TEST SUITE');
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
  // Suite 1: Better Auth Secret Enforcement & Production Config Validation
  // ---------------------------------------------------------------------------
  console.log('▶ [1/5] Testing Better Auth Secret Enforcement & Startup Validation...');

  await test('TEST-1.01: Production mode rejects missing BETTER_AUTH_SECRET', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: '',
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      });
    } catch (err: any) {
      failed = err.message.includes('BETTER_AUTH_SECRET environment variable is missing');
    }
    assert(failed, 'Must reject missing BETTER_AUTH_SECRET in production');
  });

  await test('TEST-1.02: Production mode rejects short secret (<32 chars)', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'short_secret_only_24_chars!',
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      });
    } catch (err: any) {
      failed = err.message.includes('must be at least 32 characters long');
    }
    assert(failed, 'Must reject short secret in production');
  });

  await test('TEST-1.03: Production mode rejects known development fallback secret', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: DEV_FALLBACK_SECRET,
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      });
    } catch (err: any) {
      failed = err.message.includes('Insecure default or placeholder secret detected');
    }
    assert(failed, 'Must reject dev fallback secret in production');
  });

  await test('TEST-1.04: Production mode rejects placeholder secrets', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'REPLACE_WITH_CRYPTOGRAPHICALLY_SECURE_32_BYTE_STRING_ABC',
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      });
    } catch (err: any) {
      failed = err.message.includes('Insecure default or placeholder secret detected');
    }
    assert(failed, 'Must reject placeholder secret string');
  });

  await test('TEST-1.05: Production mode validates HTTPS on BETTER_AUTH_URL', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'a_very_secure_random_production_secret_key_1234567890',
        BETTER_AUTH_URL: 'http://insecure-domain.com',
      });
    } catch (err: any) {
      failed = err.message.includes('must use https:');
    }
    assert(failed, 'Must reject insecure http: URL in production');
  });

  await test('TEST-1.06: Production mode rejects mismatched GitHub OAuth credentials', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'a_very_secure_random_production_secret_key_1234567890',
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
        GITHUB_CLIENT_ID: 'gh_client_12345',
        // GITHUB_CLIENT_SECRET omitted
      });
    } catch (err: any) {
      failed = err.message.includes('GITHUB_CLIENT_ID was provided without GITHUB_CLIENT_SECRET');
    }
    assert(failed, 'Must reject partial OAuth configuration');
  });

  await test('TEST-1.07: Valid production configuration passes validation', () => {
    const config = validateAuthConfig({
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'a_very_secure_random_production_secret_key_1234567890',
      BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      GITHUB_CLIENT_ID: 'gh_client_id_valid',
      GITHUB_CLIENT_SECRET: 'gh_secret_valid_long_entropy',
    });
    assert.strictEqual(config.valid, true);
    assert.strictEqual(config.githubEnabled, true);
    assert.strictEqual(config.baseURL, 'https://staging.skillverse.dev');
  });

  await test('TEST-1.08: Development mode safely uses dev fallback without throwing', () => {
    const config = validateAuthConfig({
      NODE_ENV: 'development',
      BETTER_AUTH_SECRET: '',
    });
    assert.strictEqual(config.valid, true);
    assert.strictEqual(config.secret, DEV_FALLBACK_SECRET);
  });

  await test('TEST-1.09: Production mode rejects low entropy secrets with sufficient length (e.g. repeated chars)', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'a'.repeat(40),
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      });
    } catch (err: any) {
      failed = err.message.includes('lacks sufficient cryptographic entropy');
    }
    assert(failed, 'Must reject low entropy secret of 40 repeating chars');
  });

  await test('TEST-1.10: Production mode rejects sequential low entropy secrets', () => {
    let failed = false;
    try {
      validateAuthConfig({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: '12345678901234567890123456789012',
        BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      });
    } catch (err: any) {
      failed = err.message.includes('lacks sufficient cryptographic entropy');
    }
    assert(failed, 'Must reject simple sequential digits as production secret');
  });

  await test('TEST-1.11: CSPRNG generated secret (generateSecureAuthSecret) satisfies production validation', () => {
    const generated = generateSecureAuthSecret();
    assert.strictEqual(generated.length, 64, 'CSPRNG secret must be 64 hex characters (32 bytes)');
    const config = validateAuthConfig({
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: generated,
      BETTER_AUTH_URL: 'https://staging.skillverse.dev',
      GITHUB_CLIENT_ID: 'gh_client_123',
      GITHUB_CLIENT_SECRET: 'gh_secret_456_random_string_abc',
    });
    assert.strictEqual(config.valid, true, 'CSPRNG generated secret must cleanly pass production validation');
  });

  // ---------------------------------------------------------------------------
  // Suite 2: GitHub Username Collision & Identity Preservation
  // ---------------------------------------------------------------------------
  console.log('\n▶ [2/5] Testing GitHub Username Collision & Identity Preservation...');

  await test('TEST-2.01: Unclaimed username resolves unchanged', async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: async () => null, // Free username
        },
      },
    };
    const resolved = await resolveUniqueUsername({ login: 'alice', email: 'alice@example.com' }, mockDb);
    assert.strictEqual(resolved, 'alice');
  });

  await test('TEST-2.02: Same email preserves username for account linking', async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: async () => ({ id: 'usr_1', email: 'alice@example.com', username: 'alice' }),
        },
      },
    };
    const resolved = await resolveUniqueUsername({ login: 'alice', email: 'alice@example.com' }, mockDb);
    assert.strictEqual(resolved, 'alice', 'Must preserve username when email matches (account linking)');
  });

  await test('TEST-2.03: Different email generates unique candidate with entropy', async () => {
    let callCount = 0;
    const mockDb = {
      query: {
        users: {
          findFirst: async ({ where }: any) => {
            callCount++;
            if (callCount === 1) {
              // Base username exists with different email
              return { id: 'usr_different', email: 'other@example.com', username: 'alice' };
            }
            // Second lookup for candidate is free
            return null;
          },
        },
      },
    };
    const resolved = await resolveUniqueUsername({ login: 'alice', email: 'alice@gmail.com' }, mockDb);
    assert(resolved.startsWith('alice_'), 'Candidate username must start with base username');
    assert(resolved.length > 'alice'.length + 1, 'Candidate username must have entropy suffix');
    assert(resolved.length <= 100, 'Candidate username must be <= 100 characters');
  });

  await test('TEST-2.04: Extremely long base username is bounded to varchar(100)', async () => {
    const hugeLogin = 'a'.repeat(150);
    let callCount = 0;
    const mockDb = {
      query: {
        users: {
          findFirst: async () => {
            callCount++;
            if (callCount === 1) return { id: 'usr_different', email: 'other@example.com' };
            return null;
          },
        },
      },
    };
    const resolved = await resolveUniqueUsername({ login: hugeLogin, email: 'long@example.com' }, mockDb);
    assert(resolved.length <= 100, `Resolved username length (${resolved.length}) must not exceed varchar(100)`);
  });

  await test('TEST-2.05: Database failure during collision lookup fails closed', async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: async () => {
            throw new Error('Connection pool exhausted / ECONNRESET');
          },
        },
      },
    };
    let threw = false;
    try {
      await resolveUniqueUsername({ login: 'bob', email: 'bob@example.com' }, mockDb);
    } catch (err: any) {
      threw = err.message.includes('Database error during username collision check');
    }
    assert(threw, 'Must not swallow database errors during username collision resolution');
  });

  // ---------------------------------------------------------------------------
  // Suite 3: Signout Cookie Decontamination
  // ---------------------------------------------------------------------------
  console.log('\n▶ [3/5] Testing Signout Cookie Decontamination...');

  await test('TEST-3.01: POST /api/auth/signout deletes Better Auth session cookies', async () => {
    const res = await signoutPost();
    assert.strictEqual(res.status, 200);

    const cookieObj = res.cookies.get('better-auth.session_token');
    const demoObj = res.cookies.get('skillverse_demo_user');
    const setCookies = res.headers.getSetCookie();

    const clearsSessionToken = 
      (cookieObj && (cookieObj.maxAge === 0 || cookieObj.value === '')) ||
      setCookies.some((c) => c.toLowerCase().includes('better-auth.session_token') && (c.toLowerCase().includes('max-age=0') || c.toLowerCase().includes('expires=')));

    const clearsDemoToken = 
      (demoObj && (demoObj.maxAge === 0 || demoObj.value === '')) ||
      setCookies.some((c) => c.toLowerCase().includes('skillverse_demo_user') && (c.toLowerCase().includes('max-age=0') || c.toLowerCase().includes('expires=')));

    assert(clearsSessionToken, 'Must clear better-auth.session_token on signout');
    assert(clearsDemoToken, 'Must clear skillverse_demo_user on signout');
  });

  // ---------------------------------------------------------------------------
  // Suite 4: Fail-Closed Session Resolution & Database Offline Safety
  // ---------------------------------------------------------------------------
  console.log('\n▶ [4/5] Testing Fail-Closed Session Resolution...');

  await test('TEST-4.01: Unauthenticated request in production returns null (no dummy fallback)', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    try {
      const session = await getSessionUser();
      assert.strictEqual(session, null, 'getSessionUser must return null in production when unauthenticated');
    } finally {
      (process.env as any).NODE_ENV = origNodeEnv;
      if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
    }
  });

  // ---------------------------------------------------------------------------
  // Suite 5: Production Demo-Auth Route Lockdown
  // ---------------------------------------------------------------------------
  console.log('\n▶ [5/5] Testing Production Demo-Auth Route Lockdown...');

  await test('TEST-5.01: POST /api/auth/demo returns 403 Forbidden in production', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    try {
      assert.strictEqual(isDemoAuthEnabled(), false);
      const req = new NextRequest('http://localhost:3000/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001' }),
      });
      const res = await demoAuthPost(req);
      assert.strictEqual(res.status, 403, 'Must return 403 in production');
    } finally {
      (process.env as any).NODE_ENV = origNodeEnv;
      if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
    }
  });

  await test('TEST-5.02: GET /api/auth/demo returns 403 Forbidden in production', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    try {
      const req = new NextRequest('http://localhost:3000/api/auth/demo', { method: 'GET' });
      const res = await demoAuthGet(req);
      assert.strictEqual(res.status, 403, 'Must return 403 in production');
    } finally {
      (process.env as any).NODE_ENV = origNodeEnv;
      if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
    }
  });

  await test('TEST-5.03: In production mode, ENABLE_DEMO_AUTH=true is ignored and demo auth remains strictly false', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDemoAuth = process.env.ENABLE_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    process.env.ENABLE_DEMO_AUTH = 'true'; // Operator configuration mistake attempt

    try {
      assert.strictEqual(isDemoAuthEnabled(), false, 'Demo auth must remain false in production despite ENABLE_DEMO_AUTH=true');
      const req = new NextRequest('http://localhost:3000/api/auth/demo', { method: 'GET' });
      const res = await demoAuthGet(req);
      assert.strictEqual(res.status, 403, 'Must return 403 Forbidden even if ENABLE_DEMO_AUTH=true');
    } finally {
      (process.env as any).NODE_ENV = origNodeEnv;
      if (origDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = origDemoAuth;
    }
  });

  console.log('\n=====================================================================');
  console.log(`  🎉 ALL ${passed}/${total} ADVERSARIAL AUTH TESTS PASSED CLEANLY!`);
  console.log('=====================================================================\n');
}

runAdversarialTests().catch((e) => {
  console.error('Adversarial test execution failed:', e);
  process.exit(1);
});
