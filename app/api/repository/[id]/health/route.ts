import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories, reviews } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';
import { CachingService } from '@/lib/caching/service';
import { Logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check cache first
    const cacheKey = `repo-health-${id}-${user.id}`;
    const cachedData = CachingService.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    // Resolve repo details
    const repo = await db.query.repositories.findFirst({
      where: and(
        isUuid ? eq(repositories.id, id) : eq(repositories.githubRepoId, parseInt(id, 10)),
        eq(repositories.userId, user.id)
      ),
    });

    if (!repo) {
      return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
    }

    // Fetch review associated with repo to get healthScores JSON
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.repositoryId, repo.id),
    });

    if (!review || !review.healthScores) {
      return NextResponse.json({
        success: false,
        error: 'Health report not generated yet. Trigger an AI Review first.',
      });
    }

    // Cache the result for 60 seconds
    CachingService.set(cacheKey, review.healthScores, 60);

    return NextResponse.json({
      success: true,
      data: review.healthScores,
    });
  } catch (error: any) {
    Logger.error(`API Error in /api/repository/[id]/health`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
