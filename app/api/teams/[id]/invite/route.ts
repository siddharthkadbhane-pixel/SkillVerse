import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const inviterId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const body = await req.json();
    const inviteeUserId = body.inviteeUserId || '00000000-0000-0000-0000-000000000005';

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
