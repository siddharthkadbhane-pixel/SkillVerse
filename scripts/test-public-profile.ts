import { DeveloperCapabilityCardService } from '../services/dcc/service';

async function runPublicProfileTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 25: PUBLIC PROFILE & DCC TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Canonical Public Developer Resolution
    console.log('\n--- 1. Testing Canonical Public Developer Resolution ---');
    const result = await DeveloperCapabilityCardService.getPublicDCC('siddharthkadbhane-pixel');
    assert(result.notFound === false, 'Public developer found');
    assert(result.isPrivate === false, 'Public developer is not private');
    assert(!!result.data, 'Public DCC data payload exists');
    if (result.data) {
      assert(result.data.username === 'siddharthkadbhane-pixel', `Username matches: ${result.data.username}`);
      assert(typeof result.data.overallScore === 'number', `Overall score is numeric: ${result.data.overallScore}`);
      assert(!!result.data.level, `Capability tier assigned: ${result.data.level}`);
    }

    // TEST 2: Case-Insensitive Username Resolution
    console.log('\n--- 2. Testing Case-Insensitive Username Resolution ---');
    const caseResult = await DeveloperCapabilityCardService.getPublicDCC('SiddharthKadbhane-Pixel');
    assert(caseResult.notFound === false, 'Case-insensitive lookup succeeded');
    assert(!!caseResult.data, 'Public data returned for mixed-case username');

    // TEST 3: Non-Existent User Handling
    console.log('\n--- 3. Testing Non-Existent User Handling ---');
    const nonExistentResult = await DeveloperCapabilityCardService.getPublicDCC('user-does-not-exist-9999');
    assert(nonExistentResult.notFound === true, 'Non-existent user correctly returned notFound: true');
    assert(nonExistentResult.data === null, 'Data is null for non-existent user');

    // TEST 4: Zero Private Token or Code Leakage
    console.log('\n--- 4. Testing Zero Private Token / Code Leakage ---');
    if (result.data) {
      const serialized = JSON.stringify(result.data);
      assert(!serialized.includes('githubToken'), 'GitHub token is not present in public data');
      assert(!serialized.includes('rawAiOutput'), 'Raw AI output prompts not exposed in public payload');
      assert(!serialized.includes('ghp_'), 'No GitHub personal access tokens in public JSON');
    }

    // TEST 5: Verified Skills & Evidence Chains in Public Profile
    console.log('\n--- 5. Testing Verified Skills & Evidence in Public Profile ---');
    if (result.data) {
      assert(Array.isArray(result.data.verifiedSkills), `Verified skills array returned (${result.data.verifiedSkills.length} skills)`);
      assert(result.data.verifiedSkills.some(s => s.status === 'verified'), 'Contains verified skills');
      assert(result.data.verifiedSkills.some(s => !!s.whyVerified), 'Contains whyVerified justifications');
    }

    // TEST 6: Project Evidence in Public Profile
    console.log('\n--- 6. Testing Project Evidence in Public Profile ---');
    if (result.data) {
      assert(Array.isArray(result.data.projectEvidence), `Project evidence array returned (${result.data.projectEvidence.length} projects)`);
      assert(result.data.projectEvidence.every(p => !p.htmlUrl.includes('token=')), 'No secret tokens in project URLs');
    }

    // TEST 7: Public Timeline Sanitization
    console.log('\n--- 7. Testing Public Capability History Timeline ---');
    if (result.data) {
      assert(Array.isArray(result.data.timeline), 'Public growth timeline returned array');
    }

  } catch (err: any) {
    console.error('❌ Test execution encountered error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runPublicProfileTests().then(() => process.exit(0)).catch(() => process.exit(1));
