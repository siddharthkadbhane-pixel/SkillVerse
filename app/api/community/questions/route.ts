import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { getSessionUser } from '@/services/supabase';
import { CommunityFilter, QuestionStatus } from '@/types/community';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

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
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    const body = await req.json();

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
