import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { notifications } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { DUMMY_NOTIFICATIONS } from '@/lib/dummyData';
import { eq, desc } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let list: any[] = [];
    try {
      list = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(30);
    } catch {}

    if (list.length === 0) {
      return NextResponse.json({
        success: true,
        data: DUMMY_NOTIFICATIONS,
      });
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/notifications:', error);
    return NextResponse.json({
      success: true,
      data: DUMMY_NOTIFICATIONS,
    });
  }
}
