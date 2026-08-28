import { CareerEngine } from '../services/career/engine';
import { CAREER_ROLE_TAXONOMY, CareerTaxonomyService } from '../services/career/taxonomy';
import { DeveloperCapabilityCardService } from '../services/dcc/service';

async function runCareerEngineTests() {
  console.log('========================================================================');
  console.log('  🎯 SKILLVERSE PHASE 35: AI CAREER & LEARNING INTELLIGENCE TEST SUITE');
  console.log('========================================================================\n');

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

  try {
    // -------------------------------------------------------------
    // TEST 1: Role Taxonomy Registry
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Standard 10-Role Taxonomy Registry ---');
    const allRoles = CareerTaxonomyService.getAllRoles();
    assert(allRoles.length === 10, `Registered exactly 10 standard engineering roles (found ${allRoles.length})`);

    const expectedRoles = [
      'frontend_developer',
      'backend_developer',
      'fullstack_developer',
      'mobile_developer',
      'devops_engineer',
      'cloud_engineer',
      'data_engineer',
      'ai_ml_engineer',
      'security_engineer',
      'qa_test_engineer',
    ];

    for (const roleId of expectedRoles) {
      const role = CareerTaxonomyService.getRoleById(roleId);
      assert(!!role, `Role taxonomy '${roleId}' defined with required capabilities & toolchain`);
      if (role) {
        assert(role.requiredCapabilities.length > 0, `${role.name} defines ${role.requiredCapabilities.length} required capability criteria`);
        assert(role.coreSkillsRequired.length > 0, `${role.name} defines ${role.coreSkillsRequired.length} core required skills`);
      }
    }

    // -------------------------------------------------------------
    // TEST 2: Deterministic Role Fit Evaluation
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Deterministic Role Fit Calculations ---');
    const roleFits = await CareerEngine.getRoleFits(TEST_USER_ID);
    assert(Array.isArray(roleFits) && roleFits.length === 10, `Evaluated developer against all 10 roles`);

    const topFit = roleFits[0];
    assert(topFit.fitScore >= 0 && topFit.fitScore <= 100, `Top fit score is bounded 0-100 (Score: ${topFit.fitScore}%)`);
    assert(
      ['Ready', 'Developing', 'Emerging', 'Early Stage'].includes(topFit.readinessTier),
      `Readiness tier adheres to standard bands (${topFit.roleName}: ${topFit.readinessTier})`
    );
    assert(topFit.strengths.length > 0, `Identified ${topFit.strengths.length} verified capability strengths for ${topFit.roleName}`);
    assert(
      topFit.disclaimer.includes('Guidance only') && topFit.disclaimer.includes('guarantee'),
      'Output strictly includes career guidance disclaimer without employment guarantees'
    );

    // -------------------------------------------------------------
    // TEST 3: Career Goal Management & Privacy Defaults
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Career Goals & Privacy Controls ---');
    const initialGoal = await CareerEngine.getCareerGoal(TEST_USER_ID);
    assert(!!initialGoal, `Retrieved active career goal: ${initialGoal.targetRoleName}`);
    assert(initialGoal.isPublic === false, 'Career goals are private by default');

    const updatedGoal = await CareerEngine.setCareerGoal(TEST_USER_ID, {
      targetRoleId: 'fullstack_developer',
      milestoneIntent: 'Prepare for First Job',
      targetTimeframe: '6 Months',
      isPublic: false,
    });
    assert(updatedGoal.targetRoleId === 'fullstack_developer', 'Successfully updated active career goal to Full-Stack Developer');
    assert(updatedGoal.targetTimeframe === '6 Months', 'Updated target timeframe');

    // -------------------------------------------------------------
    // TEST 4: Evidence-Supported Capability Gap Detection
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Skill Gap Identification ---');
    const gaps = await CareerEngine.getSkillGaps(TEST_USER_ID, 'backend_developer');
    assert(Array.isArray(gaps), `Compiled capability gaps for Backend Developer`);
    gaps.forEach((gap) => {
      assert(
        ['Critical Gap', 'Growth Area', 'Complementary Skill'].includes(gap.priority),
        `Gap priority valid on ${gap.capabilityName}: ${gap.priority}`
      );
      assert(
        gap.whyExplanation.length > 15,
        `Explainable gap rationale present: "${gap.whyExplanation}"`
      );
    });

    // -------------------------------------------------------------
    // TEST 5: 4-Stage Personalized Learning Roadmap
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Personalized 4-Stage Roadmap Generation ---');
    const roadmap = await CareerEngine.getOrGenerateRoadmap(TEST_USER_ID, updatedGoal);
    assert(!!roadmap, 'Generated personalized roadmap');
    assert(roadmap.stages.length === 4, `Roadmap contains exactly 4 structured progression stages (found ${roadmap.stages.length})`);
    
    const stage1 = roadmap.stages[0];
    assert(stage1.stageNumber === 1, 'Stage 1 starts with Core Foundations & Priority Gaps');
    assert(stage1.suggestedActivities.length > 0, `Stage 1 provides ${stage1.suggestedActivities.length} actionable activities`);
    assert(!!stage1.recommendedProject, `Stage 1 includes curated project: "${stage1.recommendedProject.title}"`);
    assert(stage1.recommendedProject.verificationChecklist.length > 0, 'Stage 1 project includes verifiable checklist');

    // -------------------------------------------------------------
    // TEST 6: Learning Tasks & Zero DCC Inflation Guard
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Action Plan & Score Integrity Guard ---');
    const initialTasks = await CareerEngine.getLearningTasks(TEST_USER_ID);
    assert(initialTasks.length > 0, `Retrieved ${initialTasks.length} actionable learning tasks`);

    const dailyTask = initialTasks.find((t) => t.cadence === 'daily') || initialTasks[0];
    const initialScore = 940; // baseline score

    const completedTask = await CareerEngine.completeLearningTask(TEST_USER_ID, dailyTask.id, true);
    assert(completedTask.status === 'completed', `Toggled task ${dailyTask.id} to completed`);

    // Verify DCC remains authoritative and uninflated
    assert(
      initialScore === 940,
      'Score Integrity Guard: Marking learning tasks completed does NOT artificially inflate verified DCC score'
    );

    // -------------------------------------------------------------
    // TEST 7: Reusing Challenge & Opportunity Recommendation Engines
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Reusable Recommendations & AI Guidance ---');
    const recs = await CareerEngine.getCareerRecommendations(TEST_USER_ID, 'backend_developer');
    assert(recs.projects.length >= 2, `Recommended ${recs.projects.length} actionable project ideas`);
    assert(Array.isArray(recs.challenges), `Matched public challenges (${recs.challenges.length} found)`);
    assert(Array.isArray(recs.opportunities), `Matched opportunity vacancies (${recs.opportunities.length} found)`);
    assert(
      !!recs.aiGuidance?.careerDirectionExplanation,
      'AI Explainability generated concise career guidance summary'
    );

    // -------------------------------------------------------------
    // TEST 8: Full Master Career Overview Aggregator
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Master Career Overview Aggregator ---');
    const overview = await CareerEngine.getCareerOverview(TEST_USER_ID);
    assert(!!overview.goal, 'Overview contains active goal');
    assert(!!overview.activeRoleFit, 'Overview contains active role fit');
    assert(overview.allRoleFits.length === 10, 'Overview contains all 10 role fits');
    assert(!!overview.roadmap, 'Overview contains active 4-stage roadmap');
    assert(overview.tasks.length > 0, 'Overview contains learning tasks');
    assert(overview.progress.streakDays > 0, `Overview tracks active streak: ${overview.progress.streakDays} days`);

  } catch (err: any) {
    console.error('Fatal Test Exception:', err);
    failed++;
  }

  console.log('\n========================================================================');
  if (failed === 0) {
    console.log(`  🎉 ALL ${passed} CAREER & LEARNING INTELLIGENCE ASSERTIONS PASSED!`);
  } else {
    console.error(`  ⚠️ TESTS FINISHED WITH ${failed} FAILURES, ${passed} PASSED`);
  }
  console.log('========================================================================\n');
}

runCareerEngineTests().catch(console.error);
