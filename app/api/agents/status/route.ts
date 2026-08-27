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
    const runId = searchParams.get('runId');

    if (runId) {
      const run = await db.query.agentRuns.findFirst({
        where: and(eq(agentRuns.id, runId), eq(agentRuns.userId, user.id)),
      });

      if (!run) {
        return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: run,
      });
    }

    // Default to latest run status for user
    const latestRun = await db
      .select({
        id: agentRuns.id,
        status: agentRuns.status,
        repositoryId: agentRuns.repositoryId,
        startedAt: agentRuns.startedAt,
        completedAt: agentRuns.completedAt,
        repoName: repositories.name,
      })
      .from(agentRuns)
      .leftJoin(repositories, eq(agentRuns.repositoryId, repositories.id))
      .where(eq(agentRuns.userId, user.id))
      .orderBy(desc(agentRuns.startedAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: latestRun[0] || null,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/agents/status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
