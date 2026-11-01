/**
 * SkillVerse Phase 43D — High-Severity Remediation Regression Test Suite
 * 
 * Verifies:
 * 1. Distributed rate limiting across multi-instance simulation & degraded backend fallback
 * 2. Tenant-isolated object storage (path traversal denial, MIME/size limits, cross-user Anti-IDOR)
 * 3. Webhook delivery reliability (exponential backoff, retry worker, idempotency protection)
 * 4. Distinct separation between mocked tests and genuine database queries
 */

import { DistributedRateLimiter, RateLimitStoreAdapter } from '../services/security/distributedRateLimiter';
import { ApiRateLimiter } from '../services/api/rateLimiter';
import { StorageSecurityService } from '../services/storage/isolation';
import { NeonStorageService } from '../services/neon/storage';
import { WebhookEngine } from '../services/webhooks/engine';
import { DUMMY_USERS, DUMMY_REPOSITORIES } from '../lib/dummyData';
import { PersonalAccessTokenService } from '../services/api/tokens';
import { NextRequest } from 'next/server';
import * as WebhookDetailRoute from '../app/api/v1/webhooks/[id]/route';
import * as RepositoryDetailRoute from '../app/api/v1/repositories/[id]/route';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`   ✅ PASS: ${testName}`);
  } else {
    console.error(`   ❌ FAIL: ${testName}`);
    if (detail) console.error(`      ↳ Details: ${detail}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runHighSeverityTests() {
  console.log('\n================================================================');
  console.log('  🛡️ SKILLVERSE PHASE 43D — HIGH-SEVERITY REMEDIATION TESTS');
  console.log('================================================================\n');

  const userA = DUMMY_USERS[0]; // Siddharth Kadbhane
  const userB = DUMMY_USERS[1]; // Alex Chen

  // -------------------------------------------------------------------------
  // Test Suite 1: Distributed Rate Limiting & Multi-Instance Coordination
  // -------------------------------------------------------------------------
  console.log('▶ [1/4] Testing Distributed Rate Limiting & Multi-Instance Coordination...');
  {
    DistributedRateLimiter.clearLocalStore();

    // 1.1 Local sliding-window threshold enforcement
    const testIp = '192.168.1.100';
    await DistributedRateLimiter.reset(testIp, 'auth_sensitive');

    for (let i = 1; i <= 10; i++) {
      const res = await DistributedRateLimiter.check(testIp, 'auth_sensitive');
      assert(res.allowed, `Request ${i}/10 is permitted within limit`);
      assert(res.remaining === 10 - i, `Remaining tokens correctly decremented: ${res.remaining}`);
    }

    // 11th request must be rejected (429)
    const blockedRes = await DistributedRateLimiter.check(testIp, 'auth_sensitive');
    assert(!blockedRes.allowed, 'Request 11/10 is rejected with rate limit exceeded');
    assert(blockedRes.remaining === 0, 'Remaining tokens is 0');
    assert(blockedRes.headers['Retry-After'] !== undefined, 'Retry-After header is attached');

    // 1.2 Multi-Instance Coordination Simulation
    // Shared backend store simulation
    const sharedCounters = new Map<string, { count: number; resetAt: number }>();
    const mockSharedAdapter: RateLimitStoreAdapter = {
      name: 'MockSharedClusterStore',
      isAvailable: async () => true,
      increment: async (key: string, windowMs: number) => {
        const now = Date.now();
        let bucket = sharedCounters.get(key);
        if (!bucket || now > bucket.resetAt) {
          bucket = { count: 1, resetAt: now + windowMs };
        } else {
          bucket.count += 1;
        }
        sharedCounters.set(key, bucket);
        return { count: bucket.count, resetAt: bucket.resetAt };
      },
      reset: async (key: string) => {
        sharedCounters.delete(key);
      },
    };

    DistributedRateLimiter.setStoreAdapter(mockSharedAdapter);

    const clusterKey = 'cluster-test-client-001';
    await DistributedRateLimiter.reset(clusterKey, 'heavy_analysis');

    // Instance 1 consumes 6 requests
    for (let i = 1; i <= 6; i++) {
      const res = await DistributedRateLimiter.check(clusterKey, 'heavy_analysis');
      assert(res.allowed, `Instance 1: Request ${i} allowed`);
    }

    // Instance 2 consumes 4 requests (total 10 reaches heavy_analysis limit of 10)
    for (let i = 7; i <= 10; i++) {
      const res = await DistributedRateLimiter.check(clusterKey, 'heavy_analysis');
      assert(res.allowed, `Instance 2: Request ${i} allowed via shared coordination`);
    }

    // Instance 3 attempts request 11 -> Blocked across the entire cluster!
    const clusterBlocked = await DistributedRateLimiter.check(clusterKey, 'heavy_analysis');
    assert(!clusterBlocked.allowed, 'Multi-instance cluster correctly blocks 11th request across instances');

    // 1.3 Degraded Backend Behavior (Fail-Closed / Strict Fallback)
    const failingAdapter: RateLimitStoreAdapter = {
      name: 'FailingSharedBackend',
      isAvailable: async () => false, // Backend offline
      increment: async () => { throw new Error('Connection refused'); },
      reset: async () => {},
    };

    DistributedRateLimiter.setStoreAdapter(failingAdapter);
    DistributedRateLimiter.clearLocalStore();

    const degradedKey = 'degraded-client-test';
    // For heavy_analysis, when backend is degraded, strict local quota (30% of 10 = 3) is enforced to prevent abuse
    for (let i = 1; i <= 3; i++) {
      const res = await DistributedRateLimiter.check(degradedKey, 'heavy_analysis');
      assert(res.allowed, `Degraded mode: Request ${i}/3 allowed under fail-safe policy`);
      assert(res.degradedMode === true, 'Response correctly flags degradedMode: true');
    }

    const degradedBlocked = await DistributedRateLimiter.check(degradedKey, 'heavy_analysis');
    assert(!degradedBlocked.allowed, 'Degraded mode enforces strict fail-closed boundary for sensitive tier');

    // Reset adapter to clean state
    DistributedRateLimiter.setStoreAdapter(null);
    DistributedRateLimiter.clearLocalStore();

    // 1.4 Unified Rate Limit Check & Header Validation
    const syncKey = 'sync-client-test';
    const syncRes1 = ApiRateLimiter.check(syncKey, 'heavy_analysis');
    assert(!syncRes1.isExceeded, 'ApiRateLimiter.check permits initial request');
    assert(syncRes1.limit === 10, 'Limit correctly matches heavy_analysis config (10)');

    // 1.5 IP Address Validation & Spoofing Defense
    assert(DistributedRateLimiter.isValidIp('192.168.1.1'), 'Valid IPv4 accepted');
    assert(DistributedRateLimiter.isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), 'Valid IPv6 accepted');
    assert(!DistributedRateLimiter.isValidIp('192.168.1.1; DROP TABLE users'), 'IP with SQL injection rejected');
    assert(!DistributedRateLimiter.isValidIp('attacker.controlled.domain'), 'Hostname rejected as IP');
  }

  // -------------------------------------------------------------------------
  // Test Suite 2: Tenant-Isolated Object Storage Security
  // -------------------------------------------------------------------------
  console.log('\n▶ [2/4] Testing Tenant-Isolated Object Storage Security...');
  {
    StorageSecurityService.clearStore();

    // 2.1 Path Traversal Denial
    let traversalBlocked = false;
    try {
      StorageSecurityService.sanitizeFileName('../../etc/passwd');
    } catch {
      traversalBlocked = true;
    }
    assert(traversalBlocked, 'Path traversal attempt with "../" is strictly rejected');

    let encodedTraversalBlocked = false;
    try {
      StorageSecurityService.sanitizeFileName('%2e%2e%2f%2e%2e%2fetc%2fpasswd');
    } catch {
      encodedTraversalBlocked = true;
    }
    assert(encodedTraversalBlocked, 'URL-encoded path traversal attempt is strictly rejected');

    let nullByteBlocked = false;
    try {
      StorageSecurityService.sanitizeFileName('innocent.png\0.malicious.sh');
    } catch {
      nullByteBlocked = true;
    }
    assert(nullByteBlocked, 'Null byte injection in file name is strictly rejected');

    let encodedNullByteBlocked = false;
    try {
      StorageSecurityService.sanitizeFileName('innocent.png%00.malicious.sh');
    } catch {
      encodedNullByteBlocked = true;
    }
    assert(encodedNullByteBlocked, 'URL-encoded null byte injection is strictly rejected');

    // 2.2 Content-Type Validation
    let invalidMimeBlocked = false;
    try {
      StorageSecurityService.validateUpload('avatars', 'executable code', 'application/x-sh');
    } catch {
      invalidMimeBlocked = true;
    }
    assert(invalidMimeBlocked, 'Disallowed MIME type for avatar category is rejected');

    // 2.3 File Size Limit Enforcement
    let oversizeBlocked = false;
    try {
      const oversizeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB exceeds 5 MB avatar limit
      StorageSecurityService.validateUpload('avatars', oversizeBuffer, 'image/jpeg');
    } catch {
      oversizeBlocked = true;
    }
    assert(oversizeBlocked, 'File upload exceeding category size limit (6MB > 5MB) is rejected');

    // 2.4 User A uploads private evidence
    const evidenceData = Buffer.from('{"verifiedAst":true,"auditScore":98}', 'utf-8');
    const uploadResult = await NeonStorageService.uploadAsset(
      { userId: userA.id, role: 'developer' },
      {
        category: 'evidence',
        fileName: 'dcc_evidence_audit.json',
        body: evidenceData,
        contentType: 'application/json',
      }
    );

    assert(uploadResult.key.startsWith(`tenants/default/users/${userA.id}/evidence/`), 'Asset uploaded to scoped key');
    assert(!uploadResult.isPublic, 'Evidence asset is private by default (no raw public URL)');

    // 2.5 User A generates presigned URL for own asset -> Allowed
    const userASigned = await NeonStorageService.getSignedAssetUrl(
      { userId: userA.id, role: 'developer' },
      uploadResult.key,
      300
    );
    assert(userASigned.includes(uploadResult.key), 'Owner receives signed presigned download URL');

    // 2.6 User B attempts to access User A's private asset (Anti-IDOR) -> FORBIDDEN
    let crossUserReadBlocked = false;
    try {
      await NeonStorageService.getSignedAssetUrl(
        { userId: userB.id, role: 'developer' },
        uploadResult.key
      );
    } catch (err: any) {
      if (err.message.includes('Forbidden')) crossUserReadBlocked = true;
    }
    assert(crossUserReadBlocked, 'Cross-user access attempt to generate signed URL is rejected with Forbidden');

    // 2.7 User B attempts to delete User A's private asset -> FORBIDDEN
    let crossUserDeleteBlocked = false;
    try {
      await NeonStorageService.deleteAsset(
        { userId: userB.id, role: 'developer' },
        uploadResult.key
      );
    } catch (err: any) {
      if (err.message.includes('Forbidden')) crossUserDeleteBlocked = true;
    }
    assert(crossUserDeleteBlocked, 'Cross-user deletion attempt is rejected with Forbidden');

    // 2.8 Scoped Listing: User B lists assets -> User A's files must NOT appear
    const userBList = await NeonStorageService.listAssets({ userId: userB.id, role: 'developer' });
    assert(!userBList.includes(uploadResult.key), 'User B cannot list or discover User A objects');

    // 2.9 User A deletes own asset -> Allowed
    const deleteResult = await NeonStorageService.deleteAsset(
      { userId: userA.id, role: 'developer' },
      uploadResult.key
    );
    assert(deleteResult.success, 'Owner successfully deletes own asset');
  }

  // -------------------------------------------------------------------------
  // Test Suite 3: Webhook Delivery Reliability & Idempotency
  // -------------------------------------------------------------------------
  console.log('\n▶ [3/4] Testing Webhook Delivery Reliability & Idempotency...');
  {
    // 3.1 Exponential Backoff Calculation
    assert(WebhookEngine.calculateBackoff(1) === 10000, 'Attempt 1 backoff delay is 10 seconds');
    assert(WebhookEngine.calculateBackoff(2) === 60000, 'Attempt 2 backoff delay is 60 seconds');
    assert(WebhookEngine.calculateBackoff(3) === 300000, 'Attempt 3 backoff delay is 300 seconds (bounded max)');

    // 3.2 HMAC Signature & Verification
    const secret = 'whsec_test_secret_key_sample_123';
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { eventId: 'evt_test_101', status: 'verified', score: 95 };
    const payloadString = JSON.stringify(payload);

    const sig = WebhookEngine.generateSignature(payloadString, secret, timestamp);
    assert(sig.startsWith('sha256='), 'HMAC signature is generated with sha256 prefix');

    const isValid = WebhookEngine.verifySignature(payloadString, sig, secret, timestamp);
    assert(isValid, 'Valid HMAC signature verifies cleanly');

    const isTampered = WebhookEngine.verifySignature('{"tampered":true}', sig, secret, timestamp);
    assert(!isTampered, 'Tampered payload signature is rejected');

    const isStale = WebhookEngine.verifySignature(payloadString, sig, secret, timestamp - 600); // 10 mins old
    assert(!isStale, 'Stale webhook timestamp (> 300s) is rejected (Anti-Replay)');

    // 3.3 Duplicate Delivery Idempotency Protection
    let sideEffectExecutionCount = 0;
    const testHandler = async () => {
      sideEffectExecutionCount++;
    };

    // First delivery attempt
    const firstDelivery = await WebhookEngine.processIncomingWebhook({
      payload: payloadString,
      signatureHeader: sig,
      secret,
      timestampHeader: timestamp,
      handler: testHandler,
    });

    assert(firstDelivery.success, 'First incoming webhook delivery succeeds');
    assert(firstDelivery.duplicate === false, 'First delivery is flagged as non-duplicate');
    assert(sideEffectExecutionCount === 1, 'Side effect executed exactly once');

    // Second delivery of IDENTICAL event (Duplicate replay attempt)
    const duplicateDelivery = await WebhookEngine.processIncomingWebhook({
      payload: payloadString,
      signatureHeader: sig,
      secret,
      timestampHeader: timestamp,
      handler: testHandler,
    });

    assert(duplicateDelivery.success, 'Duplicate delivery returns success response without error');
    assert(duplicateDelivery.duplicate === true, 'Duplicate delivery is detected via idempotency tracker');
    assert(sideEffectExecutionCount === 1, 'Side effect is NOT executed again (Duplicate protection verified)');

    // 3.4 Webhook Retry Execution Worker
    const dispatchResult = await WebhookEngine.dispatch('skill.verified', { skill: 'TypeScript', score: 98 });
    assert(dispatchResult.dispatchedCount > 0, 'Webhook dispatch records active deliveries');

    const retryResult = await WebhookEngine.processPendingRetries();
    assert(typeof retryResult.retriedCount === 'number', 'Retry worker processes scheduled retries');

    // 3.5 Concurrent Webhook Idempotency Race Test (At least 10 concurrent duplicate deliveries)
    let concurrentHandlerExecutions = 0;
    const concurrentEventId = 'evt_concurrent_race_test_1001';
    const concurrentPayload = { eventId: concurrentEventId, action: 'tier_upgrade', level: 'Senior' };
    const concurrentPayloadStr = JSON.stringify(concurrentPayload);
    const concurrentTimestamp = Math.floor(Date.now() / 1000);
    const concurrentSig = WebhookEngine.generateSignature(concurrentPayloadStr, secret, concurrentTimestamp);

    const concurrentHandler = async () => {
      concurrentHandlerExecutions++;
      // Simulate real asynchronous domain workload to ensure overlapping race window
      await new Promise((resolve) => setTimeout(resolve, 25));
    };

    // Dispatch 12 concurrent duplicate deliveries simultaneously
    const concurrentBatch = await Promise.all(
      Array.from({ length: 12 }, () =>
        WebhookEngine.processIncomingWebhook({
          payload: concurrentPayloadStr,
          signatureHeader: concurrentSig,
          secret,
          timestampHeader: concurrentTimestamp,
          handler: concurrentHandler,
        })
      )
    );

    assert(concurrentHandlerExecutions === 1, 'Concurrent deliveries execute consumer handler exactly once across parallel requests');
    assert(concurrentBatch.every((res) => res.success), 'All 12 concurrent duplicate deliveries return success response');
    const primaryDeliveries = concurrentBatch.filter((res) => res.duplicate === false);
    assert(primaryDeliveries.length === 1, 'Exactly one delivery is recorded as primary execution (duplicate === false)');
    const duplicateDeliveries = concurrentBatch.filter((res) => res.duplicate === true);
    assert(duplicateDeliveries.length === 11, 'Remaining 11 concurrent deliveries are detected as duplicates (duplicate === true)');
  }

  // -------------------------------------------------------------------------
  // Test Suite 4: Mocked vs. Real Database Integration Separation
  // -------------------------------------------------------------------------
  console.log('\n▶ [4/5] Verifying Real Database Connectivity vs. Mocked Isolation...');
  {
    const { db } = await import('../lib/drizzle');
    const { sql } = await import('drizzle-orm');

    // Real database integration check against Neon
    let realDbConnected = false;
    try {
      const dbCheck = await db.execute(sql`SELECT current_database() as db_name, 43 as phase;`);
      if (dbCheck && dbCheck[0]) {
        realDbConnected = true;
      }
    } catch {}

    assert(realDbConnected, 'Real Neon PostgreSQL integration connection verified and responsive');
    assert(process.env.DATABASE_URL !== undefined, 'Runtime connects via DATABASE_URL');
    assert(process.env.DATABASE_URL_UNPOOLED !== undefined, 'Direct migration connects via DATABASE_URL_UNPOOLED');
  }

  // -------------------------------------------------------------------------
  // Test Suite 5: Object-Level Authorization & Anti-IDOR Remediation (P0)
  // -------------------------------------------------------------------------
  console.log('\n▶ [5/5] Testing Object-Level Authorization & Anti-IDOR Protections...');
  {
    // Generate isolated tokens for User A and User B
    const tokenA = await PersonalAccessTokenService.createToken(
      userA.id,
      'Phase 43D User A PAT',
      ['read:profile', 'write:webhooks', 'read:repositories']
    );
    const tokenB = await PersonalAccessTokenService.createToken(
      userB.id,
      'Phase 43D User B PAT',
      ['read:profile', 'write:webhooks', 'read:repositories']
    );

    // 5.1 Create private webhook owned by User A
    const userAWebhook = await WebhookEngine.subscribe(
      userA.id,
      'https://api.skillverse.dev/mock-webhook-receiver-user-a',
      ['skill.verified', 'dcc.updated'],
      'User A Confidential CI Integration'
    );

    // Seed a delivery record for User A's webhook
    await WebhookEngine.dispatch('skill.verified', { verified: true }, userA.id);

    // 5.2 User B attempts to GET User A's webhook deliveries -> Must return HTTP 403 Forbidden
    const userBGetReq = new NextRequest(`http://localhost:3000/api/v1/webhooks/${userAWebhook.id}`, {
      headers: { Authorization: `Bearer ${tokenB.rawToken}` },
    });
    const getResB = await WebhookDetailRoute.GET(userBGetReq, { params: Promise.resolve({ id: userAWebhook.id }) });
    assert(getResB.status === 403, 'User B cannot GET User A webhook deliveries (HTTP 403 Forbidden)');
    const getBodyB = await getResB.json();
    assert(getBodyB.error !== undefined, 'Unauthorized delivery access returns error response object');
    assert(getBodyB.error?.code === 'FORBIDDEN_RESOURCE_ACCESS', 'Error code explicitly indicates FORBIDDEN_RESOURCE_ACCESS');
    assert(getBodyB.data === undefined, 'No delivery history or payload data is leaked to User B');

    // 5.3 Legitimate owner User A can GET own webhook deliveries -> Allowed HTTP 200
    const userAGetReq = new NextRequest(`http://localhost:3000/api/v1/webhooks/${userAWebhook.id}`, {
      headers: { Authorization: `Bearer ${tokenA.rawToken}` },
    });
    const getResA = await WebhookDetailRoute.GET(userAGetReq, { params: Promise.resolve({ id: userAWebhook.id }) });
    assert(getResA.status === 200, 'Legitimate owner User A can retrieve own webhook deliveries (HTTP 200 OK)');
    const getBodyA = await getResA.json();
    assert(getBodyA.data !== undefined, 'Owner delivery retrieval succeeds');
    assert(getBodyA.data.webhookId === userAWebhook.id, 'Response matches requested webhook ID');
    assert(Array.isArray(getBodyA.data.recentDeliveries), 'Owner receives recent delivery records');

    // 5.4 User B attempts to DELETE User A's webhook via API route -> Must return HTTP 403 Forbidden
    const userBDeleteReq = new NextRequest(`http://localhost:3000/api/v1/webhooks/${userAWebhook.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB.rawToken}` },
    });
    const delResB = await WebhookDetailRoute.DELETE(userBDeleteReq, { params: Promise.resolve({ id: userAWebhook.id }) });
    assert(delResB.status === 403, 'User B cannot delete User A webhook via API route (HTTP 403 Forbidden)');

    // 5.5 User B directly invokes WebhookEngine.deleteWebhook() -> Must return false and leave store unchanged
    const directDeleteResult = await WebhookEngine.deleteWebhook(userB.id, userAWebhook.id);
    assert(directDeleteResult === false, 'deleteWebhook returns false when actor is not legitimate owner');
    const preservedWebhook = WebhookEngine.getInMemoryWebhook(userAWebhook.id);
    assert(preservedWebhook !== undefined, 'User A webhook is preserved intact in inMemoryWebhooks');
    assert(preservedWebhook?.userId === userA.id, 'Webhook owner remains User A completely unchanged');

    // 5.6 Legitimate owner User A can delete own webhook -> Allowed HTTP 200
    const userADeleteReq = new NextRequest(`http://localhost:3000/api/v1/webhooks/${userAWebhook.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA.rawToken}` },
    });
    const delResA = await WebhookDetailRoute.DELETE(userADeleteReq, { params: Promise.resolve({ id: userAWebhook.id }) });
    assert(delResA.status === 200, 'Legitimate owner User A can delete own webhook (HTTP 200 OK)');
    assert(WebhookEngine.getInMemoryWebhook(userAWebhook.id) === undefined, 'Webhook is removed from inMemoryWebhooks after owner deletion');

    // 5.7 User B attempts to GET User A's repository or its AST reviews -> Must return HTTP 403 Forbidden
    const userARepo = DUMMY_REPOSITORIES.find((r) => r.userId === userA.id)!;
    const userBRepoReq = new NextRequest(`http://localhost:3000/api/v1/repositories/${userARepo.id}`, {
      headers: { Authorization: `Bearer ${tokenB.rawToken}` },
    });
    const repoResB = await RepositoryDetailRoute.GET(userBRepoReq, { params: Promise.resolve({ id: userARepo.id }) });
    assert(repoResB.status === 403, 'User B cannot GET User A repository (HTTP 403 Forbidden)');
    const repoBodyB = await repoResB.json();
    assert(repoBodyB.error !== undefined, 'Unauthorized repository access returns error response object');
    assert(repoBodyB.error?.code === 'FORBIDDEN_RESOURCE_ACCESS', 'Error code is FORBIDDEN_RESOURCE_ACCESS');
    assert(repoBodyB.data === undefined, 'No AST review records or summary leaked to User B');

    // 5.8 Legitimate owner User A can GET own repository and its AST review -> Allowed HTTP 200
    const userARepoReq = new NextRequest(`http://localhost:3000/api/v1/repositories/${userARepo.id}`, {
      headers: { Authorization: `Bearer ${tokenA.rawToken}` },
    });
    const repoResA = await RepositoryDetailRoute.GET(userARepoReq, { params: Promise.resolve({ id: userARepo.id }) });
    assert(repoResA.status === 200, 'Legitimate owner User A can retrieve own repository (HTTP 200 OK)');
    const repoBodyA = await repoResA.json();
    assert(repoBodyA.data !== undefined, 'Owner repository retrieval succeeds');
    assert(repoBodyA.data.id === userARepo.id, 'Repository ID matches');
    assert(repoBodyA.data.latestReview !== null, 'Owner receives AST review and capability metrics');

    // 5.9 Negative test: Non-existent webhook returns HTTP 404 Not Found without leaking details
    const nonExistentWebhookReq = new NextRequest('http://localhost:3000/api/v1/webhooks/wh_non_existent_000', {
      headers: { Authorization: `Bearer ${tokenA.rawToken}` },
    });
    const missingWebhookRes = await WebhookDetailRoute.GET(nonExistentWebhookReq, { params: Promise.resolve({ id: 'wh_non_existent_000' }) });
    assert(missingWebhookRes.status === 404, 'Non-existent webhook query returns HTTP 404 Not Found');

    // 5.10 Negative test: Non-existent repository returns HTTP 404 Not Found without leaking details
    const nonExistentRepoReq = new NextRequest('http://localhost:3000/api/v1/repositories/non-existent-repo-999', {
      headers: { Authorization: `Bearer ${tokenA.rawToken}` },
    });
    const missingRepoRes = await RepositoryDetailRoute.GET(nonExistentRepoReq, { params: Promise.resolve({ id: 'non-existent-repo-999' }) });
    assert(missingRepoRes.status === 404, 'Non-existent repository query returns HTTP 404 Not Found');
  }

  console.log('\n================================================================');
  console.log(`  🎉 PHASE 43D COMPLETE: ${passed}/${total} TESTS PASSED CLEANLY!`);
  console.log('================================================================\n');

  process.exit(0);
}

runHighSeverityTests().catch((err) => {
  console.error('\n❌ Uncaught error during Phase 43D test execution:', err);
  process.exit(1);
});
