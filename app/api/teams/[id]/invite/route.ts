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
    const inviterId = auth.context.user.id;
    const body = await req.json();
    const { inviteeUserId } = body;

    if (!inviteeUserId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'inviteeUserId is required.',
      }, { status: 400 });
    }

    const result = await TeamEngine.inviteMember(id, inviterId, inviteeUserId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/teams/[id]/invite:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while inviting member.',
    }, { status: 500 });
  }
}
