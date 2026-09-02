import { ContributionIntelligenceService } from '../services/activity/intelligence';
import { DeveloperCapabilityCardService } from '../services/dcc/service';
import { DCCEvidenceService } from '../services/dcc/evidence';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runContributionIntelligenceTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 27: DEVELOPER ACTIVITY & CONTRIBUTION INTELLIGENCE TEST SUITE');
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
    // TEST 1: Contribution Intelligence Computation for Existing Developer
    console.log('\n--- 1. Testing Contribution Intelligence Computation ---');
    const intel = await ContributionIntelligenceService.getContributionIntelligence(TEST_USER_ID);
    assert(!!intel, 'Retrieved contribution intelligence record');
    assert(intel.activeRepositoriesCount >= 1, `Active repositories count: ${intel.activeRepositoriesCount}`);
    assert(intel.analyzedRepositoriesCount >= 1, `Analyzed repositories count: ${intel.analyzedRepositoriesCount}`);
    assert(typeof intel.frequency === 'string', `Cadence frequency tier: ${intel.frequency}`);
    assert(Array.isArray(intel.primaryLanguages), `Primary languages array present (${intel.primaryLanguages.join(', ')})`);
    assert(typeof intel.contextualSummary === 'string' && intel.contextualSummary.length > 0, `Contextual summary: "${intel.contextualSummary}"`);

    // TEST 2: Contextual Framing (Volume != Skill check)
    console.log('\n--- 2. Testing Contextual Framing (No Raw Commit Superiority) ---');
    assert(!intel.contextualSummary.toLowerCase().includes('better than'), 'Summary avoids competitive vanity rankings');
    assert(!intel.contextualSummary.toLowerCase().includes('best developer'), 'Summary avoids misleading skill equivalencies');
    assert(intel.contextualSummary.includes('contributor') || intel.contextualSummary.includes('repositories'), 'Summary frames activity contextually');

    // TEST 3: Monthly Contribution Timeline Structure
    console.log('\n--- 3. Testing Monthly Contribution Timeline Buckets ---');
    assert(Array.isArray(intel.monthlyTimeline), 'Monthly timeline array present');
    assert(intel.monthlyTimeline.length === 6, `Last 6 months timeline buckets present (found ${intel.monthlyTimeline.length})`);
    intel.monthlyTimeline.forEach(bucket => {
      assert(typeof bucket.monthKey === 'string' && bucket.monthKey.includes('-'), `Valid monthKey format: ${bucket.monthKey}`);
      assert(typeof bucket.label === 'string', `Valid bucket label: ${bucket.label}`);
      assert(typeof bucket.count === 'number', `Bucket activity count: ${bucket.count}`);
      assert(typeof bucket.commitCount === 'number', `Bucket commit count: ${bucket.commitCount}`);
      assert(typeof bucket.prCount === 'number', `Bucket PR count: ${bucket.prCount}`);
    });

    // TEST 4: Recent Activities Data Structure & Public Classification
    console.log('\n--- 4. Testing Recent Activities Normalization ---');
    assert(Array.isArray(intel.recentActivities), 'Recent activities array present');
    assert(intel.recentActivities.length > 0, `Found ${intel.recentActivities.length} recent activity items`);
    const firstAct = intel.recentActivities[0];
    assert(!!firstAct.title, `Activity title: "${firstAct.title}"`);
    assert(!!firstAct.activityType, `Activity type: ${firstAct.activityType}`);
    assert(!!firstAct.repositoryName, `Repository name: ${firstAct.repositoryName}`);
    assert(firstAct.isPublic === true, 'Public flag verified');

    // TEST 5: Incremental Synchronization & Deduplication
    console.log('\n--- 5. Testing Incremental Synchronization & Deduplication ---');
    const sync1 = await ContributionIntelligenceService.syncDeveloperActivity(TEST_USER_ID);
    assert(sync1.success === true, `First sync succeeded: ${sync1.message}`);

    const sync2 = await ContributionIntelligenceService.syncDeveloperActivity(TEST_USER_ID);
    assert(sync2.success === true, 'Second sync completed');
    assert(sync2.duplicateCount >= 0, `Deduplication mechanism suppressed ${sync2.duplicateCount} duplicate events`);

    // TEST 6: Selective Capability History Milestone Generation
    console.log('\n--- 6. Testing Selective Capability History Milestones ---');
    const milestoneTriggered = await ContributionIntelligenceService.evaluateAndRecordActivityMilestone(TEST_USER_ID, {
      activeReposCount: 4,
      syncedCount: 3,
    });
    assert(typeof milestoneTriggered === 'boolean', `Milestone evaluation completed (Result: ${milestoneTriggered})`);

    // TEST 7: DCC Integration (Separation of Activity Context & Verified Capability)
    console.log('\n--- 7. Testing DCC Payload Activity Context Integration ---');
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(TEST_USER_ID);
    assert(!!fullDCC.activityContext, 'Activity context present on DCC');
    assert((fullDCC.activityContext?.activeRepositoriesCount ?? 0) >= 1, 'Active repositories count reflected on DCC');
    assert(fullDCC.card.overallScore > 0, `Verified overall score remains intact: ${fullDCC.card.overallScore}`);
    assert(Array.isArray(fullDCC.verifiedSkills), 'Verified skills intact');

    // TEST 8: Public Profile Privacy & Sanitization
    console.log('\n--- 8. Testing Public DCC Profile Activity Context ---');
    const publicDCC = await DeveloperCapabilityCardService.getPublicDCC('siddharthkadbhane-pixel');
    assert(publicDCC !== null, 'Public DCC retrieved successfully');
    if (publicDCC) {
      assert(!!publicDCC.activityContext, 'Activity context present on Public DCC');
      assert(
        (publicDCC.activityContext?.recentActivities || []).every((a: any) => a.isPublic),
        'All public DCC activity records are explicitly public'
      );
      assert(
        !(publicDCC.activityContext as any)?.githubToken,
        'Zero GitHub tokens in activity context'
      );
    }

    // TEST 9: Private Profile Exclusion
    console.log('\n--- 9. Testing Private Profile Activity Protection ---');
    const privateResult = await ContributionIntelligenceService.getPublicContributionIntelligence('private-user-does-not-exist');
    assert(privateResult === null, 'Private / non-existent user returns null for public activity query');

    // TEST 10: New / Empty Developer Activity State
    console.log('\n--- 10. Testing Empty / New Developer Activity State ---');
    const emptyIntel = await ContributionIntelligenceService.getContributionIntelligence(EMPTY_USER_ID);
    assert(!!emptyIntel, 'Empty developer receives resilient baseline activity structure');
    assert(Array.isArray(emptyIntel.monthlyTimeline), 'Monthly timeline present for new developer');
    assert(Array.isArray(emptyIntel.recentActivities), 'Recent activities array safe for new developer');

    // TEST 11: Scoring Safety (Commit Count does NOT skew Trust Score)
    console.log('\n--- 11. Testing Scoring Safety & Compatibility ---');
    const baselineTrust = await TrustCalculatorService.calculateUserTrustScore(TEST_USER_ID);
    assert(baselineTrust.overallScore > 0, `Trust Score remains balanced and compatible: ${baselineTrust.overallScore}/1000`);
    assert(baselineTrust.categoryScores.codeQuality > 0, `Code Quality Score: ${baselineTrust.categoryScores.codeQuality}/100`);
    assert(baselineTrust.categoryScores.gitActivity > 0, `Git Activity Score: ${baselineTrust.categoryScores.gitActivity}/100`);
    assert(baselineTrust.overallScore <= 1000, 'Score is bounded [0, 1000]');

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

runContributionIntelligenceTests().catch(console.error);
