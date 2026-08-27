import { DCCEvidenceService } from '../services/dcc/evidence';
import { DeveloperCapabilityCardService } from '../services/dcc/service';

async function runEvidenceEngineTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 24: EVIDENCE & VERIFICATION TEST SUITE');
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

  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const EMPTY_USER_ID = '99999999-9999-9999-9999-999999999999';

  try {
    // TEST 1: Evidence Strength Calculation
    console.log('\n--- 1. Testing Evidence Strength Tier Calculation ---');
    const strongTier = DCCEvidenceService.calculateEvidenceStrength(2, 3, 85, true);
    assert(strongTier === 'strong', `Strong tier verified (calculated: ${strongTier})`);

    const moderateTier = DCCEvidenceService.calculateEvidenceStrength(1, 1, 75, false);
    assert(moderateTier === 'moderate', `Moderate tier verified (calculated: ${moderateTier})`);

    const weakTier = DCCEvidenceService.calculateEvidenceStrength(0, 1, 50, false);
    assert(weakTier === 'weak', `Weak tier verified (calculated: ${weakTier})`);

    // TEST 2: Verification State Logic
    console.log('\n--- 2. Testing Verification State Determination ---');
    const verifiedStatus = DCCEvidenceService.determineVerificationStatus(2, 2, 'strong', true);
    assert(verifiedStatus === 'verified', `Status correctly identified as 'verified'`);

    const supportedStatus = DCCEvidenceService.determineVerificationStatus(0, 2, 'moderate', false);
    assert(supportedStatus === 'supported', `Status correctly identified as 'supported'`);

    const detectedStatus = DCCEvidenceService.determineVerificationStatus(0, 1, 'weak', false);
    assert(detectedStatus === 'detected', `Status correctly identified as 'detected'`);

    const insufficientStatus = DCCEvidenceService.determineVerificationStatus(0, 0, 'weak', false);
    assert(insufficientStatus === 'insufficient_evidence', `Status correctly identified as 'insufficient_evidence'`);

    // TEST 3: Explainability Narrative Generation
    console.log('\n--- 3. Testing "Why Verified?" Explainability Generator ---');
    const whyVerified = DCCEvidenceService.generateWhyVerifiedExplanation('React', 'verified', 'strong', 2, 3, 91, false);
    assert(typeof whyVerified === 'string' && whyVerified.includes('audited repositories'), `Verified explanation generated: "${whyVerified}"`);

    const whySupported = DCCEvidenceService.generateWhyVerifiedExplanation('Docker', 'supported', 'moderate', 0, 2, 70, false);
    assert(typeof whySupported === 'string' && whySupported.includes('Supported by implementation evidence'), `Supported explanation generated: "${whySupported}"`);

    const whyDetected = DCCEvidenceService.generateWhyVerifiedExplanation('Vitest', 'detected', 'weak', 0, 1, 0, false);
    assert(typeof whyDetected === 'string' && whyDetected.includes('Detected in package manifests'), `Detected explanation generated: "${whyDetected}"`);

    // TEST 4: Contribution Role Identification
    console.log('\n--- 4. Testing Repository Contribution Role Identification ---');
    const ownerRole = DCCEvidenceService.determineContributionRole({ fullName: 'siddharthkadbhane-pixel/SkillVerse', fork: false }, 'siddharthkadbhane-pixel');
    assert(ownerRole === 'owner', `Repository owner identified: ${ownerRole}`);

    const forkRole = DCCEvidenceService.determineContributionRole({ fullName: 'siddharthkadbhane-pixel/linux', fork: true }, 'siddharthkadbhane-pixel');
    assert(forkRole === 'fork', `Forked repository identified: ${forkRole}`);

    const contributorRole = DCCEvidenceService.determineContributionRole({ fullName: 'facebook/react', fork: false }, 'siddharthkadbhane-pixel');
    assert(contributorRole === 'contributor' || contributorRole === 'owner', `Contribution role identified: ${contributorRole}`);

    // TEST 5: Verified Skills Evidence Chains Compilation
    console.log('\n--- 5. Testing Verified Skills Compilation with Evidence Chains ---');
    const compiledSkills = await DCCEvidenceService.compileVerifiedSkills(TEST_USER_ID);
    assert(Array.isArray(compiledSkills) && compiledSkills.length > 0, `Compiled ${compiledSkills.length} skills`);
    
    const tsSkill = compiledSkills.find(s => s.name === 'TypeScript');
    assert(!!tsSkill, 'Found TypeScript skill record');
    if (tsSkill) {
      assert(!!tsSkill.evidenceStrength, `Evidence strength present: ${tsSkill.evidenceStrength}`);
      assert(typeof tsSkill.whyVerified === 'string' && tsSkill.whyVerified.length > 0, `Why verified reason present: "${tsSkill.whyVerified}"`);
      assert(Array.isArray(tsSkill.evidenceList), `Evidence list present (${tsSkill.evidenceList.length} items)`);
      if (tsSkill.evidenceList.length > 0) {
        assert(!!tsSkill.evidenceList[0].verificationMethod, `Verification method: "${tsSkill.evidenceList[0].verificationMethod}"`);
      }
    }

    // TEST 6: Single Skill Verification Detail API Method
    console.log('\n--- 6. Testing Single Skill Verification Detail ---');
    const tsDetail = await DCCEvidenceService.getSkillVerificationDetail(TEST_USER_ID, 'TypeScript', false);
    assert(!!tsDetail, 'Retrieved TypeScript verification detail');
    if (tsDetail) {
      assert(tsDetail.skillName === 'TypeScript', `Skill name matches: ${tsDetail.skillName}`);
      assert(typeof tsDetail.confidence === 'number', `Confidence score: ${tsDetail.confidence}%`);
      assert(Array.isArray(tsDetail.strengthsBreakdown), 'Strengths breakdown present');
    }

    // TEST 7: Privacy Sanitization for Public Requests
    console.log('\n--- 7. Testing Privacy Sanitization for Public Views ---');
    const publicDetail = await DCCEvidenceService.getSkillVerificationDetail(TEST_USER_ID, 'TypeScript', true);
    assert(!!publicDetail, 'Public skill detail returned');

    // TEST 8: Engineering Metrics Evidence Compilation
    console.log('\n--- 8. Testing Engineering Metrics Evidence Compilation ---');
    const engMetrics = await DCCEvidenceService.compileEngineeringMetrics(TEST_USER_ID, {
      codeQuality: 88,
      architecture: 90,
      security: 85,
      performance: 82,
      testing: 78,
      documentation: 80,
    });
    assert(Array.isArray(engMetrics) && engMetrics.length === 6, `Compiled 6 engineering metrics`);
    assert(engMetrics[0].evidenceRepos.length > 0, `Engineering metric contains ${engMetrics[0].evidenceRepos.length} evidence repos`);

    // TEST 9: Project Evidence Summary Compilation
    console.log('\n--- 9. Testing Project Evidence Summary Compilation ---');
    const projEvidence = await DCCEvidenceService.compileProjectEvidence(TEST_USER_ID);
    assert(Array.isArray(projEvidence) && projEvidence.length > 0, `Compiled ${projEvidence.length} project evidence summaries`);
    assert(!!projEvidence[0].contributionRole, `Project role defined: ${projEvidence[0].contributionRole}`);
    assert(!!projEvidence[0].verificationMethod, `Project verification method: ${projEvidence[0].verificationMethod}`);

    // TEST 10: Empty User State Handling
    console.log('\n--- 10. Testing Empty User State (Clean State / No Repositories) ---');
    const emptySkills = await DCCEvidenceService.compileVerifiedSkills(EMPTY_USER_ID);
    assert(Array.isArray(emptySkills), 'Empty user returns valid array');

    // TEST 11: Full DCC Service Integration
    console.log('\n--- 11. Testing Full DCC Service with Evidence Engine ---');
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(TEST_USER_ID);
    assert(!!fullDCC, 'Full DCC compiled successfully');
    assert(fullDCC.verifiedSkills.some(s => !!s.evidenceStrength), 'Verified skills include evidence strength');
    assert(fullDCC.verifiedSkills.some(s => !!s.whyVerified), 'Verified skills include whyVerified explanations');

  } catch (err: any) {
    console.error('❌ Test execution encountered error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runEvidenceEngineTests().then(() => process.exit(0)).catch(() => process.exit(1));
