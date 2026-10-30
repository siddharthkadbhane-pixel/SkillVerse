import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { getSessionUser } from '@/services/supabase';
import { TeamFilter } from '@/types/team';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

    const filter: TeamFilter = {
      q: searchParams.get('q') || undefined,
      skill: searchParams.get('skill') || undefined,
      visibility: (searchParams.get('visibility') as any) || undefined,
    };

    const result = await TeamEngine.getTeams(filter, userId);

    return NextResponse.json({
      success: true,
      data: result.teams,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/teams:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching teams.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await req.json();
    const ownerId = auth.context.user.id;

    const result = await TeamEngine.createTeam(ownerId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/teams:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating team.',
    }, { status: 500 });
  }
}
