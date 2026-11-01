import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

    const question = await CommunityEngine.getQuestionById(id, userId);

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question not found.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/community/questions/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching question details.',
    }, { status: 500 });
  }
}
