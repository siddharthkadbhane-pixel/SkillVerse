import { DeveloperCapabilityCardService } from '../services/dcc/service';
import { CapabilityGrowthService } from '../services/dcc/growth';
import { DCCEvidenceService } from '../services/dcc/evidence';

async function runTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 23: CAPABILITY GROWTH TEST SUITE');
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
    // TEST 1: Full DCC Data Payload Structure
    console.log('\n--- 1. Testing Full DCC Data Structure with Growth Timeline ---');
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(TEST_USER_ID);
    assert(!!fullDCC, 'Full DCC data returned successfully');
    assert(typeof fullDCC.card.overallScore === 'number', `Overall score is numeric (${fullDCC.card.overallScore})`);
    assert(Array.isArray(fullDCC.verifiedSkills), `Verified skills list is array (${fullDCC.verifiedSkills.length} skills)`);
    assert(Array.isArray(fullDCC.timeline), `Growth timeline is array (${fullDCC.timeline.length} events)`);
    assert(Array.isArray(fullDCC.growthChart), `Growth chart data points is array (${fullDCC.growthChart.length} points)`);

    // TEST 2: Growth Event Recording & Deduplication
    console.log('\n--- 2. Testing Growth Event Recording & Deduplication ---');
    const event1 = await CapabilityGrowthService.recordGrowthEvent({
      userId: TEST_USER_ID,
      overallScore: 850,
      level: 'Expert',
      changeType: 'skill_verified',
      title: 'Docker skill verified in hyperion-cache',
      description: 'Container build and multi-stage workflow verified.',
      skillName: 'Docker',
      evidenceRepo: 'siddharthkadbhane-pixel/hyperion-cache',
      isPublic: true,
    });
    assert(event1 !== undefined, 'Growth event successfully processed');

    // Immediate duplicate attempt (should be suppressed by deduplication engine)
    const duplicateEvent = await CapabilityGrowthService.recordGrowthEvent({
      userId: TEST_USER_ID,
      overallScore: 850,
      level: 'Expert',
      changeType: 'skill_verified',
      title: 'Docker skill verified in hyperion-cache',
      description: 'Container build and multi-stage workflow verified.',
      skillName: 'Docker',
      evidenceRepo: 'siddharthkadbhane-pixel/hyperion-cache',
      isPublic: true,
    });
    assert(duplicateEvent === null, 'Identical duplicate growth event was successfully suppressed');

    // TEST 3: Skill Progression History Generator
    console.log('\n--- 3. Testing Skill Progression History Generator ---');
    const tsHistory = await CapabilityGrowthService.getSkillProgressionHistory(TEST_USER_ID, 'TypeScript');
    assert(!!tsHistory && Array.isArray(tsHistory.stages), `Skill progression history returned stages array (${tsHistory.stages.length} stages)`);
    if (tsHistory.stages.length > 0) {
      assert(!!tsHistory.stages[0].stage, `Progression stage named: ${tsHistory.stages[0].stage}`);
      assert(typeof tsHistory.stages[0].level === 'number', `Proficiency level is valid number (${tsHistory.stages[0].level})`);
    }

    // TEST 4: Verified Skills with Embedded History
    console.log('\n--- 4. Testing Verified Skills with Embedded Progression Chains ---');
    const compiledSkills = await DCCEvidenceService.compileVerifiedSkills(TEST_USER_ID);
    assert(compiledSkills.length > 0, `Compiled ${compiledSkills.length} verified skills`);
    const tsSkill = compiledSkills.find(s => s.name === 'TypeScript' || s.name === 'React');
    assert(!!tsSkill, 'Found primary technical skill (TypeScript/React)');
    if (tsSkill?.history) {
      assert(tsSkill.history.length > 0, `Skill ${tsSkill.name} has ${tsSkill.history.length} verified history stages`);
    }

    // TEST 5: Growth Timeline Content & Formatting
    console.log('\n--- 5. Testing Growth Timeline Content & Formatting ---');
    const timeline = await CapabilityGrowthService.getGrowthTimeline(TEST_USER_ID, false, 10);
    assert(Array.isArray(timeline), 'Timeline returned array');
    if (timeline.length > 0) {
      const first = timeline[0];
      assert(typeof first.title === 'string' && first.title.length > 0, `Event title present: "${first.title}"`);
      assert(typeof first.date === 'string', `Event date formatted: "${first.date}"`);
      assert(!!first.badgeVariant, `Badge variant defined: "${first.badgeVariant}"`);
    }

    // TEST 6: Capability Trend Chart Aggregator
    console.log('\n--- 6. Testing Capability Trend Chart Aggregator ---');
    const chartPoints = await CapabilityGrowthService.getCapabilityTrendChartData(TEST_USER_ID);
    assert(Array.isArray(chartPoints), `Chart data points returned (${chartPoints.length} points)`);
    if (chartPoints.length > 0) {
      assert(typeof chartPoints[0].score === 'number', `Score metric present (${chartPoints[0].score})`);
      assert(typeof chartPoints[0].verifiedSkills === 'number', `Verified skills count present (${chartPoints[0].verifiedSkills})`);
    }

    // TEST 7: Dashboard Growth Summary
    console.log('\n--- 7. Testing Dashboard Growth Summary ---');
    const dashboardSummary = await CapabilityGrowthService.getDashboardGrowthSummary(TEST_USER_ID);
    assert(!!dashboardSummary, 'Dashboard growth summary returned');
    assert(typeof dashboardSummary.verifiedSkillsCount === 'number', `Verified skills count: ${dashboardSummary.verifiedSkillsCount}`);
    assert(typeof dashboardSummary.growthTrajectory === 'string', `Growth trajectory rating: ${dashboardSummary.growthTrajectory}`);

    // TEST 8: Empty User State (Graceful empty handling, no fake data)
    console.log('\n--- 8. Testing Empty User State (No Repositories / Clean State) ---');
    const emptyTimeline = await CapabilityGrowthService.getGrowthTimeline(EMPTY_USER_ID);
    assert(Array.isArray(emptyTimeline), 'Empty user timeline is an array');

    // TEST 9: Recalculate DCC & Growth Integration
    console.log('\n--- 9. Testing Recalculate DCC & Growth Integration ---');
    const recalcResult = await DeveloperCapabilityCardService.recalculateDCC(TEST_USER_ID);
    assert(!!recalcResult, 'DCC recalculated successfully');
    assert(typeof recalcResult.overallScore === 'number', `Recalculated overall score: ${recalcResult.overallScore}`);

  } catch (err: any) {
    console.error('❌ Test execution encountered unhandled error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().then(() => process.exit(0)).catch(() => process.exit(1));
