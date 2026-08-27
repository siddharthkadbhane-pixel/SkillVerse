import { db, syncDatabaseSchema } from '../lib/drizzle';
import { SandboxedExecutionService } from '../services/containers/service';
import { WorkspaceBuildService } from '../services/build/service';
import { sql } from 'drizzle-orm';

async function testCloud() {
  console.log('🚀 Starting SkillVerse Developer Cloud verification test runner...\n');

  let failed = false;

  const dummyWsId = '00000000-0000-0000-0000-000000000002';

  // Seed dummy workspace first to satisfy foreign keys
  try {
    await syncDatabaseSchema();
    const [seeded] = await db.execute(sql`
      INSERT INTO workspaces (id, name, user_id)
      VALUES (${dummyWsId}, 'Dummy Workspace', '00000000-0000-0000-0000-000000000000')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);
  } catch {}

  // Test 1: Isolated Code Runner Sandbox
  try {
    console.log('🧪 Test 1: Running isolated JS code snippet...');
    const result = await SandboxedExecutionService.runScript(dummyWsId, 'javascript', 'console.log("Isolated execution test.");');

    if (result && result.exitCode === 0 && result.stdout.includes('Isolated execution test')) {
      console.log('✅ Test 1 Passed: JavaScript VM sandbox returned stdout correctly.\n');
    } else {
      throw new Error(`VM execution failed: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed: Code runner failed.', err);
    failed = true;
  }

  // Test 2: Dangerous Code Blocking Policy
  try {
    console.log('🧪 Test 2: Triggering safety check with dangerous keywords...');
    const result = await SandboxedExecutionService.runScript(dummyWsId, 'javascript', 'process.exit(1);');

    if (result && result.exitCode === 1 && result.stderr.includes('Security policy violation')) {
      console.log('✅ Test 2 Passed: Dangerous process keywords blocked successfully.\n');
    } else {
      throw new Error('Sandbox did not block dangerous process keywords');
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed: Safety check failure.', err);
    failed = true;
  }

  // Test 3: Build & Test Artifact Pipeline
  try {
    console.log('🧪 Test 3: Triggering compilation build & test suites...');
    const buildRes = await WorkspaceBuildService.triggerBuild(dummyWsId);
    const testRes = await WorkspaceBuildService.runTests(dummyWsId);

    if (
      buildRes && buildRes.status === 'completed' &&
      testRes && testRes.status === 'completed' && testRes.testsPassed > 0
    ) {
      console.log('✅ Test 3 Passed: Compilation pipeline completed with artifacts:');
      console.log(`   - Build artifact: ${buildRes.artifact.fileName}`);
      console.log(`   - Test artifact: ${testRes.report.fileName} (${testRes.testsPassed} tests passed)\n`);
    } else {
      throw new Error('Build or testing pipeline execution failed');
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed: Pipeline execution error.', err);
    failed = true;
  }

  if (failed) {
    console.log('❌ CLOUD EXECUTION TESTS COMPLETED WITH FAILURES.');
    process.exit(1);
  } else {
    console.log('🎉 ALL CLOUD EXECUTION TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

testCloud();
