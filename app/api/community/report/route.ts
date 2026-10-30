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

    const reporterId = auth.context.user.id;
    const body = await req.json();
    const { targetType, targetId, reason } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'targetType and targetId are required.',
      }, { status: 400 });
    }

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
