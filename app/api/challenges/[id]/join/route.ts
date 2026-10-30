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

    let teamId: string | undefined;
    try {
      const body = await req.json();
      teamId = body?.teamId;
    } catch {}

    const result = await ChallengeEngine.joinChallenge(userId, id, teamId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/challenges/[id]/join:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while registering for challenge.',
    }, { status: 500 });
  }
}

export async function DELETE(
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

    const result = await ChallengeEngine.leaveChallenge(userId, id);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in DELETE /api/challenges/[id]/join:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while unregistering from challenge.',
    }, { status: 500 });
  }
}
