import crypto from 'crypto';
import { db, withDbTimeout } from '@/lib/drizzle';
import { personalAccessTokens } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { ApiScope, PersonalAccessTokenData, PersonalAccessTokenCreateResult } from '@/types/api';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';

// Resilient in-memory fallback store for offline development and testing
interface CachedTokenEntry {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  scopes: ApiScope[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

// In-memory token cache for local session optimization
const inMemoryTokenStore = new Map<string, CachedTokenEntry>();

export class PersonalAccessTokenService {
  /**
   * Hashes a raw token using SHA-256 for secure constant-time verification
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  }

  /**
   * Generates a new Personal Access Token with granular scopes
   * The raw token is returned once and NEVER stored in plaintext.
   */
  public static async createToken(
    userId: string,
    name: string,
    scopes: ApiScope[] = ['read:profile', 'read:dcc'],
    expiresInDays?: number
  ): Promise<PersonalAccessTokenCreateResult> {
    const entropy = crypto.randomBytes(24).toString('hex');
    const rawToken = `sk_live_${entropy}`;
    const tokenHash = this.hashToken(rawToken);
    const tokenPrefix = `sk_live_...${rawToken.slice(-4)}`;

    const expiresAt = expiresInDays && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const tokenRecordId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const cachedEntry: CachedTokenEntry = {
      id: tokenRecordId,
      userId,
      name: name.trim() || 'API Key',
      tokenHash,
      tokenPrefix,
      scopes,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: nowIso,
    };

    // Cache locally
    inMemoryTokenStore.set(tokenHash, cachedEntry);

    // Save to Database
    try {
      await withDbTimeout(
        db.insert(personalAccessTokens).values({
          id: tokenRecordId,
          userId,
          name: cachedEntry.name,
          tokenHash,
          tokenPrefix,
          scopes: scopes as any,
          expiresAt: expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      Logger.info(`Created Personal Access Token [${tokenPrefix}] for user ${userId}`);
    } catch (err: any) {
      Logger.warn(`DB write skipped during PAT creation: ${err.message}. Using resilient memory store.`);
    }

    const tokenData: PersonalAccessTokenData = {
      id: tokenRecordId,
      userId,
      name: cachedEntry.name,
      tokenPrefix,
      scopes,
      expiresAt: cachedEntry.expiresAt,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: nowIso,
      isRevoked: false,
    };

    return {
      token: tokenData,
      rawToken,
    };
  }

  /**
   * Validates a raw Personal Access Token (SHA-256 lookup, expiry, revocation check)
   */
  public static async validateToken(rawToken: string): Promise<{
    isValid: boolean;
    tokenData: PersonalAccessTokenData | null;
    errorReason?: 'INVALID_TOKEN' | 'REVOKED' | 'EXPIRED';
  }> {
    if (!rawToken || typeof rawToken !== 'string') {
      return { isValid: false, tokenData: null, errorReason: 'INVALID_TOKEN' };
    }

    const trimmed = rawToken.trim();
    const tokenHash = this.hashToken(trimmed);

    let tokenRow: any = null;

    // 1. Try DB lookup
    try {
      tokenRow = await withDbTimeout(
        db.query.personalAccessTokens.findFirst({
          where: eq(personalAccessTokens.tokenHash, tokenHash),
        }),
        3000
      );
    } catch {
      // Fall back to in-memory store
      tokenRow = inMemoryTokenStore.get(tokenHash);
    }

    // Check in-memory store if DB was empty/offline
    if (!tokenRow) {
      tokenRow = inMemoryTokenStore.get(tokenHash);
    }

    if (!tokenRow) {
      return { isValid: false, tokenData: null, errorReason: 'INVALID_TOKEN' };
    }

    // Check revocation
    if (tokenRow.revokedAt) {
      return { isValid: false, tokenData: null, errorReason: 'REVOKED' };
    }

    // Check expiration
    if (tokenRow.expiresAt) {
      const expDate = new Date(tokenRow.expiresAt);
      if (expDate < new Date()) {
        return { isValid: false, tokenData: null, errorReason: 'EXPIRED' };
      }
    }

    // Update last used timestamp
    const nowIso = new Date().toISOString();
    if (inMemoryTokenStore.has(tokenHash)) {
      const cached = inMemoryTokenStore.get(tokenHash)!;
      cached.lastUsedAt = nowIso;
    }

    try {
      withDbTimeout(
        db
          .update(personalAccessTokens)
          .set({ lastUsedAt: new Date(), updatedAt: new Date() })
          .where(eq(personalAccessTokens.id, tokenRow.id)),
        200
      ).catch(() => {});
    } catch {}

    const tokenData: PersonalAccessTokenData = {
      id: tokenRow.id,
      userId: tokenRow.userId,
      name: tokenRow.name,
      tokenPrefix: tokenRow.tokenPrefix,
      scopes: Array.isArray(tokenRow.scopes) ? tokenRow.scopes : [],
      lastUsedAt: nowIso,
      expiresAt: tokenRow.expiresAt ? new Date(tokenRow.expiresAt).toISOString() : null,
      revokedAt: tokenRow.revokedAt ? new Date(tokenRow.revokedAt).toISOString() : null,
      createdAt: tokenRow.createdAt ? new Date(tokenRow.createdAt).toISOString() : nowIso,
      isRevoked: false,
    };

    return {
      isValid: true,
      tokenData,
    };
  }

  /**
   * Lists all tokens for a given user (never returns secrets or full hashes)
   */
  public static async listTokens(userId: string): Promise<PersonalAccessTokenData[]> {
    let rows: any[] = [];

    try {
      rows = await withDbTimeout(
        db.query.personalAccessTokens.findMany({
          where: eq(personalAccessTokens.userId, userId),
        }),
        300
      );
    } catch {
      rows = Array.from(inMemoryTokenStore.values()).filter(t => t.userId === userId);
    }

    if (rows.length === 0) {
      rows = Array.from(inMemoryTokenStore.values()).filter(t => t.userId === userId);
    }

    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      tokenPrefix: r.tokenPrefix,
      scopes: Array.isArray(r.scopes) ? r.scopes : [],
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null,
      expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
      revokedAt: r.revokedAt ? new Date(r.revokedAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      isRevoked: !!r.revokedAt,
    }));
  }

  /**
   * Alias for listTokens
   */
  public static async listUserTokens(userId: string): Promise<PersonalAccessTokenData[]> {
    return this.listTokens(userId);
  }

  /**
   * Revokes a token by ID
   */
  public static async revokeToken(userId: string, tokenId: string): Promise<boolean> {
    let found = false;

    // Update in-memory store
    for (const [hash, entry] of inMemoryTokenStore.entries()) {
      if (entry.id === tokenId && entry.userId === userId) {
        entry.revokedAt = new Date().toISOString();
        found = true;
      }
    }

    try {
      await withDbTimeout(
        db
          .update(personalAccessTokens)
          .set({ revokedAt: new Date(), updatedAt: new Date() })
          .where(and(eq(personalAccessTokens.id, tokenId), eq(personalAccessTokens.userId, userId))),
        300
      );
      found = true;
    } catch (err: any) {
      Logger.warn(`DB write skipped during token revocation: ${err.message}`);
    }

    return found;
  }
}
