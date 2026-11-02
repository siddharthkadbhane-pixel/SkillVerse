/**
 * SkillVerse — Google OAuth Implementation Verification Suite
 *
 * Verifies:
 * 1. Environment variable validation (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
 * 2. Fail-safe configuration (does not crash when Google OAuth is not configured)
 * 3. Exact Google OAuth callback URL resolution (/api/auth/callback/google)
 * 4. Google profile mapping (defaults role to 'developer', maps avatar, resolves unique username)
 * 5. Account linking policy (trustedProviders includes ['github', 'google'])
 * 6. UI integration (LoginPage contains both GitHub and Google handlers and buttons)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { validateAuthConfig, resolveUniqueUsername, auth } from '../lib/auth';

let passed = 0;
let total = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  total++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          passed++;
          console.log(`  ✅ [PASS] ${name}`);
        })
        .catch((err) => {
          console.error(`  ❌ [FAIL] ${name}:`, err.message);
          throw err;
        });
    } else {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    }
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function runGoogleAuthTestSuite() {
  console.log('=====================================================================');
  console.log('  🛡️ SKILLVERSE — GOOGLE OAUTH VERIFICATION SUITE');
  console.log('=====================================================================\n');

  // TEST 1: Environment variable validation in dev/test environment
  runTest('TEST-1: validateAuthConfig handles absent Google credentials gracefully in dev', () => {
    const devEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      BETTER_AUTH_SECRET: 'dev_auth_secret_minimum_32_characters_long_entropy',
      BETTER_AUTH_URL: 'http://localhost:3000',
    };
    const res = validateAuthConfig(devEnv);
    assert.strictEqual(res.googleEnabled, false, 'googleEnabled must be false when env vars are absent');
    assert.strictEqual(res.valid, true, 'Config must remain valid without crashing');
    assert.strictEqual(res.errors.length, 0, 'No errors should be recorded');
  });

  // TEST 2: Environment variable validation when Google credentials are provided
  runTest('TEST-2: validateAuthConfig enables Google when both CLIENT_ID and CLIENT_SECRET are provided', () => {
    const devEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      BETTER_AUTH_SECRET: 'dev_auth_secret_minimum_32_characters_long_entropy',
      BETTER_AUTH_URL: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: 'google_test_client_id_12345.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'google_test_client_secret_xyz789',
    };
    const res = validateAuthConfig(devEnv);
    assert.strictEqual(res.googleEnabled, true, 'googleEnabled must be true');
    assert.strictEqual(res.valid, true, 'Config must be valid');
  });

  // TEST 3: Production validation flags mismatched Google credentials
  runTest('TEST-3: Production mode rejects partial Google configuration (ID without Secret)', () => {
    const prodEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'a_very_secure_high_entropy_secret_1234567890_abcdef',
      BETTER_AUTH_URL: 'https://skill-verse-roan.vercel.app',
      GOOGLE_CLIENT_ID: 'google_client_id_only',
    };
    let threw = false;
    try {
      validateAuthConfig(prodEnv);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('GOOGLE_CLIENT_ID was provided without GOOGLE_CLIENT_SECRET'));
    }
    assert(threw, 'validateAuthConfig must throw when GOOGLE_CLIENT_ID is missing secret in production');
  });

  // TEST 4: Production mode rejects placeholder Google credentials
  runTest('TEST-4: Production mode rejects placeholder Google credentials', () => {
    const prodEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'a_very_secure_high_entropy_secret_1234567890_abcdef',
      BETTER_AUTH_URL: 'https://skill-verse-roan.vercel.app',
      GOOGLE_CLIENT_ID: 'placeholder_google_id',
      GOOGLE_CLIENT_SECRET: 'placeholder_google_secret',
    };
    let threw = false;
    try {
      validateAuthConfig(prodEnv);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('contains placeholder values'));
    }
    assert(threw, 'validateAuthConfig must throw when placeholders are used in production');
  });

  // TEST 5: Production mode gracefully allows Google credentials to be omitted without failing GitHub
  runTest('TEST-5: Production mode permits missing Google credentials so GitHub OAuth continues uninterrupted', () => {
    const prodEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'a_very_secure_high_entropy_secret_1234567890_abcdef',
      BETTER_AUTH_URL: 'https://skill-verse-roan.vercel.app',
      GITHUB_CLIENT_ID: 'gh_client_id_valid',
      GITHUB_CLIENT_SECRET: 'gh_client_secret_valid',
    };
    const res = validateAuthConfig(prodEnv);
    assert.strictEqual(res.githubEnabled, true, 'githubEnabled must be true');
    assert.strictEqual(res.googleEnabled, false, 'googleEnabled must be false without throwing');
    assert.strictEqual(res.valid, true, 'Config must remain valid');
  });

  // TEST 6: Better Auth Google provider and exact Callback URL derivation
  await runTest('TEST-6: Better Auth initializes Google provider with exact callback URL /api/auth/callback/google', async () => {
    const mockDb = { user: [] as any[], session: [] as any[], account: [] as any[], verification: [] as any[] };
    const testAuth = betterAuth({
      baseURL: 'https://skill-verse-roan.vercel.app',
      secret: 'a_very_secure_high_entropy_secret_1234567890_abcdef',
      database: memoryAdapter(mockDb),
      socialProviders: {
        google: {
          clientId: 'mock_google_id_123.apps.googleusercontent.com',
          clientSecret: 'mock_google_secret_456',
        },
      },
    });

    const initRes = await testAuth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL: '/overview',
      },
    });

    assert(initRes && initRes.url, 'signInSocial must return a redirect URL');
    assert(initRes.url.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'Must target Google authorization endpoint');
    assert(initRes.url.includes('client_id=mock_google_id_123.apps.googleusercontent.com'), 'Must contain configured Google Client ID');

    // Extract and decode redirect_uri
    const parsedUrl = new URL(initRes.url);
    const redirectUri = parsedUrl.searchParams.get('redirect_uri');
    assert.strictEqual(
      redirectUri,
      'https://skill-verse-roan.vercel.app/api/auth/callback/google',
      'The exact Google OAuth callback URL MUST be https://skill-verse-roan.vercel.app/api/auth/callback/google'
    );
  });

  // TEST 7: Google Profile Username Resolution (New Google user with no collision)
  await runTest('TEST-7: resolveUniqueUsername creates sanitized username for Google user without login field', async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: async () => null, // No collision
        },
      },
    };

    const googleProfile = {
      email: 'sophia.taylor@gmail.com',
      id: 'google_sub_987654321',
      name: 'Sophia Taylor',
    };

    const username = await resolveUniqueUsername(googleProfile, mockDb);
    assert.strictEqual(username, 'sophiataylor', 'Sanitized email prefix should become username');
  });

  // TEST 8: Google Profile Username Resolution with collision from different user
  await runTest('TEST-8: resolveUniqueUsername appends entropy when collision belongs to a different email', async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: async ({ where }: any) => {
            // First lookup collides with someone else's email
            return { id: 'other_user_id', email: 'someone_else@example.com', username: 'sophiataylor' };
          },
        },
      },
    };

    const googleProfile = {
      email: 'sophia.taylor@gmail.com',
      id: 'google_sub_987654321',
      name: 'Sophia Taylor',
    };

    const username = await resolveUniqueUsername(googleProfile, mockDb);
    assert(username.startsWith('sophiataylor_'), 'Must append entropy suffix on collision with different account');
    assert(username.length <= 100, 'Username must be <= 100 characters');
  });

  // TEST 9: Account linking - existing user with matching email preserves username
  await runTest('TEST-9: resolveUniqueUsername preserves existing username for matching email (Account Linking)', async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: async () => {
            // Matches existing user who registered with GitHub under the same email
            return { id: 'existing_user_id', email: 'sophia.taylor@gmail.com', username: 'sophia_github_pro' };
          },
        },
      },
    };

    const googleProfile = {
      email: 'sophia.taylor@gmail.com',
      id: 'google_sub_987654321',
      name: 'Sophia Taylor',
    };

    const username = await resolveUniqueUsername(googleProfile, mockDb);
    assert.strictEqual(username, 'sophia_github_pro', 'Existing user username must be preserved on account linking');
  });

  // TEST 10: Role assignment - Google profile mapper assigns developer role by default
  await runTest('TEST-10: Main auth instance configures Google provider with default developer role and trusted account linking', async () => {
    // Read lib/auth.ts source to verify static configuration contracts
    const authPath = path.resolve(__dirname, '../lib/auth.ts');
    const authCode = fs.readFileSync(authPath, 'utf-8');

    assert(authCode.includes("google: {"), "auth.ts must define google socialProvider");
    assert(authCode.includes("role: 'developer'"), "Google mapProfileToUser must set role: 'developer'");
    assert(authCode.includes("trustedProviders: ['github', 'google']"), "trustedProviders must include ['github', 'google']");
    assert(authCode.includes("GOOGLE_CLIENT_ID"), "Must use GOOGLE_CLIENT_ID");
    assert(authCode.includes("GOOGLE_CLIENT_SECRET"), "Must use GOOGLE_CLIENT_SECRET");
  });

  // TEST 11: UI Login Page Verification
  await runTest('TEST-11: LoginPage provides both GitHub and Google OAuth actions with error handling', async () => {
    const loginPagePath = path.resolve(__dirname, '../app/(auth)/login/page.tsx');
    const content = fs.readFileSync(loginPagePath, 'utf-8');

    assert(content.includes('export default function LoginPage'), 'LoginPage component must be default exported');
    assert(content.includes('handleGithubLogin'), 'Must have handleGithubLogin');
    assert(content.includes('handleGoogleLogin'), 'Must have handleGoogleLogin');
    assert(content.includes("provider: 'github'"), "Must trigger authClient.signIn.social with provider: 'github'");
    assert(content.includes("provider: 'google'"), "Must trigger authClient.signIn.social with provider: 'google'");
    assert(content.includes('Continue with Google'), 'Must have "Continue with Google" label');
    assert(content.includes('Continue with GitHub'), 'Must have "Continue with GitHub" label');
    assert(content.includes('access_denied'), 'Must handle OAuth cancellation gracefully');
    assert(content.includes('<Suspense'), 'Must wrap search params in Suspense boundary');
  });

  // TEST 12: Middleware and Next Config image domain verification
  await runTest('TEST-12: CSP and Next.js remotePatterns permit Google user avatars and auth', async () => {
    const middlewarePath = path.resolve(__dirname, '../middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
    assert(middlewareContent.includes('*.googleusercontent.com'), 'CSP img-src must permit *.googleusercontent.com');
    assert(middlewareContent.includes('accounts.google.com'), 'CSP connect-src must permit accounts.google.com');

    const nextConfigPath = path.resolve(__dirname, '../next.config.ts');
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
    assert(nextConfigContent.includes('*.googleusercontent.com'), 'next.config.ts remotePatterns must permit *.googleusercontent.com');
  });

  console.log('\n=====================================================================');
  console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('=====================================================================\n');
}

runGoogleAuthTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
