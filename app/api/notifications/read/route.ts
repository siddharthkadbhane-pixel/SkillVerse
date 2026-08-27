import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { notifications } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (notificationId) {
      // Mark specific notification as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, user.id)
          )
        );
    } else {
      // Mark all notifications for the user as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, user.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications updated successfully.',
    });
  } catch (error: any) {
    Logger.error('API Error in /api/notifications/read:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
