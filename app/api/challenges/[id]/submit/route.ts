import { NextRequest, NextResponse } from 'next/server';
import { ChallengeEngine } from '@/services/challenge/engine';
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

    const body = await req.json();
    const result = await ChallengeEngine.submitSolution(userId, id, body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.submission,
      message: result.message,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/challenges/[id]/submit:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while submitting solution.',
    }, { status: 500 });
  }
}
