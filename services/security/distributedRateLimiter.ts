/**
 * SkillVerse Distributed Rate Limiter (Phase 43D)
 * 
 * Provides sliding-window rate limiting with support for:
 * 1. Multi-instance shared coordination
 * 2. Automatic memory-capped local sliding-window store (LRU eviction)
 * 3. Bounded fail-closed protection for security-sensitive tiers
 * 4. Unref'd background cleanup to avoid blocking Node.js event loops
 */

import { NextRequest } from 'next/server';
import { Logger } from '@/lib/logger';

export type RateLimitTier = 
  | 'public' 
  | 'authenticated' 
  | 'heavy_analysis' 
  | 'management' 
  | 'auth_sensitive';

export interface RateLimitConfig {
  limit: number;
  windowSec: number;
  failClosedOnDegraded?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Seconds until window reset
  tier: RateLimitTier;
  headers: Record<string, string>;
  degradedMode?: boolean;
}

export interface RateLimitBucket {
  count: number;
  resetAt: number; // Timestamp in ms
  updatedAt: number;
}

/**
 * Interface for shared rate limit stores (Redis, Postgres, KV)
 */
export interface RateLimitStoreAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
  reset(key: string): Promise<void>;
}

export class DistributedRateLimiter {
  private static readonly DEFAULT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
    public: { limit: 120, windowSec: 60, failClosedOnDegraded: false },
    authenticated: { limit: 300, windowSec: 60, failClosedOnDegraded: false },
    heavy_analysis: { limit: 10, windowSec: 60, failClosedOnDegraded: true },
    management: { limit: 30, windowSec: 60, failClosedOnDegraded: true },
    auth_sensitive: { limit: 10, windowSec: 60, failClosedOnDegraded: true },
  };

  private static storeAdapter: RateLimitStoreAdapter | null = null;
  private static localStore = new Map<string, RateLimitBucket>();
  private static readonly MAX_LOCAL_ENTRIES = 10000;
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static {
    // Initialize non-blocking background cleanup for expired buckets
    this.initCleanup();
  }

  private static initCleanup() {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.evictExpired();
    }, 30000);

    // Ensure timer does not prevent Node process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private static evictExpired() {
    const now = Date.now();
    for (const [key, bucket] of this.localStore.entries()) {
      if (now > bucket.resetAt) {
        this.localStore.delete(key);
      }
    }
  }

  /**
   * Registers a shared store adapter (e.g. Redis, Key-Value, or shared DB)
   */
  public static setStoreAdapter(adapter: RateLimitStoreAdapter | null): void {
    this.storeAdapter = adapter;
  }

  public static getStoreAdapter(): RateLimitStoreAdapter | null {
    return this.storeAdapter;
  }

  /**
   * Basic IPv4 and IPv6 format validator to reject header injection attempts
   */
  public static isValidIp(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return false;
    const clean = ip.trim();
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Pattern = /^[0-9a-fA-F:]+$/;
    return ipv4Pattern.test(clean) || (ipv6Pattern.test(clean) && clean.includes(':'));
  }

  /**
   * Resolves client IP address safely from request context
   */
  public static getClientIp(req: NextRequest): string {
    // 1. Next.js trusted edge IP if available
    const edgeIp = (req as any).ip;
    if (edgeIp && typeof edgeIp === 'string' && this.isValidIp(edgeIp.trim())) {
      return edgeIp.trim();
    }

    // 2. Cloudflare Connecting IP header
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    if (cfConnectingIp && this.isValidIp(cfConnectingIp.trim())) {
      return cfConnectingIp.trim();
    }

    // 3. X-Forwarded-For header (validated against injection)
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
      const clientCandidate = xForwardedFor.split(',')[0].trim();
      if (this.isValidIp(clientCandidate)) {
        return clientCandidate;
      }
    }

    // 4. X-Real-IP header
    const xRealIp = req.headers.get('x-real-ip');
    if (xRealIp && this.isValidIp(xRealIp.trim())) {
      return xRealIp.trim();
    }

    return '127.0.0.1';
  }

  /**
   * Synchronous check against local memory store (used by sync API endpoints)
   */
  public static checkSync(
    identifier: string,
    tier: RateLimitTier = 'authenticated',
    customLimit?: number
  ): RateLimitResult {
    const config = this.DEFAULT_CONFIGS[tier] || this.DEFAULT_CONFIGS.authenticated;
    const limit = customLimit ?? config.limit;
    const windowMs = config.windowSec * 1000;
    const key = `rl:${tier}:${identifier}`;
    const now = Date.now();

    let localBucket = this.localStore.get(key);

    if (!localBucket || now > localBucket.resetAt) {
      if (this.localStore.size >= this.MAX_LOCAL_ENTRIES) {
        this.evictExpired();
        if (this.localStore.size >= this.MAX_LOCAL_ENTRIES) {
          const oldestKey = this.localStore.keys().next().value;
          if (oldestKey) this.localStore.delete(oldestKey);
        }
      }

      localBucket = {
        count: 1,
        resetAt: now + windowMs,
        updatedAt: now,
      };
      this.localStore.set(key, localBucket);
    } else {
      localBucket.count += 1;
      localBucket.updatedAt = now;
    }

    const count = localBucket.count;
    const resetAt = localBucket.resetAt;
    const isExceeded = count > limit;
    const remaining = Math.max(0, limit - count);
    const resetSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000));

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetSeconds.toString(),
      'X-RateLimit-Tier': tier,
    };

    if (isExceeded) {
      headers['Retry-After'] = resetSeconds.toString();
    }

    return {
      allowed: !isExceeded,
      limit,
      remaining,
      reset: resetSeconds,
      tier,
      headers,
      degradedMode: false,
    };
  }

  /**
   * Evaluates a rate limit check against an identifier and tier
   */
  public static async check(
    identifier: string,
    tier: RateLimitTier = 'authenticated',
    customLimit?: number
  ): Promise<RateLimitResult> {
    const config = this.DEFAULT_CONFIGS[tier] || this.DEFAULT_CONFIGS.authenticated;
    const limit = customLimit ?? config.limit;
    const windowMs = config.windowSec * 1000;
    const key = `rl:${tier}:${identifier}`;
    const now = Date.now();

    let count = 0;
    let resetAt = now + windowMs;
    let degradedMode = false;

    // 1. Try shared store adapter if available
    if (this.storeAdapter) {
      try {
        const isHealthy = await this.storeAdapter.isAvailable();
        if (isHealthy) {
          const res = await this.storeAdapter.increment(key, windowMs);
          count = res.count;
          resetAt = res.resetAt;
        } else {
          degradedMode = true;
        }
      } catch (err: any) {
        degradedMode = true;
        Logger.warn(`Rate limit shared backend error: ${err.message}. Enforcing fallback policy.`);
      }
    }

    // 2. If no shared adapter or backend degraded, enforce local store
    let effectiveLimit = limit;
    if (degradedMode && config.failClosedOnDegraded) {
      // Strict 30% quota under degraded mode for security-sensitive operations
      effectiveLimit = Math.max(1, Math.floor(limit * 0.3));
    }

    if (!this.storeAdapter || degradedMode) {
      let localBucket = this.localStore.get(key);

      if (!localBucket || now > localBucket.resetAt) {
        // Enforce maximum local store capacity to prevent memory exhaustion
        if (this.localStore.size >= this.MAX_LOCAL_ENTRIES) {
          this.evictExpired();
          if (this.localStore.size >= this.MAX_LOCAL_ENTRIES) {
            // Delete oldest entry
            const oldestKey = this.localStore.keys().next().value;
            if (oldestKey) this.localStore.delete(oldestKey);
          }
        }

        localBucket = {
          count: 1,
          resetAt: now + windowMs,
          updatedAt: now,
        };
        this.localStore.set(key, localBucket);
      } else {
        localBucket.count += 1;
        localBucket.updatedAt = now;
      }

      count = localBucket.count;
      resetAt = localBucket.resetAt;
    }

    const isExceeded = count > effectiveLimit;
    const remaining = Math.max(0, effectiveLimit - count);
    const resetSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000));

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': effectiveLimit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetSeconds.toString(),
      'X-RateLimit-Tier': tier,
    };

    if (isExceeded) {
      headers['Retry-After'] = resetSeconds.toString();
    }

    return {
      allowed: !isExceeded,
      limit: effectiveLimit,
      remaining,
      reset: resetSeconds,
      tier,
      headers,
      degradedMode,
    };
  }

  /**
   * Resets rate limit for a specific identifier
   */
  public static async reset(identifier: string, tier?: RateLimitTier): Promise<void> {
    const tiers = tier ? [tier] : (Object.keys(this.DEFAULT_CONFIGS) as RateLimitTier[]);
    for (const t of tiers) {
      const key = `rl:${t}:${identifier}`;
      this.localStore.delete(key);
      if (this.storeAdapter) {
        try {
          await this.storeAdapter.reset(key);
        } catch {}
      }
    }
  }

  /**
   * Clears all local buckets (for test suites)
   */
  public static clearLocalStore(): void {
    this.localStore.clear();
  }
}
