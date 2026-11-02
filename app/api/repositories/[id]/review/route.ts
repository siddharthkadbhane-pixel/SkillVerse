import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories, users, reviews } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { AiReviewService } from '@/services/ai';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    
    // Reject unauthenticated review dispatches
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    // Resolve repository and enforce resource ownership (Anti-IDOR)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const repo = await db.query.repositories.findFirst({
      where: isUuid ? eq(repositories.id, id) : eq(repositories.githubRepoId, parseInt(id, 10)),
      columns: { id: true, userId: true },
    });

    if (!repo) {
      return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
    }

    if (repo.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to trigger a review for this repository.' },
        { status: 403 }
      );
    }

    const gitToken = dbUser?.githubToken || process.env.GITHUB_ACCESS_TOKEN || '';

    // Trigger AI Review in the background (Non-blocking async promise)
    AiReviewService.processRepositoryReview(repo.id, gitToken).catch(err => {
      console.error('Background review execution error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'AI Review triggered successfully',
      status: 'running',
    }, { status: 202 });
  } catch (error: any) {
    console.error('Error in review trigger API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
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

    try {
      // Resolve the repository ID — if it's a GitHub integer ID, look up the DB UUID first
      let repoDbId = id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) {
        const repo = await db.query.repositories.findFirst({
          where: eq(repositories.githubRepoId, parseInt(id, 10)),
          columns: { id: true },
        });
        if (!repo) {
          return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 200 });
        }
        repoDbId = repo.id;
      }

      // Enforce repository ownership on review read (Anti-IDOR)
      const targetRepo = await db.query.repositories.findFirst({
        where: eq(repositories.id, repoDbId),
        columns: { id: true, userId: true },
      });

      if (!targetRepo) {
        return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
      }

      if (targetRepo.userId !== user.id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to view this review.' },
          { status: 403 }
        );
      }

      const reviewRecord = await db.query.reviews.findFirst({
        where: eq(reviews.repositoryId, repoDbId),
      });

      if (!reviewRecord) {
        return NextResponse.json({ success: false, error: 'AI Review not found' }, { status: 200 });
      }

      return NextResponse.json({
        success: true,
        data: reviewRecord,
      });
    } catch (dbErr: any) {
      // In production, never return synthetic fallback scores on database failure
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Failed to fetch repository review.' }, { status: 500 });
      }
      // Return a mock review record in non-production development if database fails
      const mockResult = {
        id: 'rev_mock_details',
        repositoryId: id,
        summary: `Mock Codebase Review. Structure displays clear components layout and proper separation of styles.`,
        strengths: [
          'Demonstrates clean modular structure',
          'Good layout separation',
          'Efficient UI rendering boundaries'
        ],
        weaknesses: [
          'Lacks automated testing integration',
          'Missing strictly typed definitions'
        ],
        architecture: 'Clean modern structure using components and source file layout.',
        codeQuality: 'Code Quality: 85/100. Maintainability: 82/100.',
        documentation: 'Documentation rating is 80/100.',
        bestPractices: 'Security: 78/100. Performance: 88/100. Testing: 20/100.',
        suggestedLearning: [
          'Integrate Jest / Vitest and write unit tests',
          'Add a Zod schema validation script'
        ],
        overallScore: 83,
        confidenceScore: 90,
        createdAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: mockResult,
      });
    }
  } catch (error: any) {
    console.error('Error in review fetch API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
