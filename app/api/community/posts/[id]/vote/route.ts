import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const result = await CommunityEngine.votePost(id, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/posts/[id]/vote:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while voting on post.',
    }, { status: 500 });
  }
}
