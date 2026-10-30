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
    const userId = auth.context.user.id;

    const result = await CommunityEngine.votePost(id, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/posts/[id]/vote:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while voting on post.',
    }, { status: 500 });
  }
}
