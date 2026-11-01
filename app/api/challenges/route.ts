import { NextRequest, NextResponse } from 'next/server';
import { ChallengeEngine } from '@/services/challenge/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { getSessionUser } from '@/services/supabase';
import { ChallengeFilter, ChallengeType, ChallengeDifficulty } from '@/types/challenge';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

    const filter: ChallengeFilter = {
      q: searchParams.get('q') || undefined,
      type: (searchParams.get('type') as ChallengeType) || undefined,
      difficulty: (searchParams.get('difficulty') as ChallengeDifficulty) || undefined,
      skill: searchParams.get('skill') || undefined,
      isHiring: searchParams.get('isHiring') === 'true',
    };

    const result = await ChallengeEngine.getChallenges(filter, userId);

    return NextResponse.json({
      success: true,
      data: result.challenges,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/challenges:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching challenges.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const organizerId = auth.context.user.id;
    const body = await req.json();

    const result = await ChallengeEngine.createChallenge(organizerId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/challenges:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating challenge.',
    }, { status: 500 });
  }
}
