import { NextRequest } from 'next/server';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { TeamEngine } from '@/services/team/engine';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    const team = await TeamEngine.getTeamById(id);

    if (!team) {
      return ApiResponse.error('TEAM_NOT_FOUND', `Team with ID ${id} was not found.`, {
        status: 404,
        requestId,
        headers: rateLimit.headers,
      });
    }

    ApiAnalyticsService.record({
      requestId,
      endpoint: `/api/v1/teams/${id}`,
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success(team, {
      requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve team details', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
