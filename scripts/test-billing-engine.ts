// SkillVerse Phase 39 Monetization & Billing Foundation Test Suite

import { PlanService, PLANS } from '../services/billing/plans';
import { EntitlementService } from '../services/billing/entitlements';
import { BillingProviderRegistry } from '../services/billing/providers/base';
import { MockBillingProvider } from '../services/billing/providers/mock';
import { BillingWebhookService } from '../services/billing/webhooks';
import { TrustCalculatorService } from '../services/trust/calculator';
import { DUMMY_USERS } from '../lib/dummyData';
import { PlanId } from '../types/billing';

export async function runBillingEngineTests() {
  console.log('\n======================================================');
  console.log('💳 RUNNING PHASE 39: SKILLVERSE BILLING & ENTITLEMENT TEST SUITE');
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

  const testUser = DUMMY_USERS[0]; // Siddharth Kadbhane (Developer)
  const testCompanyAdmin = DUMMY_USERS[4]; // Marcus Vance (Company Admin)
  const mockProvider = new MockBillingProvider();

  // ----------------------------------------------------
  // Test Group 1: Plan Catalog & Default Configuration
  // ----------------------------------------------------
  console.log('📌 Group 1: Plan Configuration & Free-First Defaults');

  const freePlan = PlanService.getPlan('free');
  assert(
    freePlan.id === 'free' && freePlan.priceMonthly === 0 && freePlan.priceAnnualMonthly === 0,
    'Free Plan: Standard developer tier price is $0/month',
    `Price: $${freePlan.priceMonthly}`
  );

  assert(
    freePlan.entitlements.repository_analyses === 10 && freePlan.entitlements.api_monthly_requests === 1000,
    'Generous Free Allocations: 10 repo analyses and 1,000 API requests allocated for free',
    `Repo Limit: ${freePlan.entitlements.repository_analyses}`
  );

  const proPlan = PlanService.getPlan('developer_pro');
  assert(
    proPlan.entitlements.repository_analyses === 100 && proPlan.entitlements.advanced_analytics === true,
    'Developer Pro Plan: Higher quotas (100 analyses, advanced analytics enabled)',
    `Pro Repo Limit: ${proPlan.entitlements.repository_analyses}`
  );

  const companyPlan = PlanService.getPlan('company');
  assert(
    companyPlan.entitlements.candidate_searches === 500 && companyPlan.entitlements.private_recruiter_notes === true,
    'Company Plan: Includes 500 candidate searches and recruiter notes entitlement',
    `Company Searches: ${companyPlan.entitlements.candidate_searches}`
  );

  // ----------------------------------------------------
  // Test Group 2: Subscription State Management
  // ----------------------------------------------------
  console.log('\n📌 Group 2: Subscription State & Role-Based Resolution');

  const userSub = await EntitlementService.getActiveSubscription(testUser.id, 'user');
  assert(
    userSub.targetType === 'user' && userSub.status === 'active',
    'Active Subscription Resolution: Correctly resolves active user subscription',
    `Plan: ${userSub.planId}, Status: ${userSub.status}`
  );

  const companySub = await EntitlementService.getActiveSubscription(testCompanyAdmin.id, 'company');
  assert(
    companySub.targetType === 'company' && companySub.planId === 'company',
    'Company Subscription Resolution: Correctly resolves company workspace plan',
    `Plan: ${companySub.planId}`
  );

  // ----------------------------------------------------
  // Test Group 3: Server-Side Feature Gating & Quotas
  // ----------------------------------------------------
  console.log('\n📌 Group 3: Server-Side Entitlement Checks (Feature Gating)');

  // Reset usage for clean state
  await EntitlementService.resetUsagePeriod(testUser.id, 'user');

  const checkInitial = await EntitlementService.checkEntitlement(testUser.id, 'repository_analyses', 'user');
  assert(
    checkInitial.allowed === true && checkInitial.remaining === 10,
    'Initial Entitlement Check: Free user has 10 remaining analyses',
    `Remaining: ${checkInitial.remaining}`
  );

  // Record usage
  await EntitlementService.recordUsage(testUser.id, 'repository_analyses', 3, 'user');
  const checkAfterUsage = await EntitlementService.checkEntitlement(testUser.id, 'repository_analyses', 'user');
  assert(
    checkAfterUsage.allowed === true && checkAfterUsage.currentUsage === 3 && checkAfterUsage.remaining === 7,
    'Usage Recording: Accurately increments usage counter to 3/10 (7 remaining)',
    `Current: ${checkAfterUsage.currentUsage}, Remaining: ${checkAfterUsage.remaining}`
  );

  // Check boolean feature not on free plan
  const checkAnalytics = await EntitlementService.checkEntitlement(testUser.id, 'advanced_analytics', 'user');
  assert(
    checkAnalytics.allowed === false,
    'Feature Gating: advanced_analytics is disallowed on Free Developer tier without breaking flow',
    `Reason: ${checkAnalytics.reason}`
  );

  // ----------------------------------------------------
  // Test Group 4: Limit Reached & Usage Reset
  // ----------------------------------------------------
  console.log('\n📌 Group 4: Quota Limit Enforcement & Rollover Reset');

  // Push usage to limit (7 more = 10 total)
  await EntitlementService.recordUsage(testUser.id, 'repository_analyses', 7, 'user');
  const checkAtLimit = await EntitlementService.checkEntitlement(testUser.id, 'repository_analyses', 'user');
  assert(
    checkAtLimit.allowed === false && checkAtLimit.remaining === 0,
    'Quota Enforcement: Blocks request when monthly quota (10/10) is exhausted with clear reset date',
    `Reason: ${checkAtLimit.reason}`
  );

  // Reset period (simulating new billing cycle)
  await EntitlementService.resetUsagePeriod(testUser.id, 'user');
  const checkAfterReset = await EntitlementService.checkEntitlement(testUser.id, 'repository_analyses', 'user');
  assert(
    checkAfterReset.allowed === true && checkAfterReset.currentUsage === 0,
    'Billing Cycle Reset: Successfully restores quotas to 0 upon period rollover',
    `Current Usage: ${checkAfterReset.currentUsage}`
  );

  // ----------------------------------------------------
  // Test Group 5: Subscription State Transitions
  // ----------------------------------------------------
  console.log('\n📌 Group 5: Subscription Upgrades, Downgrades & Admin Bypass');

  // Upgrade user to Developer Pro
  await EntitlementService.updateSubscription(testUser.id, 'developer_pro', 'active', 'user');
  const checkProAnalyses = await EntitlementService.checkEntitlement(testUser.id, 'repository_analyses', 'user');
  assert(
    checkProAnalyses.allowed === true && checkProAnalyses.limit === 100,
    'Subscription Upgrade: Developer Pro immediately unlocks 100 analyses quota',
    `New Limit: ${checkProAnalyses.limit}`
  );

  const checkProAnalytics = await EntitlementService.checkEntitlement(testUser.id, 'advanced_analytics', 'user');
  assert(
    checkProAnalytics.allowed === true,
    'Entitlement Unlock: Developer Pro unlocks advanced_analytics boolean feature',
    `Allowed: ${checkProAnalytics.allowed}`
  );

  // Admin bypass check
  const checkAdminBypass = await EntitlementService.checkEntitlement('any-admin-id', 'repository_analyses', 'user', 'admin');
  assert(
    checkAdminBypass.allowed === true && checkAdminBypass.isUnlimited === true,
    'Admin Bypass: Admin role has unrestricted capability access across all features',
    `Reason: ${checkAdminBypass.reason}`
  );

  // Revert user to free
  await EntitlementService.updateSubscription(testUser.id, 'free', 'active', 'user');

  // ----------------------------------------------------
  // Test Group 6: Workspace & Target Isolation
  // ----------------------------------------------------
  console.log('\n📌 Group 6: Company Workspace Isolation');

  await EntitlementService.resetUsagePeriod(testCompanyAdmin.id, 'company');
  await EntitlementService.recordUsage(testCompanyAdmin.id, 'candidate_searches', 15, 'company');
  const companyUsage = await EntitlementService.getCurrentUsage(testCompanyAdmin.id, 'candidate_searches', 'company');
  const userCandidateUsage = await EntitlementService.getCurrentUsage(testUser.id, 'candidate_searches', 'user');

  assert(
    companyUsage === 15 && userCandidateUsage === 0,
    'Workspace Isolation: Company usage counters remain completely isolated from developer user counters',
    `Company: ${companyUsage}, User: ${userCandidateUsage}`
  );

  // ----------------------------------------------------
  // Test Group 7: Billing Provider Abstraction & Webhook Ingestion
  // ----------------------------------------------------
  console.log('\n📌 Group 7: Billing Provider Abstraction & Webhook Verification');

  const activeProvider = BillingProviderRegistry.getActiveProvider();
  assert(
    activeProvider.name === 'mock',
    'Provider Registry: Active billing provider is configured to Mock ($0 development mode)',
    `Active: ${activeProvider.name}`
  );

  const checkoutSession = await activeProvider.createCheckoutSession({
    targetId: testUser.id,
    targetType: 'user',
    planId: 'developer_pro',
    billingInterval: 'monthly',
    successUrl: 'http://localhost:3000/settings',
    cancelUrl: 'http://localhost:3000/settings',
  });

  assert(
    checkoutSession.sessionId.startsWith('cs_mock_') && checkoutSession.mode === 'demo_instant_success',
    'Checkout Session Abstraction: Generates instant demo checkout without live provider requirement',
    `Session: ${checkoutSession.sessionId}`
  );

  // Test Webhook HMAC Verification
  const signedWebhook = mockProvider.generateSignedTestWebhook(
    'billing.subscription.updated',
    { targetId: testUser.id, targetType: 'user', planId: 'developer_pro', status: 'active' },
    'whsec_mock_billing_secret_key'
  );

  const webhookResult = await BillingWebhookService.processWebhook(
    signedWebhook.payload,
    signedWebhook.signature,
    'mock',
    'whsec_mock_billing_secret_key'
  );

  assert(
    webhookResult.success === true && webhookResult.message.includes('billing.subscription.updated'),
    'Billing Webhook HMAC Processing: Successfully validates cryptographic signature and upgrades state',
    `Result: ${webhookResult.message}`
  );

  // Test Tampered / Bad Signature Rejection
  const badWebhookResult = await BillingWebhookService.processWebhook(
    signedWebhook.payload,
    'invalid_tampered_signature_hex',
    'mock',
    'whsec_mock_billing_secret_key'
  );

  assert(
    badWebhookResult.success === false && badWebhookResult.message.includes('Invalid HMAC'),
    'Security Integrity: Rejects webhooks with forged or invalid signatures',
    `Message: ${badWebhookResult.message}`
  );

  // ----------------------------------------------------
  // Test Group 8: Credibility Separation Guarantee
  // ----------------------------------------------------
  console.log('\n📌 Group 8: Capability & Trust Score Zero-Impact Verification');

  // Verify that Trust Score calculation NEVER references subscription tier
  const baselineTrust = await TrustCalculatorService.calculateUserTrustScore(testUser.id);
  
  // Temporarily promote to enterprise plan
  await EntitlementService.updateSubscription(testUser.id, 'enterprise', 'active', 'user');
  const paidTrust = await TrustCalculatorService.calculateUserTrustScore(testUser.id);

  assert(
    baselineTrust.overallScore === paidTrust.overallScore &&
    baselineTrust.categoryScores.codeQuality === paidTrust.categoryScores.codeQuality &&
    baselineTrust.confidence === paidTrust.confidence,
    'Credibility Guarantee: Plan tier has 0.0% impact on Trust Scores, DCC level, or capability ratings',
    `Free Score: ${baselineTrust.overallScore}, Enterprise Score: ${paidTrust.overallScore}`
  );

  // Restore test user to free plan
  await EntitlementService.updateSubscription(testUser.id, 'free', 'active', 'user');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 PHASE 39 BILLING TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================\n');

  if (passed === total) {
    console.log('🎉 ALL PHASE 39 BILLING & ENTITLEMENT TESTS PASSED PERFECTLY!\n');
  } else {
    throw new Error(`Billing test suite failed: ${total - passed} assertion(s) failed.`);
  }

  return { passed, total };
}

// Run standalone if invoked directly
if (process.argv[1]?.includes('test-billing-engine')) {
  runBillingEngineTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
