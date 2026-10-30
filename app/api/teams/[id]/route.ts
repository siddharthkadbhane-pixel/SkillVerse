import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function GET(
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

    const team = await TeamEngine.getTeamById(id, userId);

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Not Found',
        message: 'Team not found.',
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
