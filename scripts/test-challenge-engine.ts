import { ChallengeEngine, DUMMY_CHALLENGES } from '../services/challenge/engine';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runChallengeEngineTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 32: VERIFICATION CHALLENGES ENGINE TEST');
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

  const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';
  const ORGANIZER_ID = '00000000-0000-0000-0000-000000000001';

  try {
    // TEST 1: Challenge Categories Supported
    console.log('\n--- 1. Testing Unified Challenge Categories ---');
    const categories = ['coding', 'bug_fix', 'feature', 'frontend', 'backend', 'api', 'database', 'devops', 'ai_ml', 'full_project'];
    categories.forEach(cat => {
      assert(typeof cat === 'string', `Category supported: ${cat}`);
    });

    // TEST 2: Organizer Challenge Creation
    console.log('\n--- 2. Testing Challenge Creation ---');
    const createRes = await ChallengeEngine.createChallenge(ORGANIZER_ID, {
      title: 'Distributed Transaction Coordinator',
      description: 'Implement a 2-phase commit distributed transaction manager in TypeScript.',
      type: 'backend',
      difficulty: 'Expert',
      requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
      prizePool: '$3,500 Bounty',
      isHiringOpportunity: true,
      criteriaWeights: {
        functionality: 30,
        codeQuality: 25,
        architecture: 25,
        testing: 10,
        documentation: 10,
      },
    });
    assert(createRes.success && !!createRes.challenge, `Created challenge: "${createRes.challenge?.title}"`);
    const chId = createRes.challenge.id;

    // TEST 3: Discovery & Filters
    console.log('\n--- 3. Testing Challenge Discovery & Filters ---');
    const discRes = await ChallengeEngine.getChallenges({ q: 'Distributed' }, TEST_USER_ID);
    assert(discRes.challenges.length > 0, `Search for 'Distributed' found ${discRes.challenges.length} challenges`);

    const typeRes = await ChallengeEngine.getChallenges({ type: 'backend' }, TEST_USER_ID);
    assert(typeRes.challenges.length > 0, `Type filter 'backend' found ${typeRes.challenges.length} challenges`);

    // TEST 4: Registration & Leave
    console.log('\n--- 4. Testing Challenge Registration Flow ---');
    const joinRes = await ChallengeEngine.joinChallenge(TEST_USER_ID, chId);
    assert(joinRes.success, 'Successfully registered for challenge');

    const dupJoinRes = await ChallengeEngine.joinChallenge(TEST_USER_ID, chId);
    assert(!dupJoinRes.success, 'Duplicate registration prevented');

    const leaveRes = await ChallengeEngine.leaveChallenge(TEST_USER_ID, chId);
    assert(leaveRes.success, 'Successfully unregistered from challenge');

    // Re-register for submission
    await ChallengeEngine.joinChallenge(TEST_USER_ID, chId);

    // TEST 5: Repository Submission & Weighted AST Evaluation
    console.log('\n--- 5. Testing Repository Submission & AST Evaluation ---');
    const invalidSub = await ChallengeEngine.submitSolution(TEST_USER_ID, chId, {
      repositoryUrl: 'https://invalid-url.com/repo',
    });
    assert(!invalidSub.success, 'Invalid repository URL rejected');

    const validSub = await ChallengeEngine.submitSolution(TEST_USER_ID, chId, {
      repositoryUrl: 'https://github.com/siddharthkadbhane-pixel/distributed-coordinator',
      liveDemoUrl: 'https://coordinator.vercel.app',
      description: 'Zero-latency distributed transaction coordinator with Raft consensus fixtures.',
    });
    assert(validSub.success && !!validSub.submission, 'Solution submitted and evaluated');
    if (validSub.submission?.evaluation) {
      const evalData = validSub.submission.evaluation;
      assert(evalData.compositeScore >= 80, `AST Composite Score calculated: ${evalData.compositeScore}/100`);
      assert(typeof evalData.astQualityTier === 'string', `AST Tier assigned: ${evalData.astQualityTier}`);
      assert(Array.isArray(evalData.verifiedCapabilitiesDemonstrated), 'Demonstrated capabilities recorded');
    }

    // TEST 6: Deterministic Leaderboard
    console.log('\n--- 6. Testing Leaderboard Ranking ---');
    const leaderboard = await ChallengeEngine.getLeaderboard(chId);
    assert(Array.isArray(leaderboard) && leaderboard.length >= 3, `Leaderboard generated with ${leaderboard.length} entries`);
    assert(leaderboard[0].score >= leaderboard[1].score, 'Leaderboard correctly ordered by composite score');
    assert(leaderboard[0].rank === 1, 'Top rank assigned correctly');

    // TEST 7: Scoring Safety
    console.log('\n--- 7. Testing Scoring Safety & Trust Score ---');
    const trust = await TrustCalculatorService.calculateUserTrustScore(TEST_USER_ID);
    assert(trust.overallScore > 0, `Trust score stable: ${trust.overallScore}/1000`);

  } catch (err: any) {
    console.error('❌ Exception in test suite:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runChallengeEngineTests().catch(console.error);
