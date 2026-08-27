import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { capabilityInsights } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { DCCInsightsService } from '@/services/dcc/insights';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    let targetUserId = user.id;
    if (username) {
      const targetUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (targetUser) targetUserId = targetUser.id;
    }

    let insights = await db.query.capabilityInsights.findFirst({
      where: eq(capabilityInsights.userId, targetUserId),
    });

    if (!insights) {
      insights = await DCCInsightsService.generateInsights(targetUserId);
    }

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc/insights:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { users } from '@/database/schema';
