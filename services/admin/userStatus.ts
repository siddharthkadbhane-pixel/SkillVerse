// SkillVerse User Status & Suspension Management Service
// Enforces account suspension, reactivation, and anti-lockout security controls

import { db, withDbTimeout } from '@/lib/drizzle';
import { auditLogs, users } from '@/database/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { AuditLogService } from '@/services/security/audit';
import { SessionManagementService } from '@/services/admin/sessionManagement';
import { DUMMY_USERS } from '@/lib/dummyData';
import { Logger } from '@/lib/logger';

// In-memory cache for high-throughput status lookups
const suspendedUserCache = new Map<string, { suspended: boolean; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

export class UserStatusService {
  /**
   * Checks whether a user account is suspended.
   * Uses in-memory cache with fallback to persistent audit log state.
   */
  public static async isUserSuspended(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Check fast cache
    const cached = suspendedUserCache.get(userId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.suspended;
    }

    try {
      // Query most recent status action from persistent audit_logs table
      const latestLog = await withDbTimeout(
        db.query.auditLogs.findFirst({
          where: and(
            eq(auditLogs.resourceType, 'user'),
            eq(auditLogs.resourceId, userId),
            inArray(auditLogs.action, ['USER_SUSPENDED', 'USER_REACTIVATED'])
          ),
          orderBy: [desc(auditLogs.createdAt)],
        }),
        2000
      );

      const isSuspended = latestLog?.action === 'USER_SUSPENDED';
      suspendedUserCache.set(userId, { suspended: isSuspended, cachedAt: Date.now() });
      return isSuspended;
    } catch (err: any) {
      // In case of transient DB timeout, fall back to cached value if present, else false
      Logger.warn(`[UserStatusService] DB timeout checking status for ${userId}, using cache fallback`);
      return cached?.suspended ?? false;
    }
  }

  /**
   * Sets user account status (active | suspended).
   * Enforces anti-self-suspension and immediately revokes active sessions when suspended.
   */
  public static async setUserStatus(params: {
    targetUserId: string;
    newStatus: 'active' | 'suspended';
    actorId: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string; sessionsRevoked?: number }> {
    const { targetUserId, newStatus, actorId, reason } = params;

    // Anti-Lockout Security Rule: Super Admin cannot suspend their own account
    if (targetUserId === actorId && newStatus === 'suspended') {
      return {
        success: false,
        error: 'Administrators cannot suspend their own account.',
      };
    }

    // Verify target user exists
    let targetUser: any = null;
    try {
      targetUser = await withDbTimeout(
        db.query.users.findFirst({
          where: eq(users.id, targetUserId),
        }),
        6000
      );
    } catch (err: any) {
      Logger.warn(`[UserStatusService] DB timeout looking up user ${targetUserId}:`, err.message);
    }

    if (!targetUser) {
      targetUser = DUMMY_USERS.find(u => u.id === targetUserId);
    }

    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }

    // Prevent suspending another admin without emergency governance
    if (targetUser.role === 'admin' && newStatus === 'suspended') {
      return {
        success: false,
        error: 'Cannot directly suspend a Platform Administrator. Demote the user first.',
      };
    }

    const action = newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED';

    // 1. Record persistent audit log entry
    await AuditLogService.log({
      actorId,
      actorRole: 'admin',
      action,
      resourceType: 'user',
      resourceId: targetUserId,
      details: {
        targetEmail: targetUser.email,
        targetUsername: targetUser.username,
        targetRole: targetUser.role,
        reason: reason || (newStatus === 'suspended' ? 'Administrative suspension' : 'Administrative reactivation'),
        timestamp: new Date().toISOString(),
      },
    });

    // 2. Update cache
    suspendedUserCache.set(targetUserId, {
      suspended: newStatus === 'suspended',
      cachedAt: Date.now(),
    });

    // 3. If suspended, invalidate all active sessions immediately
    let sessionsRevoked = 0;
    if (newStatus === 'suspended') {
      sessionsRevoked = await SessionManagementService.invalidateUserSessions(targetUserId);
    }

    Logger.info(`[UserStatusService] User ${targetUserId} status changed to ${newStatus} by admin ${actorId}. Revoked sessions: ${sessionsRevoked}`);

    return {
      success: true,
      sessionsRevoked,
    };
  }

  /**
   * Invalidate local memory cache for test suites
   */
  public static clearCache(): void {
    suspendedUserCache.clear();
  }
}
