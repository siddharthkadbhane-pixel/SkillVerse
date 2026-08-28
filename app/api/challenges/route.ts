import { NextRequest, NextResponse } from 'next/server';
import { ChallengeEngine } from '@/services/challenge/engine';
import { getSessionUser } from '@/services/supabase';
import { ChallengeFilter, ChallengeType, ChallengeDifficulty } from '@/types/challenge';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

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
    const body = await req.json();
    const sessionUser = await getSessionUser();
    const organizerId = body.organizerId || sessionUser?.id || '00000000-0000-0000-0000-000000000001';

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
