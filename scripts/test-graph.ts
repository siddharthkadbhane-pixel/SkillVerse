import { db, syncDatabaseSchema } from '../lib/drizzle';
import { DeveloperGraphService } from '../services/graph/service';
import { RecommendationEngineService } from '../services/recommendation/service';
import { ReputationService } from '../services/reputation/service';
import { sql } from 'drizzle-orm';

async function testGraph() {
  console.log('🚀 Starting SkillVerse Developer Graph verification test runner...\n');

  let failed = false;

  const dummyUid = '00000000-0000-0000-0000-000000000000';
  const dummyRep = '00000000-0000-0000-0000-000000000001';

  // Test 1: Graph Synchronization
  try {
    console.log('🧪 Test 1: Simulating Graph Synchronization nodes & edges rebuild...');
    await DeveloperGraphService.syncDeveloperGraph(dummyUid);
    
    // Fetch nodes count
    const nodesCount = await db.execute(sql`SELECT count(*) as count FROM graph_nodes WHERE user_id = ${dummyUid}`);
    const count = Number(nodesCount[0]?.count || 0);

    if (count > 0) {
      console.log('✅ Test 1 Passed: Graph synced and developer node inserted.');
      console.log(`   - Graph nodes created: ${count}\n`);
    } else {
      throw new Error('Graph sync did not insert developer node');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed: Graph sync verification error.', err);
    failed = true;
  }

  // Test 2: Reputation Calculations
  try {
    console.log('🧪 Test 2: Executing Reputation scores weighting calculations...');
    const result = await ReputationService.calculateReputation(dummyUid);

    if (result && result.engineering >= 100 && result.openSource >= 100) {
      console.log('✅ Test 2 Passed: Reputation scores calculated successfully:');
      console.log(`   - Engineering score: ${result.engineering}`);
      console.log(`   - Open Source score: ${result.openSource}\n`);
    } else {
      throw new Error(`Reputation calculation returned out-of-bound values: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed: Reputation calculations failed.', err);
    failed = true;
  }

  // Test 3: Recommender Engine Matches
  try {
    console.log('🧪 Test 3: Compiling matched opportunities via Graph connections...');
    const list = await RecommendationEngineService.generateRecommendations(dummyUid);

    if (list && list.length > 0) {
      console.log('✅ Test 3 Passed: AI matched opportunities compiled:');
      console.log(`   - Matches count: ${list.length}`);
      console.log(`   - Top Match: ${list[0].title} (${list[0].score}%)\n`);
    } else {
      throw new Error('Recommender engine returned empty matches array');
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed: Recommendation matching failed.', err);
    failed = true;
  }

  if (failed) {
    console.log('❌ GRAPH TELEMETRY TESTS COMPLETED WITH FAILURES.');
    process.exit(1);
  } else {
    console.log('🎉 ALL GRAPH TELEMETRY TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

testGraph();
