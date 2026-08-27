import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { agentRuns, repositories } from '@/database/schema';
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
    const repositoryId = searchParams.get('repositoryId');

    const condition = repositoryId
      ? and(eq(agentRuns.userId, user.id), eq(agentRuns.repositoryId, repositoryId))
      : eq(agentRuns.userId, user.id);

    const runs = await db
      .select({
        id: agentRuns.id,
        repositoryId: agentRuns.repositoryId,
        status: agentRuns.status,
        startedAt: agentRuns.startedAt,
        completedAt: agentRuns.completedAt,
        durationMs: agentRuns.durationMs,
        repoName: repositories.name,
      })
      .from(agentRuns)
      .leftJoin(repositories, eq(agentRuns.repositoryId, repositories.id))
      .where(condition)
      .orderBy(desc(agentRuns.startedAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      data: runs,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/agents/history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
