/**
 * SKILLVERSE PHASE 47: AI AUDIT & REVIEW REMEDIATION TEST SUITE
 * 
 * Tests the complete AI code audit and review workflow end-to-end:
 * 1. Audit initiation and payload validation
 * 2. Authentication & Anti-IDOR ownership checks
 * 3. GitHub credential availability & Google OAuth fallback
 * 4. Execution lifecycle & state transitions (idle -> running -> completed)
 * 5. Result persistence (reviews, skills, history)
 * 6. Duplicate requests and idempotency
 * 7. Failure handling and error transitions
 * 8. Review retrieval, scoring & repository filtering
 */

import assert from 'node:assert';
import { db } from '../lib/drizzle';
import { users, repositories, reviews, userSkills, skills, reviewHistory } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { POST as analyzePost } from '../app/api/analyze/route';
import { GET as getRepositories } from '../app/api/repositories/route';
import { GET as getRepoReview, POST as triggerRepoReview } from '../app/api/repositories/[id]/review/route';
import { GET as getRepoStatus } from '../app/api/repositories/[id]/status/route';
import { NextRequest } from 'next/server';

const TEST_USER_A_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_B_ID = '00000000-0000-0000-0000-000000000002';

async function runTestSuite() {
  console.log('======================================================');
  console.log('🧪 SKILLVERSE PHASE 47: AI AUDIT & REVIEW TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  };

  // Setup test repositories in database
  const TEST_GITHUB_REPO_ID = 1296269;
  const TEST_REPO_FULL_NAME = 'octocat/Hello-World';
  const TEST_REPO_NAME = 'Hello-World';
  
  await db.delete(repositories).where(eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID));

  console.log('📌 GROUP 1: Authentication & Anti-IDOR Ownership Checks');

  await test('Reject unauthenticated audit initiation with HTTP 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepoId: TEST_GITHUB_REPO_ID,
        fullName: TEST_REPO_FULL_NAME,
        name: 'test-audit-repo',
      }),
    });

    const res = await analyzePost(req);
    assert.strictEqual(res.status, 401, 'Must reject unauthenticated request with 401');
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  await test('Reject invalid payload with HTTP 400', async () => {
    // Inject mock user into global session for test
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // missing githubRepoId and name
        fullName: 'invalid',
      }),
    });

    const res = await analyzePost(req);
    assert.strictEqual(res.status, 400, 'Must reject invalid payload with 400');
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  await test('Enforce repository ownership: user cannot audit another user\'s repository', async () => {
    const { _setMockUser } = await import('./mock-session-helper');

    // Insert repo belonging to User B
    const [inserted] = await db.insert(repositories).values({
      userId: TEST_USER_B_ID,
      githubRepoId: TEST_GITHUB_REPO_ID,
      name: 'test-audit-repo',
      fullName: TEST_REPO_FULL_NAME,
      htmlUrl: `https://github.com/${TEST_REPO_FULL_NAME}`,
      reviewStatus: 'idle',
    }).returning();

    // User A attempts to audit User B's repo
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepoId: TEST_GITHUB_REPO_ID,
        fullName: TEST_REPO_FULL_NAME,
        name: 'test-audit-repo',
      }),
    });

    const res = await analyzePost(req);
    assert.strictEqual(res.status, 403, 'Must reject unauthorized cross-user audit with 403');
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert(json.error.includes('permission'), 'Error message must cite lack of permission');

    // Clean up
    await db.delete(repositories).where(eq(repositories.id, inserted.id));
  });

  console.log('\n📌 GROUP 2: GitHub Credential Availability & Google OAuth Fallback');

  await test('Audit proceeds for Google OAuth user without throwing missing token 400', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    // Ensure test user has no githubToken in DB to simulate Google OAuth user
    await db.update(users).set({ githubToken: null }).where(eq(users.id, TEST_USER_A_ID));

    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepoId: TEST_GITHUB_REPO_ID,
        fullName: TEST_REPO_FULL_NAME,
        name: TEST_REPO_NAME,
        language: 'TypeScript',
      }),
    });

    const res = await analyzePost(req);
    // Should NOT be 400 "GitHub credentials not found."
    assert.notStrictEqual(res.status, 400, 'Must not reject with 400 when user lacks GitHub token');
    const json = await res.json();
    assert.strictEqual(json.success, true, 'Audit initiation should succeed');
    assert.strictEqual(json.data.reviewStatus, 'running');
  });

  console.log('\n📌 GROUP 3: Idempotency & Duplicate Request Protection');

  await test('Prevent duplicate concurrent execution when review is actively running', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    // Second request while status is 'running'
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepoId: TEST_GITHUB_REPO_ID,
        fullName: TEST_REPO_FULL_NAME,
        name: TEST_REPO_NAME,
      }),
    });

    const res = await analyzePost(req);
    assert.strictEqual(res.status, 200, 'Must return 200 without creating duplicate jobs');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert(json.message.includes('already in progress'), 'Message must indicate review is already running');
    assert.strictEqual(json.data.reviewStatus, 'running');
  });

  console.log('\n📌 GROUP 4: Execution Lifecycle, State Transitions & Persistence');

  await test('Synchronous execution lifecycle transitions properly and persists review', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    // Reset status to idle for fresh run
    await db.update(repositories).set({ reviewStatus: 'idle' }).where(eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID));

    const req = new NextRequest('http://localhost:3000/api/analyze?sync=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepoId: TEST_GITHUB_REPO_ID,
        fullName: TEST_REPO_FULL_NAME,
        name: TEST_REPO_NAME,
        language: 'TypeScript',
      }),
    });

    const res = await analyzePost(req);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.reviewStatus, 'completed');

    // Verify database persistence
    const savedRepo = await db.query.repositories.findFirst({
      where: eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID),
    });
    assert(savedRepo !== undefined, 'Repository record must exist');
    assert.strictEqual(savedRepo.reviewStatus, 'completed', 'Repository status must be completed');
    assert.strictEqual(savedRepo.isAnalyzed, true, 'isAnalyzed must be true');
    assert(savedRepo.analyzedAt !== null, 'analyzedAt timestamp must be set');
    assert(savedRepo.summary !== null, 'Architecture summary must be persisted');

    // Verify reviews table record
    const savedReview = await db.execute(sql`SELECT * FROM reviews WHERE repository_id = ${savedRepo.id}`);
    assert((savedReview as any[]).length > 0, 'Review record must be persisted in reviews table');
    const revRow = (savedReview as any[])[0];
    assert(revRow.summary.length > 0, 'Review summary must be populated');
    assert(revRow.overall_score > 0, 'Overall score must be positive integer');
    assert(Array.isArray(revRow.strengths), 'Strengths must be an array');
    assert(Array.isArray(revRow.weaknesses), 'Weaknesses must be an array');
  });

  console.log('\n📌 GROUP 5: Review Retrieval & Repository Filtering');

  await test('GET /api/repositories returns persisted repository with review score for Google users', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    const req = new NextRequest('http://localhost:3000/api/repositories');
    const res = await getRepositories(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert(Array.isArray(json.data), 'Data must be array');
    assert(json.data.length > 0, 'Must return user repositories from DB even without GitHub token');

    const matched = json.data.find((r: any) => r.githubRepoId === TEST_GITHUB_REPO_ID);
    assert(matched !== undefined, 'Test repository must be in returned list');
    assert.strictEqual(matched.isAnalyzed, true, 'isAnalyzed must be true');
    assert.strictEqual(matched.reviewStatus, 'completed', 'reviewStatus must be completed');
    assert(matched.aiScore > 0, 'aiScore must be populated from review record');
  });

  await test('GET /api/repositories/[id]/review returns persisted review details', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    const savedRepo = await db.query.repositories.findFirst({
      where: eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID),
    });

    const req = new NextRequest(`http://localhost:3000/api/repositories/${savedRepo!.id}/review`);
    const res = await getRepoReview(req, { params: Promise.resolve({ id: savedRepo!.id }) });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert(json.data !== null && json.data.summary, 'Must return review details');
    assert.strictEqual(json.data.repositoryId, savedRepo!.id);
  });

  await test('Anti-IDOR: GET /api/repositories/[id]/review blocks non-owner with HTTP 403', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    // User B attempts to view User A's review
    _setMockUser({ id: TEST_USER_B_ID, role: 'developer' });

    const savedRepo = await db.query.repositories.findFirst({
      where: eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID),
    });

    const req = new NextRequest(`http://localhost:3000/api/repositories/${savedRepo!.id}/review`);
    const res = await getRepoReview(req, { params: Promise.resolve({ id: savedRepo!.id }) });
    assert.strictEqual(res.status, 403, 'Must reject cross-user review read with 403');
  });

  await test('GET /api/repositories/[id]/status returns accurate lifecycle status', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    const savedRepo = await db.query.repositories.findFirst({
      where: eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID),
    });

    const req = new NextRequest(`http://localhost:3000/api/repositories/${savedRepo!.id}/status`);
    const res = await getRepoStatus(req, { params: Promise.resolve({ id: savedRepo!.id }) });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'completed');
    assert.strictEqual(json.data.isAnalyzed, true);
  });

  console.log('\n📌 GROUP 6: Failure Handling & Safe State Recovery');

  await test('Invalid repository transitions to failed state without crashing', async () => {
    const { _setMockUser } = await import('./mock-session-helper');
    _setMockUser({ id: TEST_USER_A_ID, role: 'developer' });

    const INVALID_GITHUB_REPO_ID = 999902;
    const req = new NextRequest('http://localhost:3000/api/analyze?sync=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepoId: INVALID_GITHUB_REPO_ID,
        fullName: 'siddharthkadbhane-pixel/non-existent-repository-404',
        name: 'non-existent-repository-404',
      }),
    });

    const res = await analyzePost(req);
    const json = await res.json();
    assert.strictEqual(json.success, false, 'Invalid repo analysis must return success: false');
    assert.strictEqual(json.data.reviewStatus, 'failed', 'Status must transition to failed');

    // Verify database state is set to failed
    const failedRepo = await db.query.repositories.findFirst({
      where: eq(repositories.githubRepoId, INVALID_GITHUB_REPO_ID),
    });
    assert.strictEqual(failedRepo?.reviewStatus, 'failed');

    // Clean up failure test repo
    await db.delete(repositories).where(eq(repositories.githubRepoId, INVALID_GITHUB_REPO_ID));
  });

  // Clean up main test repo
  await db.delete(repositories).where(eq(repositories.githubRepoId, TEST_GITHUB_REPO_ID));

  console.log('\n======================================================');
  console.log(`📊 PHASE 47 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
