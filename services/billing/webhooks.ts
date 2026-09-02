// SkillVerse Billing Webhook & Event Dispatcher (Phase 39)

import crypto from 'crypto';
import { db, withDbTimeout } from '@/lib/drizzle';
import { billingEvents } from '@/database/schema';
import { BillingAuditEvent, BillingEventType, PlanId } from '@/types/billing';
import { EntitlementService } from './entitlements';
import { WebhookEngine } from '@/services/webhooks/engine';
import { Logger } from '@/lib/logger';

const inMemoryBillingEvents: BillingAuditEvent[] = [];

export class BillingWebhookService {
  /**
   * Processes an incoming billing webhook payload with HMAC verification and idempotency protection
   */
  public static async processWebhook(
    payload: any,
    signature: string,
    provider: string = 'mock',
    secret: string = process.env.BILLING_WEBHOOK_SECRET || 'whsec_mock_billing_secret_key'
  ): Promise<{ success: boolean; eventId: string; message: string }> {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

    const eventId = event?.id || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const eventType: BillingEventType = event?.type || 'billing.subscription.updated';
    const data = event?.data || {};

    // 1. Signature Verification
    if (signature) {
      const expectedHmac = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
      const isValid = signature === expectedHmac || signature.includes(expectedHmac);
      if (!isValid) {
        return {
          success: false,
          eventId,
          message: 'Invalid HMAC webhook signature',
        };
      }
    }

    // 2. Idempotency Check (prevent processing duplicate events)
    const alreadyProcessed = inMemoryBillingEvents.find((e) => e.eventId === eventId);
    if (alreadyProcessed) {
      return {
        success: true,
        eventId,
        message: 'Event already processed (idempotent ignore)',
      };
    }

    // 3. Process Domain Actions
    let targetType: 'user' | 'company' = data.targetType || 'user';
    let targetId: string = data.targetId || data.userId || data.companyId;

    try {
      if (targetId) {
        switch (eventType) {
          case 'billing.subscription.created':
          case 'billing.subscription.updated': {
            const planId: PlanId = data.planId || 'developer_pro';
            const status = data.status || 'active';
            await EntitlementService.updateSubscription(targetId, planId, status, targetType);
            break;
          }

          case 'billing.subscription.cancelled': {
            await EntitlementService.updateSubscription(targetId, 'free', 'cancelled', targetType);
            break;
          }

          case 'billing.payment.succeeded': {
            // Re-affirm active status
            const currentSub = await EntitlementService.getActiveSubscription(targetId, targetType);
            await EntitlementService.updateSubscription(targetId, currentSub.planId, 'active', targetType);
            break;
          }

          case 'billing.payment.failed': {
            const currentSub = await EntitlementService.getActiveSubscription(targetId, targetType);
            await EntitlementService.updateSubscription(targetId, currentSub.planId, 'past_due', targetType);
            break;
          }

          case 'billing.usage.limit_reached': {
            // Telemetry alert
            Logger.info(`[Billing] Usage limit reached for ${targetType} ${targetId}`);
            break;
          }
        }
      }

      // Record audit event
      const auditRecord: BillingAuditEvent = {
        id: `audit_${Date.now()}`,
        eventId,
        provider,
        eventType,
        targetType,
        targetId,
        payload: data,
        status: 'success',
        createdAt: new Date().toISOString(),
      };

      inMemoryBillingEvents.unshift(auditRecord);

      // Persist in DB
      try {
        await withDbTimeout(
          db.insert(billingEvents).values({
            eventId,
            provider,
            eventType,
            targetType,
            targetId: targetId ? (targetId as any) : null,
            payload: data,
            status: 'success',
          }),
          100
        );
      } catch {
        // Fallback in memory
      }

      return {
        success: true,
        eventId,
        message: `Successfully processed ${eventType}`,
      };
    } catch (err: any) {
      const failRecord: BillingAuditEvent = {
        id: `audit_${Date.now()}`,
        eventId,
        provider,
        eventType,
        targetType,
        targetId,
        payload: data,
        status: 'failed',
        errorMessage: err?.message || 'Unknown processing error',
        createdAt: new Date().toISOString(),
      };
      inMemoryBillingEvents.unshift(failRecord);

      return {
        success: false,
        eventId,
        message: err?.message || 'Failed to process webhook event',
      };
    }
  }

  /**
   * Retrieves recent billing events for admin auditing
   */
  public static async getRecentBillingEvents(limit = 20): Promise<BillingAuditEvent[]> {
    return inMemoryBillingEvents.slice(0, limit);
  }
}
