import { RateLimitState } from '@/types/api';
import { DistributedRateLimiter, RateLimitTier as DistTier } from '@/services/security/distributedRateLimiter';

export type RateLimitTier = 'public' | 'authenticated' | 'heavy_analysis' | 'management';

export class ApiRateLimiter {
  private static readonly LIMITS: Record<RateLimitTier, { limit: number; windowSec: number }> = {
    public: { limit: 120, windowSec: 60 },
    authenticated: { limit: 300, windowSec: 60 },
    heavy_analysis: { limit: 10, windowSec: 60 },
    management: { limit: 30, windowSec: 60 },
  };

  private static localFallbackStore = new Map<string, { count: number; resetAt: number }>();
  private static cleanupTimer: NodeJS.Timeout | null = null;

  static {
    // Non-blocking cleanup timer
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.localFallbackStore.entries()) {
        if (now > bucket.resetAt) {
          this.localFallbackStore.delete(key);
        }
      }
    }, 30000);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Synchronous evaluation against sliding window rate limit
   */
  public static check(
    identifier: string,
    tier: RateLimitTier = 'authenticated'
  ): RateLimitState & { headers: Record<string, string> } {
    const res = DistributedRateLimiter.checkSync(identifier, tier as DistTier);
    return {
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
      isExceeded: !res.allowed,
      headers: res.headers,
    };
  }

  /**
   * Asynchronous distributed check across shared instances
   */
  public static async checkDistributed(
    identifier: string,
    tier: RateLimitTier = 'authenticated'
  ) {
    return DistributedRateLimiter.check(identifier, tier as DistTier);
  }

  /**
   * Resets rate limit for a specific identifier (useful for test suites)
   */
  public static reset(identifier: string, tier?: RateLimitTier): void {
    if (tier) {
      this.localFallbackStore.delete(`${tier}:${identifier}`);
      DistributedRateLimiter.reset(identifier, tier as DistTier).catch(() => {});
    } else {
      for (const t of Object.keys(this.LIMITS) as RateLimitTier[]) {
        this.localFallbackStore.delete(`${t}:${identifier}`);
      }
      DistributedRateLimiter.reset(identifier).catch(() => {});
    }
  }
}

