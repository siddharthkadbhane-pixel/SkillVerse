import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id, answerId } = await params;
    const userId = auth.context.user.id;

    const result = await CommunityEngine.acceptAnswer(id, answerId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/community/questions/[id]/answers/[answerId]/accept:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while accepting answer.',
    }, { status: 500 });
  }
}
