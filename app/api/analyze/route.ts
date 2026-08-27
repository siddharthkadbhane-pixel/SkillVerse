import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { repositories, users, activityLogs } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';
import { AnalysisWorker } from '@/workers/analysis/worker';
import { RateLimiter } from '@/lib/rate-limit';
import { Logger } from '@/lib/logger';

const AnalyzeRequestSchema = z.object({
  githubRepoId: z.number(),
  fullName: z.string().min(3),
  name: z.string().min(1),
  language: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const rateCheck = RateLimiter.isAllowed(req);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateCheck.reset.toString(),
          }
        }
      );
    }

    // 2. Auth Check
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = AnalyzeRequestSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input payload', details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { githubRepoId, fullName, name, language } = parsedData.data;

    // Fetch user githubToken
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const gitToken = dbUser?.githubToken || process.env.GITHUB_ACCESS_TOKEN || '';
    if (!gitToken) {
      return NextResponse.json(
        { success: false, error: 'GitHub credentials not found.' },
        { status: 400 }
      );
    }

    // 3. Create or update repository record to pending status
    let repoRecord = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.githubRepoId, githubRepoId),
        eq(repositories.userId, user.id)
      ),
    });

    if (!repoRecord) {
      const [inserted] = await db
        .insert(repositories)
        .values({
          userId: user.id,
          githubRepoId,
          name,
          fullName,
          htmlUrl: `https://github.com/${fullName}`,
          description: null,
          language: language || null,
          isAnalyzed: false,
          reviewStatus: 'pending',
        })
        .returning();
      repoRecord = inserted;
    } else {
      await db
        .update(repositories)
        .set({ reviewStatus: 'pending' })
        .where(eq(repositories.id, repoRecord.id));
    }

    // 4. Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'repo_analysis_enqueued',
      metadata: { repository: fullName },
    });

    // 5. Enqueue background task (async non-blocking processing)
    AnalysisWorker.enqueue(repoRecord.id, fullName, gitToken);

    return NextResponse.json({
      success: true,
      message: 'Repository analysis successfully enqueued.',
      data: {
        repositoryId: repoRecord.id,
        reviewStatus: 'pending',
      }
    });
  } catch (error: any) {
    Logger.error('API Error in /api/analyze:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
