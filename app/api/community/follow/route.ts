import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const body = await req.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({
        success: false,
        error: 'targetType and targetId are required.',
      }, { status: 400 });
    }

    const result = await CommunityEngine.toggleFollow(userId, targetType, targetId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/follow:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while following target.',
    }, { status: 500 });
  }
}
