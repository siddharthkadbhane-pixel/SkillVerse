import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { repositories, users, activityLogs, accounts } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';
import { RepositoryAnalyzerService } from '@/services/analyzer';
import { AiReviewService } from '@/services/ai';
import { RateLimiter } from '@/lib/rate-limit';
import { Logger } from '@/lib/logger';

// Allow extended serverless execution for GitHub AST parsing and AI review completion
export const maxDuration = 60;

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

    // Fetch user githubToken with Google OAuth and Account linkage fallback
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    let gitToken = dbUser?.githubToken || process.env.GITHUB_ACCESS_TOKEN || '';
    if (!gitToken) {
      try {
        const ghAccount = await db.query.accounts.findFirst({
          where: and(eq(accounts.userId, user.id), eq(accounts.providerId, 'github')),
        });
        if (ghAccount?.accessToken) gitToken = ghAccount.accessToken;
      } catch {}
    }

    // 3. Resolve existing repository and enforce ownership (Anti-IDOR)
    let repoRecord = await db.query.repositories.findFirst({
      where: eq(repositories.githubRepoId, githubRepoId),
    });

    if (repoRecord && repoRecord.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to audit this repository.' },
        { status: 403 }
      );
    }

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
          reviewStatus: 'running',
        })
        .returning();
      repoRecord = inserted;
    } else {
      // Idempotency: If audit is already actively running, return current status without re-triggering
      if (repoRecord.reviewStatus === 'running') {
        return NextResponse.json({
          success: true,
          message: 'Repository analysis is already in progress.',
          data: {
            repositoryId: repoRecord.id,
            reviewStatus: 'running',
          }
        }, { status: 200 });
      }

      await db
        .update(repositories)
        .set({ reviewStatus: 'running' })
        .where(eq(repositories.id, repoRecord.id));
    }

    // 4. Log activity
    try {
      await db.insert(activityLogs).values({
        userId: user.id,
        action: 'repo_analysis_triggered',
        metadata: { repository: fullName },
      });
    } catch {}

    // 5. Execution Pipeline
    const executePipeline = async () => {
      try {
        Logger.info(`[Audit Pipeline] Starting AST & file analysis for ${fullName}...`);
        const { summary, context } = await RepositoryAnalyzerService.runAnalysis(
          repoRecord.id,
          fullName,
          gitToken
        );

        await db
          .update(repositories)
          .set({
            isAnalyzed: true,
            analyzedAt: new Date(),
            metadata: context.metadata,
            summary,
            context,
            updatedAt: new Date(),
          })
          .where(eq(repositories.id, repoRecord.id));

        Logger.info(`[Audit Pipeline] Running AI Review for ${fullName}...`);
        await AiReviewService.processRepositoryReview(repoRecord.id, gitToken);

        await db
          .update(repositories)
          .set({
            reviewStatus: 'completed',
            isAnalyzed: true,
            analyzedAt: new Date(),
          })
          .where(eq(repositories.id, repoRecord.id));

        Logger.info(`[Audit Pipeline] Successfully completed review for ${fullName}`);
      } catch (pipelineErr: any) {
        Logger.error(`[Audit Pipeline] Failed for ${fullName}:`, pipelineErr);
        await db
          .update(repositories)
          .set({ reviewStatus: 'failed' })
          .where(eq(repositories.id, repoRecord.id));
      }
    };

    // Check if synchronous execution was requested (e.g. for testing)
    const { searchParams } = new URL(req.url);
    const isSync = searchParams.get('sync') === 'true';

    if (isSync) {
      await executePipeline();
      const updatedRepo = await db.query.repositories.findFirst({
        where: eq(repositories.id, repoRecord.id),
      });
      return NextResponse.json({
        success: updatedRepo?.reviewStatus === 'completed',
        message: updatedRepo?.reviewStatus === 'completed' ? 'Repository analysis completed.' : 'Repository analysis failed.',
        data: {
          repositoryId: repoRecord.id,
          reviewStatus: updatedRepo?.reviewStatus || 'completed',
        }
      });
    }

    // Schedule background execution with Next.js 15 after()
    try {
      after(async () => {
        await executePipeline();
      });
    } catch {
      // Outside Next.js request scope (e.g. headless test suite), execute asynchronously
      executePipeline().catch((pipelineErr) => {
        Logger.error(`[Audit Pipeline Test Background Error] Failed for ${fullName}:`, pipelineErr);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Repository analysis started successfully.',
      data: {
        repositoryId: repoRecord.id,
        reviewStatus: 'running',
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
