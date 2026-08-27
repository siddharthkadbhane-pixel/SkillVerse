import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { getDummyDCCData, getDummyUserByUsername } from '@/lib/dummyData';
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
    if (username && username !== (user as any).username) {
      try {
        const targetUser = await withDbTimeout(
          db.query.users.findFirst({
            where: eq(users.username, username),
          }),
          150
        );
        if (targetUser) {
          targetUserId = targetUser.id;
        } else {
          const dummyTarget = getDummyUserByUsername(username);
          targetUserId = dummyTarget.id;
        }
      } catch {
        const dummyTarget = getDummyUserByUsername(username);
        targetUserId = dummyTarget.id;
      }
    }

    try {
      const fullDCC = await withDbTimeout(
        DeveloperCapabilityCardService.getFullDCC(targetUserId),
        250
      );

      return NextResponse.json({
        success: true,
        data: {
          card: fullDCC.card,
          dimensions: fullDCC.dimensions,
          developer: fullDCC.developer,
          verifiedSkills: fullDCC.verifiedSkills,
          engineeringMetrics: fullDCC.engineeringMetrics,
          projectEvidence: fullDCC.projectEvidence,
          insights: fullDCC.insights,
          history: fullDCC.history,
          publicUrl: fullDCC.publicUrl,
        }
      });
    } catch {
      const fallbackDCC = getDummyDCCData(targetUserId);
      return NextResponse.json({
        success: true,
        data: fallbackDCC,
      });
    }
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc:', error);
    const fallbackDCC = getDummyDCCData('00000000-0000-0000-0000-000000000001');
    return NextResponse.json({
      success: true,
      data: fallbackDCC,
    });
  }
}
