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

    const body = await req.json();
    const { content, codeSnippet } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Comment content cannot be empty.',
      }, { status: 400 });
    }

    const result = await CommunityEngine.addComment(id, userId, content, codeSnippet);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/posts/[id]/comments:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while adding comment.',
    }, { status: 500 });
  }
}
