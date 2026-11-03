// SkillVerse Session Management & Revocation Service
// Enforces immediate session invalidation on role changes and account suspensions

import { db, withDbTimeout } from '@/lib/drizzle';
import { sessions } from '@/database/schema';
import { eq, and, ne } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class SessionManagementService {
  /**
   * Invalidates all active sessions for a target user.
   * Forces re-authentication across all active devices immediately.
   */
  public static async invalidateUserSessions(userId: string): Promise<number> {
    if (!userId) return 0;
    try {
      const deleted = await withDbTimeout(
        db.delete(sessions)
          .where(eq(sessions.userId, userId))
          .returning({ id: sessions.id }),
        3000
      );

      const count = deleted.length;
      Logger.info(`[SessionManagement] Invalidated ${count} active session(s) for user ${userId}`);
      return count;
    } catch (err: any) {
      Logger.error(`[SessionManagement] Error invalidating sessions for user ${userId}:`, err);
      return 0;
    }
  }

  /**
   * Invalidates all sessions for a user except the current session token (e.g. self-initiated logout other devices).
   */
  public static async invalidateOtherSessions(userId: string, currentSessionToken: string): Promise<number> {
    if (!userId || !currentSessionToken) return 0;
    try {
      const deleted = await withDbTimeout(
        db.delete(sessions)
          .where(and(eq(sessions.userId, userId), ne(sessions.token, currentSessionToken)))
          .returning({ id: sessions.id }),
        3000
      );
      return deleted.length;
    } catch (err: any) {
      Logger.error(`[SessionManagement] Error invalidating other sessions for user ${userId}:`, err);
      return 0;
    }
  }
}

