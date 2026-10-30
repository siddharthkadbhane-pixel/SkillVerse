import { NextRequest, NextResponse } from 'next/server';
import { CommunityEngine } from '@/services/community/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { getSessionUser } from '@/services/supabase';
import { CommunityFilter, CommunityContentType } from '@/types/community';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

    const filter: CommunityFilter = {
      q: searchParams.get('q') || undefined,
      contentType: (searchParams.get('contentType') as CommunityContentType) || undefined,
      tag: searchParams.get('tag') || undefined,
      onlyFollowing: searchParams.get('onlyFollowing') === 'true',
    };

    const result = await CommunityEngine.getFeed(filter, userId);

    return NextResponse.json({
      success: true,
      data: result.posts,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/community/posts:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching community feed.',
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

    const result = await CommunityEngine.createPost(userId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/community/posts:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while publishing community post.',
    }, { status: 500 });
  }
}
