import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { reviewHistory, repositories } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and, desc } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get('repositoryId');

    if (repoId) {
      // 1. Fetch history for a specific repository
      const repo = await db.query.repositories.findFirst({
        where: and(
          eq(repositories.id, repoId),
          eq(repositories.userId, user.id)
        ),
      });

      if (!repo) {
        return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
      }

      const history = await db
        .select()
        .from(reviewHistory)
        .where(eq(reviewHistory.repositoryId, repoId))
        .orderBy(desc(reviewHistory.createdAt));

      return NextResponse.json({
        success: true,
        data: history,
      });
    }

    // 2. Fetch all review history entries for the user's repositories
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, user.id),
      columns: { id: true, name: true, fullName: true },
    });

    const repoIds = userRepos.map(r => r.id);
    if (repoIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const allHistory = [];
    for (const repoItem of userRepos) {
      const history = await db
        .select()
        .from(reviewHistory)
        .where(eq(reviewHistory.repositoryId, repoItem.id))
        .orderBy(desc(reviewHistory.createdAt));
      
      allHistory.push({
        repositoryId: repoItem.id,
        name: repoItem.name,
        fullName: repoItem.fullName,
        history,
      });
    }

    return NextResponse.json({
      success: true,
      data: allHistory,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
