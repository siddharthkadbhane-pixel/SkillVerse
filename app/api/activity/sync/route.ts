import { NextRequest, NextResponse } from 'next/server';
import { ContributionIntelligenceService } from '@/services/activity/intelligence';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const targetUserId = auth.context.user.id;

    const syncResult = await ContributionIntelligenceService.syncDeveloperActivity(targetUserId);

    return NextResponse.json({
      success: true,
      data: syncResult,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/activity/sync:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during incremental activity synchronization.',
    }, { status: 500 });
  }
}
