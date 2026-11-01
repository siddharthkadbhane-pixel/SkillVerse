import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
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
    const { content, codeSnippet } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Comment content cannot be empty.',
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
