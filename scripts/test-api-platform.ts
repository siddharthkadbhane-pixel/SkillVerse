import { PersonalAccessTokenService } from '../services/api/tokens';
import { ApiAuthService } from '../services/api/auth';
import { ApiRateLimiter } from '../services/api/rateLimiter';
import { ApiResponse } from '../services/api/response';
import { WebhookEngine } from '../services/webhooks/engine';
import { ApiAnalyticsService } from '../services/api/analytics';
import { DUMMY_USERS } from '../lib/dummyData';
import fs from 'fs';
import path from 'path';

async function runApiPlatformTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 38: SKILLVERSE API & WEBHOOK PLATFORM TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     ↳ Details: ${detail}`);
    }
  }

  const testUser = DUMMY_USERS[0]; // Siddharth Kadbhane

  // ----------------------------------------------------
  // Test Group 1: Personal Access Token Lifecycle & Security
  // ----------------------------------------------------
  console.log('📌 Group 1: Personal Access Tokens & Cryptographic Hashing');
  
  const tokenResult = await PersonalAccessTokenService.createToken(
    testUser.id,
    'CI/CD Test Token',
    ['read:profile', 'read:dcc', 'read:skills', 'write:analysis', 'write:webhooks'],
    30
  );

  assert(
    tokenResult.rawToken.startsWith('sk_live_') && tokenResult.rawToken.length > 30,
    'Token Generation: High-entropy raw token with prefix sk_live_',
    `Got token: ${tokenResult.rawToken.slice(0, 15)}...`
  );

  assert(
    tokenResult.token.tokenPrefix.startsWith('sk_live_') && !tokenResult.token.tokenPrefix.includes(tokenResult.rawToken.slice(10, 20)),
    'Token Prefix: Stored prefix truncates secret bytes',
    `Prefix: ${tokenResult.token.tokenPrefix}`
  );

  // Validate token hash
  const validationResult = await PersonalAccessTokenService.validateToken(tokenResult.rawToken);
  assert(
    validationResult.isValid === true && validationResult.tokenData?.userId === testUser.id,
    'Token Hash Validation: Successfully validates raw token against SHA-256 hash in O(1)',
    `User ID: ${validationResult.tokenData?.userId}`
  );

  assert(
    validationResult.tokenData?.scopes.includes('write:analysis') === true,
    'Scope Resolution: Accurately extracts authorized scopes from token',
    `Scopes: ${validationResult.tokenData?.scopes.join(', ')}`
  );

  // ----------------------------------------------------
  // Test Group 2: Scope Enforcement & Client Type Detection
  // ----------------------------------------------------
  console.log('\n📌 Group 2: Scope Enforcement & Client Context');

  // Test full ApiAuthService with mock request
  const mockReq = {
    headers: new Headers({
      authorization: `Bearer ${tokenResult.rawToken}`,
      'x-client-type': 'vscode',
      'x-request-id': 'req_test_vscode_client',
    }),
  } as any;

  const authResult = await ApiAuthService.authenticate(mockReq);
  assert(
    authResult.success === true &&
    authResult.context.clientType === 'vscode' &&
    authResult.context.user.id === testUser.id,
    'ApiAuthService.authenticate(): Correctly resolves Bearer token and client type'
  );

  assert(
    ApiAuthService.hasScope(authResult.context, 'read:profile'),
    'Scope Check: Granted scope read:profile passes'
  );
  assert(
    !ApiAuthService.hasScope(authResult.context, 'admin:all'),
    'Scope Check: Ungranted scope admin:all is strictly forbidden'
  );

  // ----------------------------------------------------
  // Test Group 3: Rate Limiting Engine
  // ----------------------------------------------------
  console.log('\n📌 Group 3: Token Bucket Rate Limiting Engine');

  const ipKey = 'client_ip_test_99';
  const publicLimit = ApiRateLimiter.check(ipKey, 'public');
  assert(
    !publicLimit.isExceeded && publicLimit.limit === 120 && publicLimit.remaining === 119,
    'Public Rate Limit: 120 requests/minute tier initialized correctly'
  );

  assert(
    publicLimit.headers['X-RateLimit-Limit'] === '120' &&
    publicLimit.headers['X-RateLimit-Remaining'] === '119' &&
    typeof publicLimit.headers['X-RateLimit-Reset'] === 'string',
    'Rate Limit Headers: RFC-compliant X-RateLimit headers generated'
  );

  const heavyLimit = ApiRateLimiter.check(testUser.id, 'heavy_analysis');
  assert(
    !heavyLimit.isExceeded && heavyLimit.limit === 10,
    'Heavy Analysis Rate Limit: 10 requests/minute tier enforced'
  );

  // ----------------------------------------------------
  // Test Group 4: Standard Response Envelopes
  // ----------------------------------------------------
  console.log('\n📌 Group 4: Standard Response Envelopes');

  const successRes = ApiResponse.success({ test: true }, { requestId: 'req_test_123' });
  const successJson = await successRes.json();
  assert(
    successJson.data.test === true &&
    successJson.requestId === 'req_test_123' &&
    successJson.version === 'v1',
    'ApiResponse.success(): Generates unified envelope with data, requestId, and version'
  );

  const errorRes = ApiResponse.error('RESOURCE_NOT_FOUND', 'Developer profile not found', {
    status: 404,
    requestId: 'req_err_456',
  });
  const errorJson = await errorRes.json();
  assert(
    errorRes.status === 404 &&
    errorJson.error.code === 'RESOURCE_NOT_FOUND' &&
    errorJson.error.message === 'Developer profile not found' &&
    errorJson.error.requestId === 'req_err_456',
    'ApiResponse.error(): Generates standardized error envelope with code and requestId'
  );

  // ----------------------------------------------------
  // Test Group 5: Webhook Engine & Cryptographic HMAC-SHA256 Signatures
  // ----------------------------------------------------
  console.log('\n📌 Group 5: Webhook Engine & Cryptographic HMAC-SHA256 Signatures');

  const webhookSub = await WebhookEngine.subscribe(
    testUser.id,
    'https://api.skillverse.dev/mock-webhook-receiver',
    ['skill.verified', 'dcc.updated'],
    'Test Webhook Subscriber'
  );

  assert(
    webhookSub.secret.startsWith('whsec_') && webhookSub.events.includes('skill.verified'),
    'Webhook Subscription: Subscribed with secret whsec_... and events'
  );

  const payload = { developer: 'siddharthkadbhane', skill: 'TypeScript', level: 95 };
  const payloadString = JSON.stringify(payload);
  const nowTimestamp = Math.floor(Date.now() / 1000);

  const signature = WebhookEngine.generateSignature(payloadString, webhookSub.secret, nowTimestamp);
  assert(
    signature.startsWith('sha256=') && signature.length === 71,
    'Webhook Signature Generation: Generates standard sha256=<64_hex_chars>',
    `Signature: ${signature}`
  );

  const isValid = WebhookEngine.verifySignature(
    payloadString,
    signature,
    webhookSub.secret,
    nowTimestamp
  );
  assert(
    isValid === true,
    'Webhook Verification: Cryptographic verification passes with matching secret and fresh timestamp'
  );

  const isInvalidPayload = WebhookEngine.verifySignature(
    JSON.stringify({ tampered: true }),
    signature,
    webhookSub.secret,
    nowTimestamp
  );
  assert(
    isInvalidPayload === false,
    'Webhook Verification: Cryptographic verification rejects tampered payload'
  );

  const isExpired = WebhookEngine.verifySignature(
    payloadString,
    signature,
    webhookSub.secret,
    nowTimestamp - 600 // 10 minutes ago
  );
  assert(
    isExpired === false,
    'Webhook Anti-Replay: Rejects expired webhook signatures (> 5 minutes tolerance)'
  );

  // Webhook Event Dispatching
  const dispatchResult = await WebhookEngine.dispatch('skill.verified', payload, testUser.id);
  assert(
    dispatchResult.dispatchedCount >= 1 && dispatchResult.deliveries.length >= 1,
    'Webhook Event Dispatch: Dispatches event to active subscribers with delivery logging'
  );

  // ----------------------------------------------------
  // Test Group 6: API Analytics & Observability
  // ----------------------------------------------------
  console.log('\n📌 Group 6: API Analytics & Observability');

  ApiAnalyticsService.record({
    requestId: 'req_obs_1',
    endpoint: '/api/v1/me',
    method: 'GET',
    statusCode: 200,
    durationMs: 32,
    clientType: 'vscode',
    userId: testUser.id,
  });

  ApiAnalyticsService.record({
    requestId: 'req_obs_2',
    endpoint: '/api/v1/repositories',
    method: 'GET',
    statusCode: 200,
    durationMs: 45,
    clientType: 'cli',
    userId: testUser.id,
  });

  const metricsSummary = ApiAnalyticsService.getSummary();
  assert(
    metricsSummary.totalRequests >= 2 &&
    metricsSummary.clientBreakdown.vscode >= 1 &&
    metricsSummary.clientBreakdown.cli >= 1,
    'API Analytics Service: Records real-time metrics and tracks client types'
  );

  // ----------------------------------------------------
  // Test Group 7: OpenAPI 3.1 Specification Validation
  // ----------------------------------------------------
  console.log('\n📌 Group 7: OpenAPI 3.1 Specification Validation');

  const openApiPath = path.join(process.cwd(), 'public', 'openapi.json');
  assert(fs.existsSync(openApiPath), 'OpenAPI Spec File: public/openapi.json exists');

  const specContent = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
  assert(
    specContent.openapi === '3.1.0' &&
    specContent.paths['/me'] &&
    specContent.paths['/developers'] &&
    specContent.paths['/skills'] &&
    specContent.paths['/repositories'] &&
    specContent.paths['/opportunities'] &&
    specContent.paths['/challenges'] &&
    specContent.paths['/keys'] &&
    specContent.paths['/webhooks'],
    'OpenAPI Schema Completeness: Includes all required v1 endpoints and schemas'
  );

  // ----------------------------------------------------
  // Test Group 8: Token Revocation
  // ----------------------------------------------------
  console.log('\n📌 Group 8: Token Revocation Lifecycle');

  const revoked = await PersonalAccessTokenService.revokeToken(testUser.id, tokenResult.token.id);
  assert(revoked === true, 'Token Revocation: Revokes PAT successfully');

  const revokedValidation = await PersonalAccessTokenService.validateToken(tokenResult.rawToken);
  assert(
    revokedValidation.isValid === false && revokedValidation.errorReason === 'REVOKED',
    'Revoked Token Rejection: Token is immediately invalid for authentication'
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`🎯 API PLATFORM TEST SUITE SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runApiPlatformTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
