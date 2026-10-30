import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    const body = await req.json();
    const { blockedUserId } = body;

    if (!blockedUserId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'blockedUserId is required.',
      }, { status: 400 });
    }

    const result = await CommunityEngine.blockUser(userId, blockedUserId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/block:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while blocking user.',
    }, { status: 500 });
  }
}
