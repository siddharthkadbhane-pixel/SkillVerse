import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
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

    const post = await CommunityEngine.getPostById(id, userId);

    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Post not found.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/community/posts/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching post.',
    }, { status: 500 });
  }
}

export async function DELETE(
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

    const result = await CommunityEngine.deletePost(id, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in DELETE /api/community/posts/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while deleting post.',
    }, { status: 500 });
  }
}
