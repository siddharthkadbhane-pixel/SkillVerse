import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const { id, answerId } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000005';

    const result = await CommunityEngine.acceptAnswer(id, answerId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/community/questions/[id]/answers/[answerId]/accept:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while accepting answer.',
    }, { status: 500 });
  }
}
