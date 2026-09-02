// SkillVerse Server-Side Entitlement & Usage Service (Phase 39)

import { db, withDbTimeout } from '@/lib/drizzle';
import { subscriptions, usageCounters, users, companies } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import {
  PlanId,
  EntitlementKey,
  EntitlementValue,
  EntitlementCheckResult,
  UsageMetric,
  UsageSummary,
  SubscriptionRecord,
  SubscriptionStatus,
  MetricUsageItem,
} from '@/types/billing';
import { PlanService, PLANS } from './plans';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS, DUMMY_COMPANIES } from '@/lib/dummyData';

// In-memory fallback stores for high-speed zero-timeout execution & test isolation
const inMemorySubscriptions = new Map<string, SubscriptionRecord>();
const inMemoryUsage = new Map<string, { [metric: string]: number }>();

// Preseed demo subscriptions
(function seedDefaultSubscriptions() {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Siddharth Kadbhane: Free Developer Tier
  inMemorySubscriptions.set(`user:${DUMMY_USERS[0].id}`, {
    id: 'sub_seed_user_001',
    targetType: 'user',
    targetId: DUMMY_USERS[0].id,
    planId: 'free',
    status: 'active',
    provider: 'mock',
    providerCustomerId: 'cus_mock_siddharth',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Hyperion AI / Marcus Vance: Company Plan
  inMemorySubscriptions.set(`company:${DUMMY_USERS[4].id}`, {
    id: 'sub_seed_company_001',
    targetType: 'company',
    targetId: DUMMY_USERS[4].id,
    planId: 'company',
    status: 'active',
    provider: 'mock',
    providerCustomerId: 'cus_mock_hyperion',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Seed sample usage
  inMemoryUsage.set(`user:${DUMMY_USERS[0].id}`, {
    repository_analyses: 3,
    ai_reviews: 2,
    api_requests: 48,
    challenge_evaluations: 1,
    export_operations: 0,
    candidate_searches: 0,
  });

  inMemoryUsage.set(`company:${DUMMY_USERS[4].id}`, {
    repository_analyses: 12,
    ai_reviews: 8,
    api_requests: 340,
    challenge_evaluations: 3,
    export_operations: 2,
    candidate_searches: 45,
  });
})();

export class EntitlementService {
  /**
   * Resolves the current active subscription for a target user or company workspace
   */
  public static async getActiveSubscription(
    targetId: string,
    targetType: 'user' | 'company' = 'user'
  ): Promise<SubscriptionRecord> {
    const key = `${targetType}:${targetId}`;

    // Try DB first with timeout
    try {
      const dbSub = await withDbTimeout(
        db.query.subscriptions.findFirst({
          where: and(
            eq(subscriptions.targetId, targetId),
            eq(subscriptions.targetType, targetType)
          ),
        }),
        100
      );

      if (dbSub) {
        return {
          id: dbSub.id,
          targetType: dbSub.targetType as 'user' | 'company',
          targetId: dbSub.targetId,
          planId: dbSub.planId as PlanId,
          status: dbSub.status as SubscriptionStatus,
          provider: dbSub.provider as any,
          providerCustomerId: dbSub.providerCustomerId,
          providerSubscriptionId: dbSub.providerSubscriptionId,
          currentPeriodStart: dbSub.currentPeriodStart.toISOString(),
          currentPeriodEnd: dbSub.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: dbSub.cancelAtPeriodEnd,
          metadata: (dbSub.metadata as any) || {},
          createdAt: dbSub.createdAt.toISOString(),
          updatedAt: dbSub.updatedAt.toISOString(),
        };
      }
    } catch {
      // Use fallback
    }

    // Check memory store
    const memSub = inMemorySubscriptions.get(key);
    if (memSub) return memSub;

    // Default fallback to Free plan
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const defaultSub: SubscriptionRecord = {
      id: `sub_default_${targetId.slice(0, 8)}`,
      targetType,
      targetId,
      planId: targetType === 'company' ? 'company' : 'free',
      status: 'active',
      provider: 'mock',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    inMemorySubscriptions.set(key, defaultSub);
    return defaultSub;
  }

  /**
   * Updates or upgrades a subscription (server-side only)
   */
  public static async updateSubscription(
    targetId: string,
    planId: PlanId,
    status: SubscriptionStatus = 'active',
    targetType: 'user' | 'company' = 'user'
  ): Promise<SubscriptionRecord> {
    const key = `${targetType}:${targetId}`;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updatedSub: SubscriptionRecord = {
      id: `sub_${Date.now()}_${targetId.slice(0, 6)}`,
      targetType,
      targetId,
      planId,
      status,
      provider: 'mock',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    inMemorySubscriptions.set(key, updatedSub);

    try {
      await withDbTimeout(
        db
          .insert(subscriptions)
          .values({
            targetType,
            targetId,
            planId,
            status,
            provider: 'mock',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [subscriptions.targetType, subscriptions.targetId],
            set: {
              planId,
              status,
              updatedAt: now,
            },
          }),
        150
      );
    } catch {
      // Handled in memory
    }

    return updatedSub;
  }

  /**
   * Main Feature Gating Method: canUseFeature / checkEntitlement
   * Deterministically evaluates plan, current usage, and limits.
   */
  public static async checkEntitlement(
    targetId: string,
    featureKey: EntitlementKey,
    targetType: 'user' | 'company' = 'user',
    userRole?: string
  ): Promise<EntitlementCheckResult> {
    // Admin role bypass
    if (userRole === 'admin') {
      return {
        allowed: true,
        feature: featureKey,
        planId: 'enterprise',
        isUnlimited: true,
        reason: 'Admin access privilege',
      };
    }

    const subscription = await this.getActiveSubscription(targetId, targetType);
    const plan = PlanService.getPlan(subscription.planId);
    const limit = plan.entitlements[featureKey];

    // Boolean features
    if (typeof limit === 'boolean') {
      return {
        allowed: limit,
        feature: featureKey,
        planId: plan.id,
        limit,
        reason: limit ? undefined : `Feature "${featureKey}" requires an upgraded plan (${plan.name} has no access)`,
      };
    }

    // String / Array features (e.g. export_formats, career_insights_depth)
    if (typeof limit === 'string' || Array.isArray(limit)) {
      return {
        allowed: true,
        feature: featureKey,
        planId: plan.id,
        limit,
      };
    }

    // Numerical limits (e.g. repository_analyses, api_monthly_requests, candidate_searches)
    if (typeof limit === 'number') {
      // -1 means unlimited
      if (limit === -1) {
        return {
          allowed: true,
          feature: featureKey,
          planId: plan.id,
          limit: -1,
          isUnlimited: true,
        };
      }

      // Map entitlement key to usage metric
      const metric = this.mapEntitlementToMetric(featureKey);
      const currentUsage = await this.getCurrentUsage(targetId, metric, targetType);
      const remaining = Math.max(0, limit - currentUsage);
      const allowed = currentUsage < limit;

      return {
        allowed,
        feature: featureKey,
        planId: plan.id,
        currentUsage,
        limit,
        remaining,
        resetsAt: subscription.currentPeriodEnd,
        reason: allowed
          ? undefined
          : `Monthly quota reached for ${featureKey} (${currentUsage}/${limit}). Resets on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`,
      };
    }

    return {
      allowed: false,
      feature: featureKey,
      planId: plan.id,
      reason: `Unknown entitlement "${featureKey}"`,
    };
  }

  /**
   * Records resource usage (increments the counter for current period)
   */
  public static async recordUsage(
    targetId: string,
    metric: UsageMetric,
    amount: number = 1,
    targetType: 'user' | 'company' = 'user'
  ): Promise<{ metric: UsageMetric; newTotal: number; periodEnd: string }> {
    const key = `${targetType}:${targetId}`;
    const userUsage = inMemoryUsage.get(key) || {
      repository_analyses: 0,
      ai_reviews: 0,
      api_requests: 0,
      challenge_evaluations: 0,
      export_operations: 0,
      candidate_searches: 0,
    };

    userUsage[metric] = (userUsage[metric] || 0) + amount;
    inMemoryUsage.set(key, userUsage);

    const subscription = await this.getActiveSubscription(targetId, targetType);

    // Also persist in DB asynchronously
    try {
      const now = new Date();
      await withDbTimeout(
        db
          .insert(usageCounters)
          .values({
            targetType,
            targetId,
            metric,
            periodStart: new Date(subscription.currentPeriodStart),
            periodEnd: new Date(subscription.currentPeriodEnd),
            count: userUsage[metric],
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [usageCounters.targetType, usageCounters.targetId, usageCounters.metric, usageCounters.periodStart],
            set: {
              count: userUsage[metric],
              updatedAt: now,
            },
          }),
        100
      );
    } catch {
      // Memory store updated safely
    }

    return {
      metric,
      newTotal: userUsage[metric],
      periodEnd: subscription.currentPeriodEnd,
    };
  }

  /**
   * Retrieves current metric usage for an entity
   */
  public static async getCurrentUsage(
    targetId: string,
    metric: UsageMetric,
    targetType: 'user' | 'company' = 'user'
  ): Promise<number> {
    const key = `${targetType}:${targetId}`;
    const userUsage = inMemoryUsage.get(key);
    if (userUsage && typeof userUsage[metric] === 'number') {
      return userUsage[metric];
    }
    return 0;
  }

  /**
   * Resets usage for a new period (useful for billing cycle rollover and test suites)
   */
  public static async resetUsagePeriod(
    targetId: string,
    targetType: 'user' | 'company' = 'user'
  ): Promise<void> {
    const key = `${targetType}:${targetId}`;
    inMemoryUsage.set(key, {
      repository_analyses: 0,
      ai_reviews: 0,
      api_requests: 0,
      challenge_evaluations: 0,
      export_operations: 0,
      candidate_searches: 0,
    });
  }

  /**
   * Generates a complete usage and quota summary
   */
  public static async getUsageSummary(
    targetId: string,
    targetType: 'user' | 'company' = 'user'
  ): Promise<UsageSummary> {
    const subscription = await this.getActiveSubscription(targetId, targetType);
    const plan = PlanService.getPlan(subscription.planId);

    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 3600 * 24)));

    const METRIC_CONFIGS: { metric: UsageMetric; label: string; unit: string; entitlementKey: EntitlementKey }[] = [
      { metric: 'repository_analyses', label: 'Repository AST Analyses', unit: 'analyses', entitlementKey: 'repository_analyses' },
      { metric: 'ai_reviews', label: 'AI Architecture Reviews', unit: 'reviews', entitlementKey: 'advanced_ai_reviews' },
      { metric: 'api_requests', label: 'Developer API Requests', unit: 'calls', entitlementKey: 'api_monthly_requests' },
      { metric: 'candidate_searches', label: 'Candidate Profile Searches', unit: 'searches', entitlementKey: 'candidate_searches' },
      { metric: 'challenge_evaluations', label: 'Challenge Evaluations', unit: 'evaluations', entitlementKey: 'challenge_creation' },
      { metric: 'export_operations', label: 'Evidence & DCC Exports', unit: 'exports', entitlementKey: 'export_formats' },
    ];

    const metricsRecord: Record<UsageMetric, MetricUsageItem> = {} as any;
    let hasExceededAny = false;

    for (const conf of METRIC_CONFIGS) {
      const used = await this.getCurrentUsage(targetId, conf.metric, targetType);
      const rawLimit = plan.entitlements[conf.entitlementKey];
      const limit = typeof rawLimit === 'number' ? (rawLimit === -1 ? 'unlimited' : rawLimit) : 'unlimited';

      let percentageUsed = 0;
      let isExceeded = false;

      if (typeof limit === 'number' && limit > 0) {
        percentageUsed = Math.min(100, Math.round((used / limit) * 100));
        isExceeded = used >= limit;
        if (isExceeded) hasExceededAny = true;
      }

      metricsRecord[conf.metric] = {
        metric: conf.metric,
        label: conf.label,
        used,
        limit,
        unit: conf.unit,
        percentageUsed,
        isExceeded,
        resetsAt: subscription.currentPeriodEnd,
      };
    }

    return {
      targetId,
      targetType,
      planId: plan.id,
      period: {
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        daysRemaining,
      },
      metrics: metricsRecord,
      hasExceededAnyLimit: hasExceededAny,
    };
  }

  private static mapEntitlementToMetric(feature: EntitlementKey): UsageMetric {
    switch (feature) {
      case 'repository_analyses':
        return 'repository_analyses';
      case 'advanced_ai_reviews':
        return 'ai_reviews';
      case 'api_monthly_requests':
        return 'api_requests';
      case 'candidate_searches':
        return 'candidate_searches';
      case 'challenge_creation':
        return 'challenge_evaluations';
      default:
        return 'api_requests';
    }
  }
}
