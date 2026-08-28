import { NextRequest, NextResponse } from 'next/server';
import { ChallengeEngine } from '@/services/challenge/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    let teamId: string | undefined;
    try {
      const body = await req.json();
      teamId = body.teamId;
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
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

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
