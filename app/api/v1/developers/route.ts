import { NextRequest } from 'next/server';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { DeveloperSearchService } from '@/services/discovery/search';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ip = req.headers.get('x-forwarded-for') || 'public_client';

  const rateLimit = ApiRateLimiter.check(ip, 'public');
  if (rateLimit.isExceeded) {
    return ApiResponse.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down your requests.', {
      status: 429,
      requestId,
      headers: rateLimit.headers,
    });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const skill = searchParams.get('skill') || '';
  const status = searchParams.get('status') || 'all';
  const level = searchParams.get('level') || 'all';
  const sort = (searchParams.get('sort') as any) || 'relevance';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

  try {
    const discoveryResult = await DeveloperSearchService.searchDevelopers({
      q,
      skill,
      status: status as any,
      level: level as any,
      sort,
      page,
      limit,
    });

    ApiAnalyticsService.record({
      requestId,
      endpoint: '/api/v1/developers',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success(discoveryResult.developers, {
      requestId,
      headers: rateLimit.headers,
      pagination: {
        page: discoveryResult.pagination.page,
        limit: discoveryResult.pagination.limit,
        total: discoveryResult.pagination.totalCount,
        hasMore: discoveryResult.pagination.hasMore,
      },
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to search developer directory', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
