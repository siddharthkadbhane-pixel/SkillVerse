import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const reporterId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const body = await req.json();
    const { targetType, targetId, reason } = body;

    const result = await CommunityEngine.reportContent(reporterId, targetType, targetId, reason || 'Inappropriate content');

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/report:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while reporting content.',
    }, { status: 500 });
  }
}
