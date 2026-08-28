import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const reviewerId = sessionUser?.id || '00000000-0000-0000-0000-000000000004';

    const body = await req.json();
    const result = await CommunityEngine.submitPeerReviewResponse(id, reviewerId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/reviews/[id]/respond:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while submitting peer review response.',
    }, { status: 500 });
  }
}
