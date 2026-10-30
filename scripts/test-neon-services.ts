import { db } from '../lib/drizzle';
import { sql } from 'drizzle-orm';
import { NeonStorageService } from '../services/neon/storage';
import { NeonAuthService } from '../services/neon/auth';
import { NeonFunctionsService } from '../services/neon/functions';
import { NeonRealtimeService } from '../services/neon/realtime';
import { neonConfig } from '../services/neon/config';

async function runNeonServicesVerification() {
  console.log('====================================================');
  console.log('  🌐 NEON ECOSYSTEM END-TO-END VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 5;

  // 1. Test Neon Postgres Database
  console.log('--- 1. Testing Neon Postgres Database ---');
  try {
    const res = await db.execute(sql`SELECT current_database() as db_name, current_user as db_user, version() as pg_version;`);
    const dbInfo = res[0] as any;
    console.log(`  ✅ PASS: Connected to Neon Postgres!`);
    console.log(`     - Database: ${dbInfo.db_name}`);
    console.log(`     - User: ${dbInfo.db_user}`);
    console.log(`     - Version: ${dbInfo.pg_version.slice(0, 35)}...`);

    // Verify seeded users count
    const usersCount = await db.execute(sql`SELECT count(*)::int as count FROM users;`);
    console.log(`     - Seeded users in DB: ${(usersCount[0] as any)?.count}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: Postgres check failed: ${err.message}`);
  }

  // 2. Test Neon Object Storage (S3)
  console.log('\n--- 2. Testing Neon Object Storage ---');
  try {
    const health = await NeonStorageService.checkHealth();
    console.log(`  ✅ PASS: Neon Object Storage reachable!`);
    console.log(`     - Endpoint: ${neonConfig.storage.endpointUrl}`);
    console.log(`     - Bucket: ${health.bucket}`);
    console.log(`     - Status: ${health.message}`);

    // Test uploading small verification marker
    const testFileName = `test-verify-${Date.now()}.txt`;
    const uploadRes = await NeonStorageService.uploadAsset(
      { userId: '00000000-0000-0000-0000-000000000001', tenantId: 'default' },
      {
        category: 'attachments',
        fileName: testFileName,
        body: 'SkillVerse Neon Storage verification marker',
        contentType: 'text/plain',
      }
    );
    console.log(`     - Upload verified: ${uploadRes.key}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: Storage check failed: ${err.message}`);
  }

  // 3. Test Neon Serverless Functions
  console.log('\n--- 3. Testing Neon Serverless Functions ---');
  try {
    const fnRes = await NeonFunctionsService.invokeHello();
    if (fnRes.ok) {
      console.log(`  ✅ PASS: Neon Function invoked successfully!`);
      console.log(`     - URL: ${fnRes.url}`);
      console.log(`     - HTTP Status: ${fnRes.status}`);
      console.log(`     - Output: "${fnRes.text.trim()}"`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: Function responded with status ${fnRes.status}: ${fnRes.text}`);
    }
  } catch (err: any) {
    console.error(`  ❌ FAIL: Functions check failed: ${err.message}`);
  }

  // 4. Test Neon Auth (Better Auth / JWKS)
  console.log('\n--- 4. Testing Neon Auth ---');
  try {
    const authRes = await NeonAuthService.checkHealth();
    if (authRes.ok) {
      console.log(`  ✅ PASS: Neon Auth JWKS verified!`);
      console.log(`     - JWKS URL: ${authRes.jwksUrl}`);
      console.log(`     - Result: ${authRes.message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: Auth JWKS returned: ${authRes.message}`);
    }
  } catch (err: any) {
    console.error(`  ❌ FAIL: Auth check failed: ${err.message}`);
  }

  // 5. Test Neon Realtime
  console.log('\n--- 5. Testing Neon Realtime ---');
  try {
    const rtRes = NeonRealtimeService.checkHealth();
    if (rtRes.ok) {
      console.log(`  ✅ PASS: Neon Realtime configuration active!`);
      console.log(`     - Endpoint: ${rtRes.url}`);
      console.log(`     - Secret Key: Present (${rtRes.hasSecret})`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: Realtime not fully configured`);
    }
  } catch (err: any) {
    console.error(`  ❌ FAIL: Realtime check failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`  🎉 SUMMARY: ${passed}/${total} NEON SERVICES OPERATIONAL!`);
  console.log('====================================================\n');

  process.exitCode = passed === total ? 0 : 1;
}

runNeonServicesVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
