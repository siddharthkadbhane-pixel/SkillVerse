import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { recommendations } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, desc } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const list = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, user.id))
      .orderBy(desc(recommendations.score))
      .limit(10);

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/recommendations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
