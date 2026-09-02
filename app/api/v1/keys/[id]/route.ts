import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { PersonalAccessTokenService } from '@/services/api/tokens';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function DELETE(
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

  const rateLimit = ApiRateLimiter.check(context.user.id, 'management');
  if (rateLimit.isExceeded) {
    return ApiResponse.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down your requests.', {
      status: 429,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }

  const { id } = await params;

  try {
    const revoked = await PersonalAccessTokenService.revokeToken(context.user.id, id);

    if (!revoked) {
      return ApiResponse.error('TOKEN_NOT_FOUND', `Personal access token with ID ${id} was not found.`, {
        status: 404,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: `/api/v1/keys/${id}`,
      method: 'DELETE',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success({
      message: 'Personal access token revoked successfully.',
      tokenId: id,
    }, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to revoke personal access token', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
