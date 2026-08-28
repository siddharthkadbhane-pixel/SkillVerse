import { NextRequest, NextResponse } from 'next/server';
import { ChallengeEngine } from '@/services/challenge/engine';
import { Logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaderboard = await ChallengeEngine.getLeaderboard(id);

    return NextResponse.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/challenges/[id]/leaderboard:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching leaderboard.',
    }, { status: 500 });
  }
}
