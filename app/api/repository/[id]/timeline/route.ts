import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories, reviews, reviewHistory, trustHistory } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and, desc } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export interface TimelineEvent {
  id: string;
  type: 'creation' | 'commit' | 'review' | 'trust_update' | 'skill_change';
  title: string;
  description: string;
  timestamp: string;
  meta?: any;
}

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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    const repo = await db.query.repositories.findFirst({
      where: and(
        isUuid ? eq(repositories.id, id) : eq(repositories.githubRepoId, parseInt(id, 10)),
        eq(repositories.userId, user.id)
      ),
    });

    if (!repo) {
      return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
    }

    const events: TimelineEvent[] = [];

    // 1. Repo Creation Event
    events.push({
      id: `evt-created-${repo.id}`,
      type: 'creation',
      title: 'Repository Tracked',
      description: `Connected "${repo.name}" to SkillVerse.`,
      timestamp: repo.createdAt.toISOString(),
    });

    // 2. Commit Events (from context commits)
    const commits = (repo.context as any)?.commits || [];
    commits.forEach((c: any, index: number) => {
      events.push({
        id: `evt-commit-${c.sha || index}-${repo.id}`,
        type: 'commit',
        title: 'Git Commit Audit',
        description: `${c.message} (by ${c.author})`,
        timestamp: c.date || new Date().toISOString(),
        meta: { sha: c.sha },
      });
    });

    // 3. AI Reviews Events (from reviewHistory)
    const histories = await db
      .select()
      .from(reviewHistory)
      .where(eq(reviewHistory.repositoryId, repo.id))
      .orderBy(desc(reviewHistory.createdAt));

    histories.forEach(hist => {
      events.push({
        id: `evt-review-v${hist.version}-${repo.id}`,
        type: 'review',
        title: `AI Review Audit (v${hist.version})`,
        description: `Completed comprehensive code audit. Score: ${hist.overallScore}/100.`,
        timestamp: hist.createdAt.toISOString(),
        meta: { version: hist.version, score: hist.overallScore },
      });
    });

    // 4. Trust Updates (from trustHistory)
    const trustLogs = await db
      .select()
      .from(trustHistory)
      .where(eq(trustHistory.userId, user.id))
      .orderBy(desc(trustHistory.createdAt))
      .limit(5);

    trustLogs.forEach((log, index) => {
      events.push({
        id: `evt-trust-${index}-${repo.id}`,
        type: 'trust_update',
        title: 'Trust Score Recalculated',
        description: `Developer Trust index updated to ${log.overallScore}/1000.`,
        timestamp: log.createdAt.toISOString(),
        meta: { overallScore: log.overallScore },
      });
    });

    // Sort events by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    Logger.error(`API Error in /api/repository/[id]/timeline`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
