import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { db, withDbTimeout } from '@/lib/drizzle';
import { repositories, reviews } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DUMMY_REPOSITORIES } from '@/lib/dummyData';
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
    try {
      repo = await withDbTimeout(
        db.query.repositories.findFirst({
          where: eq(repositories.id, id),
        }),
        250
      );
    } catch {}

    if (!repo) {
      repo = DUMMY_REPOSITORIES.find(r => r.id === id || r.name.toLowerCase() === id.toLowerCase());
    }

    if (!repo) {
      return ApiResponse.error('REPOSITORY_NOT_FOUND', `Repository with ID ${id} was not found.`, {
        status: 404,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    // Fetch associated reviews safely
    let reviewList: any[] = [];
    try {
      reviewList = await withDbTimeout(
        db.query.reviews.findMany({
          where: eq(reviews.repositoryId, repo.id),
        }),
        250
      );
    } catch {}

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
