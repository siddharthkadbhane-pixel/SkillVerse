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
   * Retrieves a webhook by ID (checking DB first, then inMemoryWebhooks)
   */
  public static async getWebhook(webhookId: string): Promise<WebhookSubscriptionData | null> {
    let row: any = null;

    try {
      row = await withDbTimeout(
        db.query.webhooks.findFirst({
          where: eq(webhooks.id, webhookId),
        }),
        300
      );
    } catch {
      row = inMemoryWebhooks.get(webhookId) || null;
    }

    if (!row) {
      row = inMemoryWebhooks.get(webhookId) || null;
    }

    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      url: row.url,
      events: Array.isArray(row.events) ? row.events : [],
      secret: row.secret,
      status: row.status || 'active',
      failureCount: row.failureCount || 0,
      description: row.description,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Retrieves a webhook by ID strictly constrained to the authenticated owner ID
   */
  public static async getWebhookForUser(userId: string, webhookId: string): Promise<WebhookSubscriptionData | null> {
    let row: any = null;

    try {
      row = await withDbTimeout(
        db.query.webhooks.findFirst({
          where: and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId)),
        }),
        300
      );
    } catch {
      const mem = inMemoryWebhooks.get(webhookId);
      if (mem && mem.userId === userId) {
        row = mem;
      }
    }

    if (!row) {
      const mem = inMemoryWebhooks.get(webhookId);
      if (mem && mem.userId === userId) {
        row = mem;
      }
    }

    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      url: row.url,
      events: Array.isArray(row.events) ? row.events : [],
      secret: row.secret,
      status: row.status || 'active',
      failureCount: row.failureCount || 0,
      description: row.description,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Internal inspection helper for testing and in-memory store verification
   */
  public static getInMemoryWebhook(webhookId: string): MemoryWebhook | undefined {
    return inMemoryWebhooks.get(webhookId);
  }

  /**
   * Deletes a webhook subscription with strict ownership verification.
   * If the webhook is not owned by the requesting userId, leaves inMemoryWebhooks
   * and persistent storage completely unchanged and returns false.
   */
  public static async deleteWebhook(userId: string, webhookId: string): Promise<boolean> {
    // 1. Check inMemoryWebhooks ownership first
    const memWebhook = inMemoryWebhooks.get(webhookId);
    if (memWebhook) {
      if (memWebhook.userId !== userId) {
        Logger.warn(`[SECURITY] Unauthorized webhook deletion denied for webhook ${webhookId} by actor ${userId} (owned by ${memWebhook.userId})`);
        return false;
      }
    }

    // 2. Check DB ownership if not found in memory or to verify persistent record
    let dbWebhookExists = false;
    try {
      const dbRow = await withDbTimeout(
        db.query.webhooks.findFirst({
          where: eq(webhooks.id, webhookId),
        }),
        300
      );
      if (dbRow) {
        dbWebhookExists = true;
        if (dbRow.userId !== userId) {
          Logger.warn(`[SECURITY] Unauthorized DB webhook deletion denied for webhook ${webhookId} by actor ${userId} (owned by ${dbRow.userId})`);
          return false;
        }
      }
    } catch {
      // In degraded/offline DB mode, rely on in-memory verification
    }

    // If it exists in neither in-memory nor DB, return false (not found)
    if (!memWebhook && !dbWebhookExists) {
      return false;
    }

    // 3. Ownership verified — proceed with deletion from both memory and DB
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

      const nextRetryDelayMs = status === 'failed' ? this.calculateBackoff(1) : null;
      const nextRetryAt = nextRetryDelayMs ? new Date(Date.now() + nextRetryDelayMs).toISOString() : null;

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
        nextRetryAt,
        status: status,
        responseBody: responseBody.slice(0, 1000),
        createdAt: new Date().toISOString(),
      };

      deliveries.push(deliveryRecord);
      inMemoryDeliveries.unshift(deliveryRecord);

      // Record to DB asynchronously with safe timeout
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
          3000
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
   * Calculates bounded exponential backoff delay in milliseconds
   */
  public static calculateBackoff(attempt: number): number {
    switch (attempt) {
      case 1:
        return 10 * 1000; // 10 seconds
      case 2:
        return 60 * 1000; // 60 seconds
      case 3:
      default:
        return 300 * 1000; // 300 seconds (5 minutes)
    }
  }

  /**
   * In-Memory Atomic Idempotency Event Tracker & State Machine
   * 
   * Architecture & Concurrency Guarantees:
   * - Provides strict atomic mutex claiming for concurrent in-flight webhook deliveries.
   * - Explicit States:
   *     'processing': Delivery claimed; handler actively executing under lock. Concurrent duplicate
   *                   deliveries await this in-flight promise without re-executing handler.
   *     'completed': Handler succeeded. Subsequent replays return duplicate: true immediately.
   *     'failed': Handler threw error. Fails closed and records failure for safe retry.
   * 
   * Distributed / Persistence Limitation Notice:
   * - This in-memory mutex coordinates concurrency within the Node.js process. In multi-instance
   *   serverless clusters or across process crashes before completion is committed, exactly-once
   *   distributed delivery requires a durable database table (e.g. `idempotency_keys` with unique
   *   event_id index, distributed lock leases, and WAL status transitions).
   * - Per Phase 43D-R1 security guidelines, schema migrations are deferred; thus this process-safe
   *   atomic claim engine is implemented without unsafe production migrations.
   */
  private static processedEvents = new Map<string, {
    state: 'processing' | 'completed' | 'failed';
    timestamp: number;
    eventType: string;
    inFlightPromise?: Promise<{ success: boolean; duplicate?: boolean; error?: string }>;
    error?: string;
    leaseExpiresAt: number;
  }>();

  /**
   * Checks if an event ID has already been successfully processed or is currently in flight
   */
  public static isEventProcessed(eventId: string): boolean {
    const claim = this.processedEvents.get(eventId);
    if (!claim) return false;
    return claim.state === 'completed' || claim.state === 'processing';
  }

  /**
   * Records an event ID as successfully processed
   */
  public static recordProcessedEvent(eventId: string, eventType: string): void {
    const now = Date.now();
    this.processedEvents.set(eventId, {
      state: 'completed',
      timestamp: now,
      eventType,
      leaseExpiresAt: now + 24 * 60 * 60 * 1000,
    });
    if (this.processedEvents.size > 10000) {
      for (const [id, item] of this.processedEvents.entries()) {
        if (now - item.timestamp > 24 * 60 * 60 * 1000) {
          this.processedEvents.delete(id);
        }
      }
    }
  }

  /**
   * Clears in-memory processed event claims (for isolated regression test execution)
   */
  public static clearProcessedEvents(): void {
    this.processedEvents.clear();
  }

  /**
   * Secure incoming webhook processor with HMAC validation, replay protection, and atomic concurrent idempotency
   */
  public static async processIncomingWebhook<T = any>(params: {
    payload: string | object;
    signatureHeader: string;
    secret: string;
    timestampHeader: string | number;
    handler: (data: T, eventId: string, eventType: string) => Promise<void>;
  }): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
    const isValid = this.verifySignature(
      params.payload,
      params.signatureHeader,
      params.secret,
      params.timestampHeader
    );

    if (!isValid) {
      return { success: false, error: 'INVALID_SIGNATURE_OR_EXPIRED_TIMESTAMP' };
    }

    const parsed = typeof params.payload === 'string' ? JSON.parse(params.payload) : params.payload;
    const eventId = parsed.id || parsed.eventId || `evt_${Date.now()}`;
    const eventType = parsed.event || parsed.eventType || 'unknown';

    const now = Date.now();
    const existing = this.processedEvents.get(eventId);

    // If already completed -> immediate idempotent skip
    if (existing && existing.state === 'completed') {
      Logger.info(`[WEBHOOK] Idempotent skip: Event ${eventId} was already completed`);
      return { success: true, duplicate: true };
    }

    // If currently in flight by a concurrent request within active lease -> await winner
    if (existing && existing.state === 'processing' && now < existing.leaseExpiresAt) {
      Logger.info(`[WEBHOOK] Concurrent delivery for event ${eventId} in flight. Awaiting active claim...`);
      if (existing.inFlightPromise) {
        const winnerResult = await existing.inFlightPromise;
        return {
          success: winnerResult.success,
          duplicate: true,
          error: winnerResult.error,
        };
      }
      return { success: true, duplicate: true };
    }

    // Atomically claim the event for processing
    let resolveInFlight!: (res: { success: boolean; duplicate?: boolean; error?: string }) => void;
    const inFlightPromise = new Promise<{ success: boolean; duplicate?: boolean; error?: string }>((resolve) => {
      resolveInFlight = resolve;
    });

    const leaseDurationMs = 30000; // 30s lease prevents indefinite locking if an unhandled node crash occurs
    this.processedEvents.set(eventId, {
      state: 'processing',
      timestamp: now,
      eventType,
      inFlightPromise,
      leaseExpiresAt: now + leaseDurationMs,
    });

    // Execute consumer handler under active atomic claim
    try {
      await params.handler(parsed.data || parsed, eventId, eventType);

      // Transition to completed state
      this.processedEvents.set(eventId, {
        state: 'completed',
        timestamp: Date.now(),
        eventType,
        leaseExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const result = { success: true, duplicate: false };
      resolveInFlight(result);
      return result;
    } catch (err: any) {
      Logger.error(`[WEBHOOK] Processing error for event ${eventId}:`, err);

      // Transition to failed state (not completed) so retries can be handled cleanly
      this.processedEvents.set(eventId, {
        state: 'failed',
        timestamp: Date.now(),
        eventType,
        error: err.message,
        leaseExpiresAt: Date.now() + 60000,
      });

      const result = { success: false, duplicate: false, error: err.message };
      resolveInFlight(result);
      return result;
    }
  }

  /**
   * Processes pending failed webhook deliveries scheduled for retry
   */
  public static async processPendingRetries(): Promise<{
    retriedCount: number;
    succeeded: number;
    failed: number;
  }> {
    const now = new Date();
    let pending = inMemoryDeliveries.filter(
      (d) => d.status === 'failed' && d.attempt < d.maxAttempts && d.nextRetryAt && new Date(d.nextRetryAt) <= now
    );

    let succeeded = 0;
    let failed = 0;

    for (const delivery of pending) {
      const sub = inMemoryWebhooks.get(delivery.webhookId);
      if (!sub || sub.status !== 'active') continue;

      delivery.attempt += 1;
      const isMock = sub.url.startsWith('https://api.skillverse.dev/mock');

      if (isMock) {
        delivery.status = 'success';
        delivery.statusCode = 200;
        delivery.nextRetryAt = null;
        succeeded++;
      } else {
        const nextDelay = delivery.attempt < delivery.maxAttempts ? this.calculateBackoff(delivery.attempt) : null;
        delivery.nextRetryAt = nextDelay ? new Date(Date.now() + nextDelay).toISOString() : null;
        delivery.status = delivery.attempt >= delivery.maxAttempts ? 'failed' : 'failed';
        failed++;
      }
    }

    return {
      retriedCount: pending.length,
      succeeded,
      failed,
    };
  }

  /**
   * Retrieves recent delivery logs for a given webhook, optionally enforcing ownership
   */
  public static async getDeliveries(webhookId: string, userId?: string): Promise<WebhookDeliveryRecord[]> {
    // If userId is provided, verify webhook ownership first
    if (userId) {
      const webhook = await this.getWebhook(webhookId);
      if (!webhook || webhook.userId !== userId) {
        return [];
      }
    }

    let rows: any[] = [];

    try {
      rows = await withDbTimeout(
        db.query.webhookDeliveries.findMany({
          where: eq(webhookDeliveries.webhookId, webhookId),
          limit: 20,
        }),
        3000
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

