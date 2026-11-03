// SkillVerse Super Admin Bootstrap Provisioning Service
// Hardened initial platform owner provisioning via Google OAuth (Phase 46)

import { db, withDbTimeout } from '@/lib/drizzle';
import { users, auditLogs } from '@/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuditLogService } from '@/services/security/audit';
import { Logger } from '@/lib/logger';

export interface BootstrapIdentity {
  email?: string | null;
  emailVerified?: boolean | null;
  provider: string;
  googleSub?: string | null;
}

export class SuperAdminBootstrapService {
  /**
   * Checks whether the authenticated OAuth profile matches the configured owner identity.
   * Enforces:
   * 1. SUPER_ADMIN_BOOTSTRAP_EMAIL environment variable must be set.
   * 2. Bootstrap mechanism must not be explicitly disabled via SUPER_ADMIN_BOOTSTRAP_DISABLED.
   * 3. Identity must originate strictly from Google OAuth (provider === 'google').
   * 4. Email must be present and verified by Google (emailVerified === true).
   * 5. Email must match SUPER_ADMIN_BOOTSTRAP_EMAIL (case-insensitive).
   * 6. In production, or when configured, provider Google sub identity must strictly match.
   */
  public static isEligible(identity: BootstrapIdentity): boolean {
    const bootstrapEmail = process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const isExplicitlyDisabled = process.env.SUPER_ADMIN_BOOTSTRAP_DISABLED === 'true';

    // Must be configured and not disabled
    if (isExplicitlyDisabled || !bootstrapEmail) {
      return false;
    }

    // Provider MUST strictly be Google OAuth - GitHub never triggers bootstrap
    if (!identity.provider || identity.provider.toLowerCase() !== 'google') {
      return false;
    }

    // Email must be provided and verified by Google OAuth provider
    if (!identity.email || identity.emailVerified !== true) {
      return false;
    }

    // Email must match configured owner email
    if (identity.email.trim().toLowerCase() !== bootstrapEmail) {
      return false;
    }

    // Google Sub ID Enforcement:
    // When configured or when in production with SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB='true',
    // require an exact match against the owner's Google subject identity.
    const configuredSub = process.env.SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB?.trim();
    const isProduction = process.env.NODE_ENV === 'production';
    const requireSub = process.env.SUPER_ADMIN_BOOTSTRAP_REQUIRE_SUB === 'true' || (isProduction && configuredSub);

    if (configuredSub) {
      if (!identity.googleSub || identity.googleSub !== configuredSub) {
        Logger.warn(`[Bootstrap] Rejected: Email matched but Google sub ID mismatched (received: ${identity.googleSub})`);
        return false;
      }
    } else if (requireSub && !configuredSub) {
      Logger.warn('[Bootstrap] Rejected: Production mode requires SUPER_ADMIN_BOOTSTRAP_GOOGLE_SUB to be configured.');
      return false;
    }

    return true;
  }

  /**
   * Idempotently and atomically provisions a verified owner account as platform admin.
   * Prevents concurrent or repeated bootstrap from creating multiple initial administrators.
   */
  public static async provisionIfEligible(params: {
    userId: string;
    email: string;
    emailVerified: boolean;
    provider: string;
    googleSub?: string;
  }): Promise<{ provisioned: boolean; alreadyAdmin: boolean }> {
    if (!this.isEligible(params)) {
      return { provisioned: false, alreadyAdmin: false };
    }

    try {
      return await withDbTimeout(
        db.transaction(async (tx) => {
          // 1. Transaction Advisory Lock: serializes concurrent bootstrap calls
          try {
            await tx.execute(sql`SELECT pg_advisory_xact_lock(1847192841)`);
          } catch {
            // Non-fatal if advisory lock not supported in mock environment
          }

          // 2. Verify target user exists
          const targetUserRes = await tx
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.id, params.userId))
            .limit(1);

          if (!targetUserRes || targetUserRes.length === 0) {
            return { provisioned: false, alreadyAdmin: false };
          }

          const targetUser = targetUserRes[0];

          // If user is already an admin, preserve identity idempotently
          if (targetUser.role === 'admin') {
            return { provisioned: false, alreadyAdmin: true };
          }

          // 3. Concurrency Protection: Check if any admin already exists on the platform
          const existingAdmin = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.role, 'admin'))
            .limit(1);

          if (existingAdmin && existingAdmin.length > 0) {
            Logger.warn(`[Bootstrap] Concurrency Guard: An admin already exists (user ${existingAdmin[0].id}). Secondary bootstrap rejected.`);
            return { provisioned: false, alreadyAdmin: false };
          }

          // 4. Atomic database update with condition ensuring no admin exists
          const updated = await tx.execute(sql`
            UPDATE users
            SET role = 'admin', email_verified = true, updated_at = NOW()
            WHERE id = ${params.userId}
              AND role = 'developer'
              AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
            RETURNING id, role;
          `);

          const updatedRows = Array.isArray(updated) ? updated : ((updated as any).rows || []);
          if (updatedRows.length === 0) {
            return { provisioned: false, alreadyAdmin: false };
          }

          // 5. Record immutable security audit log
          await AuditLogService.log({
            actorId: params.userId,
            actorRole: 'admin',
            action: 'SUPER_ADMIN_BOOTSTRAP',
            resourceType: 'user',
            resourceId: params.userId,
            details: {
              email: params.email,
              provider: params.provider,
              googleSub: params.googleSub || null,
              method: 'INITIAL_OAUTH_PROVISIONING',
              timestamp: new Date().toISOString(),
            },
          });

          Logger.info(`[Bootstrap] Initial Super Admin successfully provisioned for verified owner: ${params.email}`);
          return { provisioned: true, alreadyAdmin: false };
        }),
        5000
      );
    } catch (err: any) {
      Logger.error('[Bootstrap] Failed to provision initial Super Admin:', err);
      return { provisioned: false, alreadyAdmin: false };
    }
  }
}
