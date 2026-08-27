import { db } from '@/lib/drizzle';
import { notifications } from '@/database/schema';
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

  private static simulateEmailDispatch(userId: string, title: string, content: string): void {
    // In a real environment, we would query the user's email and dispatch using Resend or NodeMailer.
    // Here we simulate it inside our server log for testing.
    Logger.info(`[Email Dispatch Simulation] Sent email to developer profile associated with user: ${userId}`);
    Logger.info(`[Email Details] Subject: SkillVerse Alert - ${title} | Body: ${content}`);
  }
}

export default NotificationsService;
