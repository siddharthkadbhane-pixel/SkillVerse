import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    let targetUserId = auth.context.user.id;
    if (username && username !== auth.context.user.username) {
      const targetUser = await withDbTimeout(
        db.query.users.findFirst({
          where: eq(users.username, username),
        }),
        150
      );
      if (!targetUser) {
        return NextResponse.json({
          success: false,
          error: 'User not found.',
        }, { status: 404 });
      }
      targetUserId = targetUser.id;
    }

    const fullDCC = await withDbTimeout(
      DeveloperCapabilityCardService.getFullDCC(targetUserId),
      500
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
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching capability card.',
    }, { status: 500 });
  }
}
