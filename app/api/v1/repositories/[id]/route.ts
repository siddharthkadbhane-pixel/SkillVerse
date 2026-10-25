import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { db, withDbTimeout } from '@/lib/drizzle';
import { repositories, reviews } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { DUMMY_REPOSITORIES, DUMMY_REVIEWS } from '@/lib/dummyData';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const authResult = await ApiAuthService.authenticate(req);

  if (!authResult.success) {
    return ApiResponse.error(
      authResult.errorCode || 'UNAUTHORIZED',
      authResult.errorMessage || 'Unauthorized',
      { status: authResult.errorStatus || 401, requestId: authResult.context.requestId }
    );
  }

  const { context } = authResult;

  if (!ApiAuthService.hasScope(context, 'read:repositories')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: read:repositories', {
      status: 403,
      requestId: context.requestId,
    });
  }

  const rateLimit = ApiRateLimiter.check(context.user.id, 'authenticated');
  if (rateLimit.isExceeded) {
    return ApiResponse.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down your requests.', {
      status: 429,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }

  const { id } = await params;

  try {
    let repo: any = null;
    let repoExistsGlobally = false;

    // 1. Ownership-constrained database query
    try {
      repo = await withDbTimeout(
        db.query.repositories.findFirst({
          where: and(eq(repositories.id, id), eq(repositories.userId, context.user.id)),
        }),
        250
      );
    } catch {}

    // 2. Check if repository exists globally in DB to distinguish 403 Forbidden vs 404 Not Found
    if (!repo) {
      try {
        const anyRepo = await withDbTimeout(
          db.query.repositories.findFirst({
            where: eq(repositories.id, id),
          }),
          250
        );
        if (anyRepo) {
          repoExistsGlobally = true;
          if (context.user.role === 'admin') {
            repo = anyRepo;
          }
        }
      } catch {}
    }

    // 3. Fallback to dummy data respecting user ownership
    if (!repo && !repoExistsGlobally) {
      const dummyMatch = DUMMY_REPOSITORIES.find(r => r.id === id || r.name.toLowerCase() === id.toLowerCase());
      if (dummyMatch) {
        if (dummyMatch.userId === context.user.id || context.user.role === 'admin') {
          repo = dummyMatch;
        } else {
          repoExistsGlobally = true;
        }
      }
    }

    // 4. Cross-user access denial (Anti-IDOR)
    if (repoExistsGlobally && (!repo || (repo.userId !== context.user.id && context.user.role !== 'admin'))) {
      return ApiResponse.error('FORBIDDEN_RESOURCE_ACCESS', 'You do not have permission to access this repository.', {
        status: 403,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    // 5. Repository not found
    if (!repo) {
      return ApiResponse.error('REPOSITORY_NOT_FOUND', `Repository with ID ${id} was not found.`, {
        status: 404,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    // 6. Explicit ownership sanity assertion
    if (repo.userId !== context.user.id && context.user.role !== 'admin') {
      return ApiResponse.error('FORBIDDEN_RESOURCE_ACCESS', 'You do not have permission to access this repository.', {
        status: 403,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    // 7. Fetch associated reviews safely ONLY for the authenticated owner's repository
    let reviewList: any[] = [];
    try {
      reviewList = await withDbTimeout(
        db.query.reviews.findMany({
          where: eq(reviews.repositoryId, repo.id),
        }),
        250
      );
    } catch {}

    if (reviewList.length === 0) {
      const dummyReview = DUMMY_REVIEWS.find(r => r.repositoryId === repo.id);
      if (dummyReview) {
        reviewList = [dummyReview];
      }
    }

    const safeRepo = {
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      htmlUrl: repo.htmlUrl,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      isAnalyzed: repo.isAnalyzed,
      analyzedAt: repo.analyzedAt,
      overallScore: repo.overallScore,
      healthScore: repo.healthScore,
      languagesBreakdown: repo.languagesBreakdown,
      latestReview: reviewList[0] ? {
        overallScore: reviewList[0].overallScore,
        summary: reviewList[0].summary,
        strengths: reviewList[0].strengths,
        createdAt: reviewList[0].createdAt,
      } : null,
    };

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: `/api/v1/repositories/${id}`,
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(safeRepo, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve repository details', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
