import { NextRequest, NextResponse } from 'next/server';
import { ChallengeEngine } from '@/services/challenge/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const challenge = await ChallengeEngine.getChallengeById(id, userId);

    if (!challenge) {
      return NextResponse.json({
        success: false,
        error: 'Challenge not found.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: challenge,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/challenges/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching challenge details.',
    }, { status: 500 });
  }
}
