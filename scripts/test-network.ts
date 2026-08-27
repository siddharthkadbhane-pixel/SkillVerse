import { db, syncDatabaseSchema } from '../lib/drizzle';
import { GlobalVerificationService } from '../services/verification/service';
import { sql } from 'drizzle-orm';

async function testNetwork() {
  console.log('🚀 Starting SkillVerse Verification Network verification test runner...\n');

  let failed = false;

  const dummyUid = '00000000-0000-0000-0000-000000000000';
  const dummyPartnerId = '00000000-0000-0000-0000-000000000003';

  // Seed dummy partner first to satisfy foreign keys
  try {
    await syncDatabaseSchema();
    await db.execute(sql`
      INSERT INTO organizations (id, name, type)
      VALUES (${dummyPartnerId}, 'MIT Labs Test Partner', 'partner')
      ON CONFLICT DO NOTHING;
    `);
  } catch {}

  // Test 1: Verification Access Request Creation
  let requestId = '';
  try {
    console.log('🧪 Test 1: Creating partner verification access request...');
    const result = await GlobalVerificationService.requestAccess(dummyUid, dummyPartnerId, ['skills', 'trust']);

    if (result && result.status === 'pending') {
      requestId = result.id;
      console.log('✅ Test 1 Passed: Consent request created in pending state.\n');
    } else {
      throw new Error(`Failed to create request: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed: Access request error.', err);
    failed = true;
  }

  // Test 2: Access Consent Approval & Lookup
  try {
    console.log('🧪 Test 2: Approving consent and fetching verified details...');
    await GlobalVerificationService.approveAccess(requestId);
    
    const details = await GlobalVerificationService.verifyDeveloper(dummyPartnerId, dummyUid);

    if (details && details.verified === true && details.trustScore >= 0) {
      console.log('✅ Test 2 Passed: Partner successfully fetched verified data:');
      console.log(`   - Verified badge: ${details.verificationBadge}`);
      console.log(`   - Developer name: ${details.developer.name}\n`);
    } else {
      throw new Error('Approved request was not retrievable');
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed: Consent lookup failed.', err);
    failed = true;
  }

  if (failed) {
    console.log('❌ VERIFICATION NETWORK TESTS COMPLETED WITH FAILURES.');
    process.exit(1);
  } else {
    console.log('🎉 ALL VERIFICATION NETWORK TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

testNetwork();
