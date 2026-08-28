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
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

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
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

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
