import { db, syncDatabaseSchema } from '../lib/drizzle';
import { AgentRegistry } from '../services/agents/registry';
import { SharedMemoryService } from '../services/memory/service';
import { AgentOrchestratorService } from '../services/orchestrator/service';
import { sql } from 'drizzle-orm';

async function testAgents() {
  console.log('🚀 Starting SkillVerse Agent Ecosystem verification test runner...\n');

  let failed = false;

  // Test 1: Agent Registry Prompt Loading & Fallbacks
  try {
    console.log('🧪 Test 1: Verifying Agent Registry prompts & heuristics fallbacks...');
    const sysPrompt = AgentRegistry.getAgentSystemPrompt('security');
    const mockContext = {
      readme: '# Sample project',
      packageJson: { dependencies: { 'react': '^19.0.0' } },
      topSourceFiles: [{ path: 'readme.md' }],
    };
    const heuristic = AgentRegistry.getHeuristicFallback('repo-intelligence', mockContext);

    if (sysPrompt.includes('Security Agent') && heuristic.score > 0) {
      console.log('✅ Test 1 Passed: System prompts and heuristics compiled:');
      console.log(`   - Prompt contains key references.`);
      console.log(`   - Fallback Score: ${heuristic.score} (${heuristic.reasoning})\n`);
    } else {
      throw new Error('Registry prompt loading or fallback value failed');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed: Registry verification error.', err);
    failed = true;
  }

  // Test 2: Shared Memory System Set & Get
  try {
    console.log('🧪 Test 2: Verifying Shared Memory context storage...');
    const userId = '00000000-0000-0000-0000-000000000000'; // dummy uuid
    const repoId = '00000000-0000-0000-0000-000000000001';
    
    await SharedMemoryService.setMemory(userId, repoId, 'test_memory_key', { data: 'test_memory_val' });
    const val = await SharedMemoryService.getMemory<any>(userId, repoId, 'test_memory_key');

    if (val && val.data === 'test_memory_val') {
      console.log('✅ Test 2 Passed: Shared memory set & get operations match:');
      console.log(`   - Retained memory: ${JSON.stringify(val)}\n`);
    } else {
      throw new Error(`Memory mismatch. Got: ${JSON.stringify(val)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed: Shared Memory check failed.', err);
    failed = true;
  }

  if (failed) {
    console.log('❌ AGENT TELEMETRY TESTS COMPLETED WITH FAILURES.');
    process.exit(1);
  } else {
    console.log('🎉 ALL AGENT ECOSYSTEM TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

testAgents();
