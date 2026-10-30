/**
 * SkillVerse Phase 43D-R3.21 — Candidate API Error Handling & Empty Result Test Suite
 * 
 * Verifies:
 * 1. Successful query with candidate records -> returns HTTP 200 with candidates collection.
 * 2. Genuine empty query (0 developers in DB) -> returns HTTP 200 with data: [].
 * 3. Database query failure -> logs via Logger.error and returns HTTP 500 with safe, non-sensitive error message.
 * 4. Error non-leakage -> database internals, credentials, and SQL statements are never exposed in the response.
 * 5. Mock non-leakage -> synthetic/mock candidate fallback data is never returned.
 */

import { NextRequest } from 'next/server';
import { db } from '../lib/drizzle';
import { Logger } from '../lib/logger';
import { GET } from '../app/api/candidates/route';

let passed = 0;
let total = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`   ✅ PASS: ${testName}`);
  } else {
    const msg = `❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`;
    failures.push(msg);
    console.error(`   ${msg}`);
  }
}

async function runCandidateApiTests() {
  console.log('\n================================================================');
  console.log('  🛡️ SKILLVERSE PHASE 43D-R3.21 — CANDIDATE API ERROR HANDLING TESTS');
  console.log('================================================================\n');

  // Preserve original methods
  const origFindMany = db.query.users.findMany;
  const origTrustFindFirst = db.query.trustScores.findFirst;
  const origSkillFindFirst = db.query.skillDna.findFirst;
  const origLoggerError = Logger.error;

  try {
    // -------------------------------------------------------------------------
    // Test 1: Successful Query with Developer Records
    // -------------------------------------------------------------------------
    console.log('▶ [1/4] Testing successful query returning candidate records...');
    {
      const mockDevelopers = [
        {
          id: 'dev-1',
          name: 'Alice Developer',
          username: 'alicedev',
          avatarUrl: 'https://example.com/alice.png',
          bio: 'Distributed systems engineer',
          location: 'San Francisco, CA',
          role: 'developer',
        },
        {
          id: 'dev-2',
          name: 'Bob Coder',
          username: 'bobcoder',
          avatarUrl: 'https://example.com/bob.png',
          bio: 'Frontend React architect',
          location: 'New York, NY',
          role: 'developer',
        },
      ];

      (db.query.users as any).findMany = async () => mockDevelopers;
      (db.query.trustScores as any).findFirst = async ({ where }: any) => {
        return { overallScore: 820 };
      };
      (db.query.skillDna as any).findFirst = async ({ where }: any) => {
        return {
          dnaStructure: {
            skills: [
              { name: 'TypeScript', level: 90 },
              { name: 'PostgreSQL', level: 85 },
            ],
          },
        };
      };

      const req = new NextRequest('http://localhost:3000/api/candidates', { method: 'GET' });
      const res = await GET(req);
      const body = await res.json();

      assert(res.status === 200, 'Returns HTTP 200 on successful candidate query', `Status: ${res.status}`);
      assert(body.success === true, 'Response body indicates success: true');
      assert(Array.isArray(body.data) && body.data.length === 2, 'Returns exactly 2 candidate items', `Count: ${body.data?.length}`);
      assert(body.data[0].id === 'dev-1' && body.data[0].name === 'Alice Developer', 'Candidate fields correctly mapped');
      assert(body.data[0].trustScore === 820, 'Trust score properly resolved');
      assert(body.data[0].skills.length === 2, 'Skill DNA structure properly formatted');
    }

    // -------------------------------------------------------------------------
    // Test 2: Genuine Empty Result (0 developers in database)
    // -------------------------------------------------------------------------
    console.log('\n▶ [2/4] Testing genuine empty result (0 developers found in database)...');
    {
      (db.query.users as any).findMany = async () => [];

      const req = new NextRequest('http://localhost:3000/api/candidates', { method: 'GET' });
      const res = await GET(req);
      const body = await res.json();

      assert(res.status === 200, 'Returns HTTP 200 on genuine empty query', `Status: ${res.status}`);
      assert(body.success === true, 'Response body indicates success: true');
      assert(Array.isArray(body.data) && body.data.length === 0, 'Returns empty array []', `Length: ${body.data?.length}`);
      assert(JSON.stringify(body).indexOf('candidate_1') === -1, 'Mock candidate ID candidate_1 is absent');
      assert(JSON.stringify(body).indexOf('Sidharth Kadbhane') === -1, 'Mock candidate name is absent');
    }

    // -------------------------------------------------------------------------
    // Test 3: Database Failure (Connection Timeout / Query Exception)
    // -------------------------------------------------------------------------
    console.log('\n▶ [3/4] Testing database query failure (connection timeout / SQL error)...');
    {
      const loggerState = { called: false, error: null as any };
      Logger.error = ((msg: string, err: any) => {
        loggerState.called = true;
        loggerState.error = err;
      }) as any;

      const sensitiveDbErrorMessage = 'Connection terminated unexpectedly: postgresql://neondb_owner:SECRET_PASS@neon.tech:5432/db [FATAL: 57P01] SELECT * FROM users';
      (db.query.users as any).findMany = async () => {
        throw new Error(sensitiveDbErrorMessage);
      };

      const req = new NextRequest('http://localhost:3000/api/candidates', { method: 'GET' });
      const res = await GET(req);
      const body = await res.json();

      assert(res.status === 500, 'Returns HTTP 500 on database failure', `Status: ${res.status}`);
      assert(body.success === false, 'Response body indicates success: false');
      assert(body.error === 'Failed to fetch candidates', 'Returns stable, non-sensitive error message');
      assert(loggerState.called === true, 'Logger.error was called with the error details');
      assert(loggerState.error?.message === sensitiveDbErrorMessage, 'Logger received the original exception for audit logging');
    }

    // -------------------------------------------------------------------------
    // Test 4: Information Disclosure & Mock Non-Leakage Assertion
    // -------------------------------------------------------------------------
    console.log('\n▶ [4/4] Testing error confidentiality & mock non-leakage...');
    {
      const rawSqlError = 'syntax error at or near "WHERE" at character 42 in table users_private_vault';
      (db.query.users as any).findMany = async () => {
        throw new Error(rawSqlError);
      };

      const req = new NextRequest('http://localhost:3000/api/candidates', { method: 'GET' });
      const res = await GET(req);
      const body = await res.json();
      const stringifiedBody = JSON.stringify(body);

      assert(res.status === 500, 'HTTP 500 returned on database syntax error');
      assert(!stringifiedBody.includes('users_private_vault'), 'Table name not leaked to client');
      assert(!stringifiedBody.includes('syntax error'), 'Raw syntax error not leaked to client');
      assert(!stringifiedBody.includes('SECRET_PASS'), 'Passwords never present in client body');
      assert(!stringifiedBody.includes('candidate_1'), 'Mock fallback candidate is never returned');
      assert(!stringifiedBody.includes('Sidharth Kadbhane'), 'Mock developer name is never returned');
    }

  } finally {
    // Restore original methods
    (db.query.users as any).findMany = origFindMany;
    (db.query.trustScores as any).findFirst = origTrustFindFirst;
    (db.query.skillDna as any).findFirst = origSkillFindFirst;
    Logger.error = origLoggerError;
  }

  console.log('\n================================================================');
  console.log(`  SUMMARY: ${passed}/${total} tests passed (${failures.length} failures)`);
  console.log('================================================================\n');

  if (failures.length > 0) {
    process.exit(1);
  }
}

runCandidateApiTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
