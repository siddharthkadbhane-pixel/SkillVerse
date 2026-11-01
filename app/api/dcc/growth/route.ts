import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, privacySettings } from '@/database/schema';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { CapabilityGrowthService } from '@/services/dcc/growth';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const skill = searchParams.get('skill');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    let targetUserId: string | null = null;
    let isPublicRequest = false;

    if (username) {
      const targetUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      targetUserId = targetUser.id;
      isPublicRequest = true;

      // Check privacy settings
      const privacy = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, targetUserId),
      });
      if (privacy && privacy.profileVisibility === 'private') {
        return NextResponse.json({ success: false, error: 'Profile is private' }, { status: 403 });
      }
    } else {
      const auth = await AuthorizationGuard.requireAuth(req);
      if (!auth.authorized) {
        return auth.response!;
      }
      targetUserId = auth.context.user.id;
    }

    // If a specific skill's progression was requested
    if (skill) {
      const skillHistory = await CapabilityGrowthService.getSkillProgressionHistory(targetUserId, skill);
      return NextResponse.json({
        success: true,
        data: {
          skill,
          ...skillHistory,
        },
      });
    }

    const [timeline, chartData, recentChanges] = await Promise.all([
      CapabilityGrowthService.getGrowthTimeline(targetUserId, isPublicRequest, limit),
      CapabilityGrowthService.getCapabilityTrendChartData(targetUserId),
      CapabilityGrowthService.getRecentCapabilityChanges(targetUserId, isPublicRequest, 5),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        timeline,
        chartData,
        recentChanges,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc/growth:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
