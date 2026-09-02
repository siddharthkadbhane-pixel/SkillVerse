import crypto from 'crypto';
import { db, withDbTimeout } from '@/lib/drizzle';
import { webhooks, webhookDeliveries } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { WebhookEventType, WebhookSubscriptionData, WebhookDeliveryRecord } from '@/types/api';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';

interface MemoryWebhook {
  id: string;
  userId: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  status: 'active' | 'disabled' | 'failing';
  failureCount: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const inMemoryWebhooks = new Map<string, MemoryWebhook>();
const inMemoryDeliveries: WebhookDeliveryRecord[] = [];

// Seed a default test webhook for Siddharth Kadbhane
(function seedDefaultWebhook() {
  const seedId = 'wh_seed_001';
  inMemoryWebhooks.set(seedId, {
    id: seedId,
    userId: DUMMY_USERS[0].id,
    url: 'https://api.skillverse.dev/mock-webhook-receiver',
    events: ['skill.verified', 'dcc.updated', 'repository.analyzed'],
    secret: 'whsec_seed_9f83a84b2c1e7d0f',
    status: 'active',
    failureCount: 0,
    description: 'Automated CI/CD Capability Integration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
})();

export class WebhookEngine {
  /**
   * Generates a cryptographic HMAC-SHA256 signature for webhook payload
   */
  public static generateSignature(payloadString: string, secret: string, timestamp: number): string {
    const signaturePayload = `${timestamp}.${payloadString}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signaturePayload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verifies an incoming webhook signature and checks timestamp tolerance (anti-replay)
   */
  public static verifySignature(
    payload: string | object,
    signatureHeader: string,
    secret: string,
    timestampHeader: string | number,
    toleranceSec = 300 // 5 minutes
  ): boolean {
    if (!signatureHeader || !secret || !timestampHeader) return false;

    const timestamp = typeof timestampHeader === 'string' ? parseInt(timestampHeader, 10) : timestampHeader;
    if (isNaN(timestamp)) return false;

    // Check freshness to prevent replay attacks
    const currentSec = Math.floor(Date.now() / 1000);
    if (Math.abs(currentSec - timestamp) > toleranceSec) {
      return false;
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = this.generateSignature(payloadString, secret, timestamp);

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Registers a new webhook subscription
   */
  public static async subscribe(
    userId: string,
    url: string,
    events: WebhookEventType[],
    description?: string
  ): Promise<WebhookSubscriptionData> {
    // Validate URL
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol.');
      }
    } catch {
      throw new Error('Invalid webhook target URL.');
    }

    if (!events || events.length === 0) {
      throw new Error('At least one webhook event must be selected.');
    }

    const webhookId = crypto.randomUUID();
    const secret = `whsec_${crypto.randomBytes(20).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const entry: MemoryWebhook = {
      id: webhookId,
      userId,
      url: url.trim(),
      events,
      secret,
      status: 'active',
      failureCount: 0,
      description: description?.trim() || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    inMemoryWebhooks.set(webhookId, entry);

    try {
      await withDbTimeout(
        db.insert(webhooks).values({
          id: webhookId,
          userId,
          url: entry.url,
          events: events as any,
          secret,
          status: 'active',
          failureCount: 0,
          description: entry.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      Logger.info(`Registered Webhook [${webhookId}] for user ${userId}`);
    } catch (err: any) {
      Logger.warn(`DB write skipped during Webhook creation: ${err.message}`);
    }

    return {
      id: webhookId,
      userId,
      url: entry.url,
      events,
      secret,
      status: 'active',
      failureCount: 0,
      description: entry.description,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  /**
   * Lists all webhooks for a specific user
   */
  public static async listWebhooks(userId: string): Promise<WebhookSubscriptionData[]> {
    let rows: any[] = [];

    try {
      rows = await withDbTimeout(
        db.query.webhooks.findMany({
          where: eq(webhooks.userId, userId),
        }),
        300
      );
    } catch {
      rows = Array.from(inMemoryWebhooks.values()).filter(w => w.userId === userId);
    }

    if (rows.length === 0) {
      rows = Array.from(inMemoryWebhooks.values()).filter(w => w.userId === userId);
    }

    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      url: r.url,
      events: Array.isArray(r.events) ? r.events : [],
      secret: r.secret,
      status: r.status || 'active',
      failureCount: r.failureCount || 0,
      description: r.description,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Deletes a webhook subscription
   */
  public static async deleteWebhook(userId: string, webhookId: string): Promise<boolean> {
    inMemoryWebhooks.delete(webhookId);

    try {
      await withDbTimeout(
        db.delete(webhooks).where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId))),
        300
      );
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Dispatches an event payload to all matching active webhook subscriptions
   */
  public static async dispatch(
    eventType: WebhookEventType,
    payload: any,
    targetUserId?: string
  ): Promise<{ dispatchedCount: number; deliveries: WebhookDeliveryRecord[] }> {
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const timestampSec = Math.floor(Date.now() / 1000);

    // Fetch active webhooks
    const allWebhooks = Array.from(inMemoryWebhooks.values()).filter(w => {
      if (w.status !== 'active') return false;
      if (targetUserId && w.userId !== targetUserId) return false;
      return w.events.includes(eventType);
    });

    const deliveries: WebhookDeliveryRecord[] = [];

    for (const sub of allWebhooks) {
      const deliveryId = `del_${crypto.randomUUID()}`;
      const payloadString = JSON.stringify({
        id: eventId,
        event: eventType,
        createdAt: new Date().toISOString(),
        data: payload,
      });

      const signature = this.generateSignature(payloadString, sub.secret, timestampSec);

      // Perform simulated or real bounded delivery
      let statusCode = 200;
      let durationMs = 45;
      let status: 'success' | 'failed' = 'success';
      let responseBody = '{"ok":true}';

      // For test/local endpoints or mocked URLs, simulate fast response
      if (!sub.url.startsWith('https://api.skillverse.dev/mock')) {
        try {
          const startTime = Date.now();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(sub.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SkillVerse-Event-Id': eventId,
              'X-SkillVerse-Event': eventType,
              'X-SkillVerse-Timestamp': timestampSec.toString(),
              'X-SkillVerse-Signature': signature,
              'X-SkillVerse-Delivery-Id': deliveryId,
            },
            body: payloadString,
            signal: controller.signal,
          });

          clearTimeout(timer);
          durationMs = Date.now() - startTime;
          statusCode = res.status;
          status = res.ok ? 'success' : 'failed';
          responseBody = await res.text().catch(() => '');
        } catch (err: any) {
          statusCode = 504;
          status = 'failed';
          responseBody = err.message || 'Connection timeout';
        }
      }

      const deliveryRecord: WebhookDeliveryRecord = {
        id: deliveryId,
        webhookId: sub.id,
        eventId,
        eventType,
        payload,
        statusCode,
        durationMs,
        attempt: 1,
        maxAttempts: 3,
        nextRetryAt: status === 'failed' ? new Date(Date.now() + 1000).toISOString() : null,
        status: status,
        responseBody: responseBody.slice(0, 1000),
        createdAt: new Date().toISOString(),
      };

      deliveries.push(deliveryRecord);
      inMemoryDeliveries.unshift(deliveryRecord);

      // Record to DB asynchronously
      try {
        withDbTimeout(
          db.insert(webhookDeliveries).values({
            id: deliveryId,
            webhookId: sub.id,
            eventId,
            eventType,
            payload: payload as any,
            statusCode,
            durationMs,
            attempt: 1,
            maxAttempts: 3,
            nextRetryAt: deliveryRecord.nextRetryAt ? new Date(deliveryRecord.nextRetryAt) : null,
            status,
            responseBody: deliveryRecord.responseBody,
            createdAt: new Date(),
          }),
          250
        ).catch(() => {});
      } catch {}
    }

    Logger.info(`Dispatched webhook event [${eventType}] to ${deliveries.length} subscribers (Event ID: ${eventId})`);

    return {
      dispatchedCount: deliveries.length,
      deliveries,
    };
  }

  /**
   * Retrieves recent delivery logs for a given webhook
   */
  public static async getDeliveries(webhookId: string): Promise<WebhookDeliveryRecord[]> {
    let rows: any[] = [];

    try {
      rows = await withDbTimeout(
        db.query.webhookDeliveries.findMany({
          where: eq(webhookDeliveries.webhookId, webhookId),
          limit: 20,
        }),
        300
      );
    } catch {
      rows = inMemoryDeliveries.filter(d => d.webhookId === webhookId);
    }

    if (rows.length === 0) {
      rows = inMemoryDeliveries.filter(d => d.webhookId === webhookId);
    }

    return rows.map((r: any) => ({
      id: r.id,
      webhookId: r.webhookId,
      eventId: r.eventId,
      eventType: r.eventType as WebhookEventType,
      statusCode: r.statusCode,
      durationMs: r.durationMs,
      attempt: r.attempt,
      maxAttempts: r.maxAttempts,
      nextRetryAt: r.nextRetryAt ? new Date(r.nextRetryAt).toISOString() : null,
      status: r.status,
      responseBody: r.responseBody,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
  }
}
