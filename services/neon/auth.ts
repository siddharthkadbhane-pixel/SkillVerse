import { neonConfig } from './config';

export interface NeonAuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  expiresAt: string;
}

export class NeonAuthService {
  private static cachedJwks: any = null;
  private static lastJwksFetch = 0;

  /**
   * Check connection to Neon Auth JWKS endpoint
   */
  static async checkHealth(): Promise<{ ok: boolean; jwksUrl: string; message: string }> {
    const jwksUrl = neonConfig.auth.jwksUrl;
    if (!jwksUrl) {
      return { ok: false, jwksUrl: '', message: 'NEON_AUTH_JWKS_URL is not set' };
    }
    try {
      const res = await fetch(jwksUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, jwksUrl, message: `JWKS resolved with ${data.keys?.length ?? 0} keys` };
      }
      return { ok: false, jwksUrl, message: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { ok: false, jwksUrl, message: err.message };
    }
  }

  /**
   * Fetch JWKS public keys from Neon Auth endpoint
   */
  static async getJwks(): Promise<any> {
    const now = Date.now();
    if (this.cachedJwks && now - this.lastJwksFetch < 300000) {
      return this.cachedJwks;
    }
    const res = await fetch(neonConfig.auth.jwksUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch Neon JWKS: ${res.statusText}`);
    }
    this.cachedJwks = await res.json();
    this.lastJwksFetch = now;
    return this.cachedJwks;
  }
}
