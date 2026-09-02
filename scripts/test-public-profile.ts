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
    assert(result !== null, 'Public developer found');
    if (result) {
      assert(result.username === 'siddharthkadbhane-pixel', `Username matches: ${result.username}`);
      assert(typeof result.overallScore === 'number', `Overall score is numeric: ${result.overallScore}`);
      assert(!!result.level, `Capability tier assigned: ${result.level}`);
    }

    // TEST 2: Case-Insensitive Username Resolution
    console.log('\n--- 2. Testing Case-Insensitive Username Resolution ---');
    const caseResult = await DeveloperCapabilityCardService.getPublicDCC('SiddharthKadbhane-Pixel');
    assert(caseResult !== null, 'Case-insensitive lookup succeeded');

    // TEST 3: Non-Existent User Handling
    console.log('\n--- 3. Testing Non-Existent User Handling ---');
    const nonExistentResult = await DeveloperCapabilityCardService.getPublicDCC('user-does-not-exist-9999');
    assert(nonExistentResult === null, 'Non-existent user correctly returned null');

    // TEST 4: Zero Private Token or Code Leakage
    console.log('\n--- 4. Testing Zero Private Token / Code Leakage ---');
    if (result) {
      const serialized = JSON.stringify(result);
      assert(!serialized.includes('githubToken'), 'GitHub token is not present in public data');
      assert(!serialized.includes('rawAiOutput'), 'Raw AI output prompts not exposed in public payload');
      assert(!serialized.includes('ghp_'), 'No GitHub personal access tokens in public JSON');
    }

    // TEST 5: Verified Skills & Evidence Chains in Public Profile
    console.log('\n--- 5. Testing Verified Skills & Evidence in Public Profile ---');
    if (result) {
      assert(Array.isArray(result.verifiedSkills), `Verified skills array returned (${result.verifiedSkills.length} skills)`);
      assert(result.verifiedSkills.some((s: any) => s.status === 'verified'), 'Contains verified skills');
      assert(result.verifiedSkills.some((s: any) => !!s.whyVerified), 'Contains whyVerified justifications');
    }

    // TEST 6: Project Evidence in Public Profile
    console.log('\n--- 6. Testing Project Evidence in Public Profile ---');
    if (result) {
      assert(Array.isArray(result.projectEvidence), `Project evidence array returned (${result.projectEvidence.length} projects)`);
      assert(result.projectEvidence.every((p: any) => !p.htmlUrl.includes('token=')), 'No secret tokens in project URLs');
    }

    // TEST 7: Public Timeline Sanitization
    console.log('\n--- 7. Testing Public Capability History Timeline ---');
    if (result) {
      assert(Array.isArray(result.timeline), 'Public growth timeline returned array');
    }

  } catch (err: any) {
    console.error('❌ Test execution encountered error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPublicProfileTests().catch(console.error);
