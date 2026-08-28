import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { getSessionUser } from '@/services/supabase';
import { CommunityFilter, QuestionStatus } from '@/types/community';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const filter: CommunityFilter = {
      q: searchParams.get('q') || undefined,
      tag: searchParams.get('tag') || undefined,
      status: (searchParams.get('status') as QuestionStatus) || undefined,
    };

    const result = await CommunityEngine.getQuestions(filter, userId);

    return NextResponse.json({
      success: true,
      data: result.questions,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/community/questions:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching questions.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const result = await CommunityEngine.createQuestion(userId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/questions:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating question.',
    }, { status: 500 });
  }
}
