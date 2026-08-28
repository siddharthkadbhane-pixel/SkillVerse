import { NextRequest, NextResponse } from 'next/server';
import { ContributionIntelligenceService } from '@/services/activity/intelligence';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const targetUserId = sessionUser?.id || '00000000-0000-0000-0000-000000000001';

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
