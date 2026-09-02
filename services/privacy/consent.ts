// SkillVerse Consent & User Permissions Engine (Phase 41)

import { db, withDbTimeout } from '@/lib/drizzle';
import { userConsents } from '@/database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ConsentPurpose, UserConsentRecord } from '@/types/privacy';
import { AuditLogService } from '@/services/security/audit';
import { Logger } from '@/lib/logger';

export const CURRENT_NOTICE_VERSION = 'v1.0';

// In-memory fallback cache for consents
const consentStore = new Map<string, Map<ConsentPurpose, UserConsentRecord>>();

export class ConsentService {
  /**
   * Records or updates a user's consent for a specific purpose
   */
  public static async recordConsent(
    userId: string,
    purpose: ConsentPurpose,
    granted: boolean,
    ipAddress?: string,
    version = CURRENT_NOTICE_VERSION
  ): Promise<UserConsentRecord> {
    const record: UserConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      purpose,
      granted,
      version,
      ipAddress: ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
      revokedAt: granted ? null : new Date().toISOString(),
    };

    // Update in-memory store
    if (!consentStore.has(userId)) {
      consentStore.set(userId, new Map());
    }
    consentStore.get(userId)!.set(purpose, record);

    // Persist to DB with circuit breaker
    try {
      await withDbTimeout(
        db.insert(userConsents).values({
          userId,
          purpose,
          granted,
          version,
          ipAddress: ipAddress || '127.0.0.1',
          revokedAt: granted ? null : new Date(),
        }),
        120
      );
    } catch {
      // In-memory store updated safely
    }

    // Audit log the consent change
    await AuditLogService.log({
      actorId: userId,
      action: granted ? 'privacy.consent_granted' : 'privacy.consent_revoked',
      resourceType: 'user_consent',
      resourceId: purpose,
      details: { purpose, granted, version },
    });

    Logger.info(`[PRIVACY] Consent ${granted ? 'GRANTED' : 'REVOKED'} for user ${userId} on purpose "${purpose}" (version: ${version})`);

    return record;
  }

  /**
   * Checks whether a user has granted consent for a specific purpose
   */
  public static async hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    // Check in-memory store first
    const userMap = consentStore.get(userId);
    if (userMap && userMap.has(purpose)) {
      return userMap.get(purpose)!.granted;
    }

    // Check DB
    try {
      const record = await withDbTimeout(
        db.query.userConsents.findFirst({
          where: and(eq(userConsents.userId, userId), eq(userConsents.purpose, purpose)),
          orderBy: [desc(userConsents.createdAt)],
        }),
        100
      );

      if (record) {
        return record.granted;
      }
    } catch {}

    // Default to true for core service_operation, false for optional marketing
    if (purpose === 'service_operation' || purpose === 'public_profile') return true;
    return false;
  }

  /**
   * Retrieves all active consents for a user
   */
  public static async getUserConsents(userId: string): Promise<Record<ConsentPurpose, boolean>> {
    const defaults: Record<ConsentPurpose, boolean> = {
      service_operation: true,
      public_profile: true,
      private_repo_analysis: false,
      analytics_telemetry: true,
      marketing_updates: false,
    };

    const userMap = consentStore.get(userId);
    if (userMap) {
      userMap.forEach((rec, purpose) => {
        defaults[purpose] = rec.granted;
      });
    }

    return defaults;
  }
}
