import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { JobEngine } from '@/services/opportunity/engine';
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

  if (!ApiAuthService.hasScope(context, 'read:opportunities')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: read:opportunities', {
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

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const locationType = searchParams.get('locationType') || undefined;
  const roleType = searchParams.get('roleType') || undefined;
  const minDccScore = searchParams.get('minDccScore') ? parseInt(searchParams.get('minDccScore')!, 10) : undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    const opportunitiesData = await JobEngine.getJobs({
      q,
      locationType,
      roleType,
      minDccScore,
      page,
      limit,
    });

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/opportunities',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(opportunitiesData.jobs, {
      requestId: context.requestId,
      headers: rateLimit.headers,
      pagination: {
        page: opportunitiesData.pagination.page,
        limit: opportunitiesData.pagination.limit,
        total: opportunitiesData.pagination.total,
        hasMore: opportunitiesData.pagination.page * opportunitiesData.pagination.limit < opportunitiesData.pagination.total,
      },
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve opportunities list', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
