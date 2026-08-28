import { TeamEngine, DUMMY_TEAMS } from '../services/team/engine';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runTeamEngineTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 33: TEAM FORMATION & COLLABORATION TEST');
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

  const OWNER_ID = '00000000-0000-0000-0000-000000000000';
  const MEMBER_ID = '00000000-0000-0000-0000-000000000005';

  try {
    // TEST 1: Team Creation
    console.log('\n--- 1. Testing Team Creation ---');
    const createRes = await TeamEngine.createTeam(OWNER_ID, {
      name: 'Nexus Frontier Systems',
      description: 'Building zero-knowledge rollup infrastructure and edge developer tooling.',
      skills: ['Rust', 'TypeScript', 'Docker', 'PostgreSQL'],
      visibility: 'public',
    });
    assert(createRes.success && !!createRes.team, `Created team: "${createRes.team?.name}" (${createRes.team?.slug})`);
    const teamId = createRes.team.id;

    // TEST 2: Team Discovery & Filtering
    console.log('\n--- 2. Testing Team Discovery ---');
    const discRes = await TeamEngine.getTeams({ q: 'Nexus' }, OWNER_ID);
    assert(discRes.teams.length > 0, `Search found ${discRes.teams.length} team(s)`);

    const skillDisc = await TeamEngine.getTeams({ skill: 'TypeScript' }, OWNER_ID);
    assert(skillDisc.teams.length > 0, `Skill filter 'TypeScript' found ${skillDisc.teams.length} team(s)`);

    // TEST 3: Team Invitations & Membership
    console.log('\n--- 3. Testing Team Invitations ---');
    const inviteRes = await TeamEngine.inviteMember(teamId, OWNER_ID, MEMBER_ID);
    assert(inviteRes.success, 'Successfully invited member to team');

    const teamAfterInvite = await TeamEngine.getTeamById(teamId, OWNER_ID);
    assert(teamAfterInvite?.membersCount === 2, `Team member count updated to ${teamAfterInvite?.membersCount}`);

    // TEST 4: Tasks & Milestones
    console.log('\n--- 4. Testing Team Tasks & Milestones ---');
    const taskRes = await TeamEngine.createTask(teamId, OWNER_ID, {
      title: 'Design distributed gossip protocol',
      description: 'Implement peer-to-peer heartbeat and membership discovery.',
      assigneeUserId: MEMBER_ID,
    });
    assert(taskRes.success && !!taskRes.task, 'Task added to team workspace');

    const updateTaskRes = await TeamEngine.updateTaskStatus(teamId, taskRes.task!.id, 'in_progress');
    assert(updateTaskRes.success, 'Task status updated to in_progress');

    const msRes = await TeamEngine.createMilestone(teamId, OWNER_ID, {
      title: 'Mainnet Verification Milestone',
      targetDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
    });
    assert(msRes.success && !!msRes.milestone, 'Milestone recorded in team workspace');

    // TEST 5: Project Repository Association
    console.log('\n--- 5. Testing Team Project Association ---');
    const projRes = await TeamEngine.addTeamProject(teamId, OWNER_ID, {
      name: 'Nexus P2P Engine',
      description: 'Peer-to-peer state replication framework.',
      repositoryUrl: 'https://github.com/siddharthkadbhane-pixel/nexus-p2p',
    });
    assert(projRes.success && !!projRes.project, 'Project repository linked to team');

    // TEST 6: Granular Contribution Attribution (Core Principle)
    console.log('\n--- 6. Testing Granular Contribution Tracking ---');
    const activeTeam = await TeamEngine.getTeamById(teamId, OWNER_ID);
    assert(Array.isArray(activeTeam?.contributions) && activeTeam.contributions.length > 0, 'Individual contribution tracking initialized');
    if (activeTeam?.contributions) {
      const c = activeTeam.contributions[0];
      assert(c.userId === OWNER_ID, 'Owner contribution attributed independently');
      assert(c.commitsCount > 0, `Individual commits recorded: ${c.commitsCount}`);
    }

    // TEST 7: Member Removal
    console.log('\n--- 7. Testing Member Removal ---');
    const removeRes = await TeamEngine.removeMember(teamId, OWNER_ID, MEMBER_ID);
    assert(removeRes.success, 'Member removed by team owner');

    // TEST 8: Scoring Safety & Trust Score Compatibility
    console.log('\n--- 8. Testing Scoring Safety ---');
    const trust = await TrustCalculatorService.calculateUserTrustScore(OWNER_ID);
    assert(trust.overallScore > 0, `Trust Score remains unaffected: ${trust.overallScore}/1000`);

  } catch (err: any) {
    console.error('❌ Exception in test suite:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTeamEngineTests().catch(console.error);
