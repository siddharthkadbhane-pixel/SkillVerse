import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
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

    const result = await TeamEngine.addTeamProject(id, userId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/teams/[id]/projects:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while linking team project.',
    }, { status: 500 });
  }
}
