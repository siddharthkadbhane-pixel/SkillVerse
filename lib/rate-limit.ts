import { NextRequest } from 'next/server';

interface RateLimitRecord {
  tokens: number;
  lastRefilled: number;
}

export class RateLimiter {
  private static records = new Map<string, RateLimitRecord>();
  private static LIMIT = 100; // max requests
  private static INTERVAL_MS = 60 * 1000; // 1 minute window

  private static getClientIp(req: NextRequest): string {
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    return '127.0.0.1';
  }

  static isAllowed(req: NextRequest, customKey?: string): { allowed: boolean; remaining: number; reset: number } {
    const ip = this.getClientIp(req);
    const key = customKey || ip;

    const now = Date.now();
    const record = this.records.get(key) || { tokens: this.LIMIT, lastRefilled: now };

    // Calculate time elapsed
    const elapsed = now - record.lastRefilled;
    
    // Replenish tokens based on elapsed time (fraction of standard interval)
    let refilledTokens = record.tokens + (elapsed / this.INTERVAL_MS) * this.LIMIT;
    if (refilledTokens > this.LIMIT) {
      refilledTokens = this.LIMIT;
    }

    const resetTime = Math.max(0, Math.ceil(this.INTERVAL_MS - (now - record.lastRefilled)));

    if (refilledTokens >= 1) {
      // Consume 1 token
      const nextRecord = {
        tokens: refilledTokens - 1,
        lastRefilled: now,
      };
      this.records.set(key, nextRecord);
      return { allowed: true, remaining: Math.floor(nextRecord.tokens), reset: resetTime };
    } else {
      // Rate limited
      this.records.set(key, { tokens: refilledTokens, lastRefilled: now });
      return { allowed: false, remaining: 0, reset: resetTime };
    }
  }
}

export default RateLimiter;
