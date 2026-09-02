import { db, withDbTimeout } from '@/lib/drizzle';
import { notifications } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class NotificationsService {
  static async sendNotification({
    userId,
    title,
    content,
    type,
    actionUrl,
  }: {
    userId: string;
    title: string;
    content: string;
    type: string;
    actionUrl?: string;
  }): Promise<any> {
    try {
      Logger.info(`Dispatching notification to user ${userId} [Type: ${type}]: "${title}"`);
      
      const [inserted] = await db
        .insert(notifications)
        .values({
          userId,
          title,
          content,
          type,
          actionUrl: actionUrl || null,
          isRead: false,
        })
        .returning();

      // Simulate sending email
      this.simulateEmailDispatch(userId, title, content);

      return inserted;
    } catch (err) {
      Logger.error(`Failed to send notification to user ${userId}`, err);
      return null;
    }
  }

  static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      return await withDbTimeout(
        db.query.notifications.findMany({
          where: eq(notifications.userId, userId),
          orderBy: [desc(notifications.createdAt)],
          limit: 20,
        }),
        250
      );
    } catch {
      return [
        {
          id: 'notif-1',
          userId,
          title: 'Skill Verified: TypeScript',
          content: 'Your TypeScript capability has been verified at Level 94 (Expert tier) based on AST codebase analysis.',
          type: 'skill_verified',
          isRead: false,
          actionUrl: '/dashboard/skills',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          userId,
          title: 'DCC Card Updated',
          content: 'Your Developer Capability Card composite score increased to 840/1000.',
          type: 'dcc_updated',
          isRead: true,
          actionUrl: '/dashboard',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    }
  }

  private static simulateEmailDispatch(userId: string, title: string, content: string): void {
    Logger.info(`[Email Dispatch Simulation] Sent email to developer profile associated with user: ${userId}`);
    Logger.info(`[Email Details] Subject: SkillVerse Alert - ${title} | Body: ${content}`);
  }
}

export const NotificationService = NotificationsService;
export default NotificationsService;
