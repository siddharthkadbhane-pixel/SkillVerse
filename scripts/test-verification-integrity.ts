import { VerificationIntegrityEngine } from '../services/verification/integrity';
import { DCCEvidenceService } from '../services/dcc/evidence';
import { DeveloperCapabilityCardService } from '../services/dcc/service';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runVerificationIntegrityTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 29: VERIFICATION CONFIDENCE & INTEGRITY TEST SUITE');
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
  const EMPTY_USER_ID = '00000000-0000-0000-0000-999999999999';

  try {
    // TEST 1: Evidence Freshness Lifecycle Calculation
    console.log('\n--- 1. Testing Evidence Freshness Lifecycle ---');
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    const twoHundredDaysAgo = new Date(now.getTime() - 200 * 24 * 3600 * 1000);
    const fourHundredDaysAgo = new Date(now.getTime() - 400 * 24 * 3600 * 1000);

    const freshCurrent = VerificationIntegrityEngine.evaluateEvidenceFreshness(ninetyDaysAgo);
    assert(freshCurrent === 'current', `90 days old evidence evaluated as 'current' (${freshCurrent})`);

    const freshAging = VerificationIntegrityEngine.evaluateEvidenceFreshness(twoHundredDaysAgo);
    assert(freshAging === 'aging', `200 days old evidence evaluated as 'aging' (${freshAging})`);

    const freshStale = VerificationIntegrityEngine.evaluateEvidenceFreshness(fourHundredDaysAgo);
    assert(freshStale === 'stale', `400 days old evidence evaluated as 'stale' (${freshStale})`);

    // TEST 2: Deterministic Evidence Weighting
    console.log('\n--- 2. Testing Deterministic Evidence Weighting ---');
    const strongWeight = VerificationIntegrityEngine.calculateEvidenceWeight('ast_audit', 88, true);
    assert(strongWeight === 'strong', `Analyzed AST audit with 88 score has 'strong' weight`);

    const moderateWeight = VerificationIntegrityEngine.calculateEvidenceWeight('git_commit', 70, false);
    assert(moderateWeight === 'moderate', `Commit telemetry with 70 score has 'moderate' weight`);

    const weakWeight = VerificationIntegrityEngine.calculateEvidenceWeight('package_manifest', 50, false);
    assert(weakWeight === 'weak', `Package manifest detection alone has 'weak' weight`);

    // TEST 3: Malformed AI Review Structural Integrity Guard
    console.log('\n--- 3. Testing Malformed AI Review Guard ---');
    const malformed1 = VerificationIntegrityEngine.validateAiReviewIntegrity(null);
    assert(!malformed1.isValid, 'Null review payload rejected');

    const malformed2 = VerificationIntegrityEngine.validateAiReviewIntegrity({ overallScore: -10 });
    assert(!malformed2.isValid, 'Negative overall score rejected');

    const malformed3 = VerificationIntegrityEngine.validateAiReviewIntegrity({ overallScore: 90 }); // missing structured fields
    assert(!malformed3.isValid, 'Incomplete review missing strengths/architecture rejected from strong verification');

    const validReview = VerificationIntegrityEngine.validateAiReviewIntegrity({
      overallScore: 88,
      strengths: ['Strict TypeScript interfaces and clean code.'],
      architecture: 'Clean Serverless Next.js 15 App Router architecture.',
    });
    assert(validReview.isValid && validReview.normalizedScore === 88, 'Structured valid review accepted');

    // TEST 4: Conservative Skill Verification (Anti-Inflation Principle)
    console.log('\n--- 4. Testing Conservative Skill Verification ---');
    // Scenario A: Package manifest only (1 evidence, no analyzed repo, weak weight)
    const detectedEval = VerificationIntegrityEngine.evaluateSkillVerification({
      skillName: 'Docker',
      analyzedCount: 0,
      evidenceCount: 1,
      avgScore: 50,
      isPrimary: false,
      hasStrongEvidence: false,
      latestEvidenceDate: new Date(),
    });
    assert(detectedEval.status === 'detected', `Manifest-only skill remains 'detected' (Status: ${detectedEval.status})`);
    assert(detectedEval.weight === 'weak', `Manifest-only skill has 'weak' weight`);

    // Scenario B: Audited codebase with strong score (1 analyzed repo, AST score 92, strong weight)
    const verifiedEval = VerificationIntegrityEngine.evaluateSkillVerification({
      skillName: 'TypeScript',
      analyzedCount: 2,
      evidenceCount: 4,
      avgScore: 92,
      isPrimary: true,
      hasStrongEvidence: true,
      latestEvidenceDate: new Date(),
    });
    assert(verifiedEval.status === 'verified', `AST audited codebase achieves 'verified' (Status: ${verifiedEval.status})`);
    assert(verifiedEval.weight === 'strong', `Verified skill has 'strong' weight`);
    assert(verifiedEval.reason.includes('audited'), `Reason is explainable: "${verifiedEval.reason}"`);

    // Scenario C: Stale evidence (> 365 days ago)
    const staleEval = VerificationIntegrityEngine.evaluateSkillVerification({
      skillName: 'Java',
      analyzedCount: 1,
      evidenceCount: 2,
      avgScore: 80,
      isPrimary: false,
      hasStrongEvidence: true,
      latestEvidenceDate: fourHundredDaysAgo,
    });
    assert(staleEval.status === 'stale', `Historical evidence without recent commits marked as 'stale' (Status: ${staleEval.status})`);

    // TEST 5: Verification Integrity Summary
    console.log('\n--- 5. Testing Verification Integrity Summary ---');
    const integritySummary = await VerificationIntegrityEngine.getVerificationIntegritySummary(TEST_USER_ID);
    assert(!!integritySummary, 'Integrity summary generated');
    assert(integritySummary.totalEvidenceCount >= 1, `Total evidence count: ${integritySummary.totalEvidenceCount}`);
    assert(integritySummary.integrityScore >= 70, `Integrity confidence score: ${integritySummary.integrityScore}/100`);
    assert(typeof integritySummary.freshnessDistribution.current === 'number', `Current freshness count: ${integritySummary.freshnessDistribution.current}`);

    // TEST 6: Re-analysis Deduplication & Milestone Logging
    console.log('\n--- 6. Testing Re-analysis Deduplication ---');
    const reanalysis = await VerificationIntegrityEngine.reanalyzeRepositoryEvidence(
      TEST_USER_ID,
      'repo_test_1',
      { qualityScore: 94, skillsDetected: ['TypeScript', 'Next.js'] }
    );
    assert(reanalysis.updatedCount === 2, `Re-analysis updated 2 skill proofs without duplicate creation`);
    assert(typeof reanalysis.transitionLogged === 'boolean', `State transition check: ${reanalysis.transitionLogged}`);

    // TEST 7: DCC Integration & Public Sanitization
    console.log('\n--- 7. Testing DCC Integrity Payload & Public Sanitization ---');
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(TEST_USER_ID);
    assert(!!fullDCC.integritySummary, 'DCC includes integritySummary');

    const publicDCC = await DeveloperCapabilityCardService.getPublicDCC('siddharthkadbhane-pixel');
    assert(!publicDCC.isPrivate && !!publicDCC.data?.integritySummary, 'Public DCC includes sanitized integritySummary');
    if (publicDCC.data?.integritySummary) {
      assert(
        publicDCC.data.integritySummary.integrityScore > 0,
        `Public integrity confidence: ${publicDCC.data.integritySummary.integrityScore}/100`
      );
    }

    // TEST 8: Scoring Safety & Trust Score Stability
    console.log('\n--- 8. Testing Scoring Safety & Compatibility ---');
    const trust = await TrustCalculatorService.calculateUserTrustScore(TEST_USER_ID);
    assert(trust.overallScore > 0 && trust.overallScore <= 1000, `Trust Score remains balanced and compatible: ${trust.overallScore}/1000`);

  } catch (err: any) {
    console.error('❌ Exception in test suite:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationIntegrityTests().catch(console.error);
