import { NextRequest } from 'next/server';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { TeamEngine } from '@/services/team/engine';
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

  try {
    const { teams } = await TeamEngine.getTeams();

    ApiAnalyticsService.record({
      requestId,
      endpoint: '/api/v1/teams',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success(teams, {
      requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve teams list', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
