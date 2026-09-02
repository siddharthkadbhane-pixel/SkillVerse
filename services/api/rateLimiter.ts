import { RateLimitState } from '@/types/api';

export type RateLimitTier = 'public' | 'authenticated' | 'heavy_analysis' | 'management';

interface RateLimitBucket {
  count: number;
  resetAt: number; // Timestamp ms
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Periodic garbage collection for expired rate limit buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now > bucket.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export class ApiRateLimiter {
  private static readonly LIMITS: Record<RateLimitTier, { limit: number; windowSec: number }> = {
    public: { limit: 120, windowSec: 60 },
    authenticated: { limit: 300, windowSec: 60 },
    heavy_analysis: { limit: 10, windowSec: 60 },
    management: { limit: 30, windowSec: 60 },
  };

  /**
   * Evaluates request against sliding window rate limit
   */
  public static check(
    identifier: string,
    tier: RateLimitTier = 'authenticated'
  ): RateLimitState & { headers: Record<string, string> } {
    const config = this.LIMITS[tier] || this.LIMITS.authenticated;
    const now = Date.now();
    const windowMs = config.windowSec * 1000;
    const bucketKey = `${tier}:${identifier}`;

    let bucket = rateLimitStore.get(bucketKey);

    if (!bucket || now > bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(bucketKey, bucket);
    } else {
      bucket.count += 1;
    }

    const isExceeded = bucket.count > config.limit;
    const remaining = Math.max(0, config.limit - bucket.count);
    const resetSeconds = Math.ceil(bucket.resetAt / 1000);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': config.limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetSeconds.toString(),
    };

    return {
      limit: config.limit,
      remaining,
      reset: resetSeconds,
      isExceeded,
      headers,
    };
  }

  /**
   * Resets rate limit for a specific identifier (useful for test suites)
   */
  public static reset(identifier: string, tier?: RateLimitTier): void {
    if (tier) {
      rateLimitStore.delete(`${tier}:${identifier}`);
    } else {
      for (const t of Object.keys(this.LIMITS) as RateLimitTier[]) {
        rateLimitStore.delete(`${t}:${identifier}`);
      }
    }
  }
}
