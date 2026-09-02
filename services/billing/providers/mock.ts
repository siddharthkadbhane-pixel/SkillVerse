// SkillVerse Mock / Development Billing Provider (Phase 39)

import crypto from 'crypto';
import {
  BillingProvider,
  BillingProviderRegistry,
} from './base';
import {
  CreateCustomerParams,
  CreateCheckoutParams,
  CheckoutSessionResult,
  SubscriptionDetails,
  BillingWebhookEventResult,
  PlanId,
} from '@/types/billing';
import { PLANS } from '../plans';

export class MockBillingProvider implements BillingProvider {
  public readonly name = 'mock';

  private mockSubscriptions = new Map<string, SubscriptionDetails>();
  private mockCustomers = new Map<string, { customerId: string; email: string }>();

  public async createCustomer(params: CreateCustomerParams): Promise<{ customerId: string; email: string }> {
    const customerId = `cus_mock_${params.targetId.slice(0, 8)}_${Date.now().toString().slice(-4)}`;
    const record = { customerId, email: params.email };
    this.mockCustomers.set(params.targetId, record);
    return record;
  }

  public async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const sessionId = `cs_mock_${crypto.randomBytes(8).toString('hex')}`;
    const plan = PLANS[params.planId] || PLANS.free;

    return {
      sessionId,
      checkoutUrl: `/settings?billing_status=mock_checkout_success&plan=${params.planId}&session_id=${sessionId}`,
      mode: 'demo_instant_success',
      expiresAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
      planId: plan.id,
    };
  }

  public async getSubscription(subscriptionId: string): Promise<SubscriptionDetails | null> {
    const existing = this.mockSubscriptions.get(subscriptionId);
    if (existing) return existing;

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return {
      id: subscriptionId,
      status: 'active',
      planId: 'free',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  public async cancelSubscription(
    subscriptionId: string,
    atPeriodEnd: boolean = true
  ): Promise<SubscriptionDetails> {
    const sub = await this.getSubscription(subscriptionId);
    const updated: SubscriptionDetails = {
      ...(sub || {
        id: subscriptionId,
        status: 'active',
        planId: 'free',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      }),
      status: atPeriodEnd ? 'active' : 'cancelled',
      cancelAtPeriodEnd: atPeriodEnd,
    };
    this.mockSubscriptions.set(subscriptionId, updated);
    return updated;
  }

  public async handleWebhook(
    payload: any,
    signature: string,
    secret: string = 'whsec_mock_billing_secret_key'
  ): Promise<BillingWebhookEventResult> {
    // Verify mock HMAC signature
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    if (signature && signature !== expected && !signature.includes(expected)) {
      return {
        received: true,
        processed: false,
        eventType: payload?.type || 'unknown',
        error: 'Invalid webhook HMAC signature',
      };
    }

    return {
      received: true,
      processed: true,
      eventType: payload?.type || 'billing.event.generic',
      targetId: payload?.data?.targetId,
    };
  }

  /**
   * Helper to generate a valid test webhook payload and signature for test suites
   */
  public generateSignedTestWebhook(
    type: string,
    data: Record<string, any>,
    secret: string = 'whsec_mock_billing_secret_key'
  ): { payload: any; signature: string } {
    const payload = {
      id: `evt_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      type,
      timestamp: Math.floor(Date.now() / 1000),
      data,
    };
    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    return { payload, signature };
  }
}

// Auto-register Mock Provider as the default
const mockProvider = new MockBillingProvider();
BillingProviderRegistry.register(mockProvider);
BillingProviderRegistry.setActiveProvider('mock');
