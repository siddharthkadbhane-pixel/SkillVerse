import { NextRequest } from 'next/server';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { ChallengeEngine } from '@/services/challenge/engine';
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
  const q = searchParams.get('q') || undefined;
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;
  const difficulty = searchParams.get('difficulty') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    const data = await ChallengeEngine.getChallenges({
      q,
      status: status as any,
      type: type as any,
      difficulty: difficulty as any,
    });

    const start = (page - 1) * limit;
    const paginatedChallenges = data.challenges.slice(start, start + limit);

    ApiAnalyticsService.record({
      requestId,
      endpoint: '/api/v1/challenges',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success(paginatedChallenges, {
      requestId,
      headers: rateLimit.headers,
      pagination: {
        page,
        limit,
        total: data.totalCount,
        hasMore: page * limit < data.totalCount,
      },
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve challenges list', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
