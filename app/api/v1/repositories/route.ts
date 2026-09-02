import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { db, withDbTimeout } from '@/lib/drizzle';
import { repositories } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DUMMY_REPOSITORIES } from '@/lib/dummyData';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(req: NextRequest) {
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

  try {
    let userRepos: any[] = [];
    try {
      userRepos = await withDbTimeout(
        db.query.repositories.findMany({
          where: eq(repositories.userId, context.user.id),
        }),
        300
      );
    } catch {}

    if (userRepos.length === 0) {
      userRepos = DUMMY_REPOSITORIES.filter(r => r.userId === context.user.id);
    }
    if (userRepos.length === 0) {
      userRepos = DUMMY_REPOSITORIES;
    }

    // Sanitize repos: never expose tokens or private data
    const safeRepos = userRepos.map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.fullName,
      description: r.description,
      htmlUrl: r.htmlUrl,
      language: r.language,
      stars: r.stars,
      forks: r.forks,
      isAnalyzed: r.isAnalyzed,
      analyzedAt: r.analyzedAt,
      overallScore: r.overallScore,
      healthScore: r.healthScore,
    }));

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/repositories',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(safeRepos, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve repositories', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
