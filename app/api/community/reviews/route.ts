import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;

    const result = await CommunityEngine.getPeerReviewRequests({ q });

    return NextResponse.json({
      success: true,
      data: result.requests,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/community/reviews:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching peer review requests.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const result = await CommunityEngine.createPeerReviewRequest(userId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/reviews:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while requesting peer review.',
    }, { status: 500 });
  }
}
