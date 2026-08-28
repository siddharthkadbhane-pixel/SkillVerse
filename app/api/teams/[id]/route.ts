import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
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

    const team = await TeamEngine.getTeamById(id, userId);

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Team not found.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/teams/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching team workspace.',
    }, { status: 500 });
  }
}
