import { NextRequest } from 'next/server';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
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

  const { username } = await params;

  try {
    const result = await DeveloperCapabilityCardService.getPublicDCC(username);

    if (!result) {
      return ApiResponse.error('DEVELOPER_NOT_FOUND', `Developer @${username} was not found`, {
        status: 404,
        requestId,
        headers: rateLimit.headers,
      });
    }

    const d = result;
    const publicProfile = {
      username: d.username,
      name: d.name,
      avatarUrl: d.avatarUrl,
      bio: d.bio,
      location: d.location,
      overallScore: d.overallScore,
      level: d.level,
      confidenceScore: d.confidenceScore,
      verifiedSkills: d.verifiedSkills,
      engineeringCapabilities: d.engineeringCapabilities,
      projectCount: (d.projectEvidence || []).length,
      lastUpdated: d.lastUpdated,
      publicUrl: `/developer/${d.username}`,
    };

    ApiAnalyticsService.record({
      requestId,
      endpoint: `/api/v1/developers/${username}`,
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success(publicProfile, {
      requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve public developer profile', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
