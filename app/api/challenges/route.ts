import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { challengeEvents, organizations } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { DUMMY_CHALLENGES } from '@/lib/dummyData';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let list: any[] = [];
    try {
      list = await db.select().from(challengeEvents);
    } catch {}

    if (!list || list.length === 0) {
      return NextResponse.json({
        success: true,
        data: DUMMY_CHALLENGES,
      });
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/challenges:', error);
    return NextResponse.json({
      success: true,
      data: DUMMY_CHALLENGES,
    });
  }
}
