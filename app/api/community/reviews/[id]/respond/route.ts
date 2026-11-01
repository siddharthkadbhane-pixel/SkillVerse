import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id } = await params;
    const reviewerId = auth.context.user.id;
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
