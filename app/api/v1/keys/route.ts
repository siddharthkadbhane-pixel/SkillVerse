import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { PersonalAccessTokenService } from '@/services/api/tokens';
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

  const rateLimit = ApiRateLimiter.check(context.user.id, 'management');
  if (rateLimit.isExceeded) {
    return ApiResponse.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down your requests.', {
      status: 429,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }

  try {
    const tokens = await PersonalAccessTokenService.listTokens(context.user.id);

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/keys',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(tokens, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve personal access tokens', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json().catch(() => ({}));
    const { name, scopes, expiresInDays } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return ApiResponse.error('BAD_REQUEST', 'Token name is required.', {
        status: 400,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    const result = await PersonalAccessTokenService.createToken(
      context.user.id,
      name.trim(),
      Array.isArray(scopes) && scopes.length > 0 ? scopes : ['read:profile', 'read:dcc'],
      expiresInDays ? parseInt(expiresInDays, 10) : undefined
    );

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/keys',
      method: 'POST',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(
      {
        message: 'Personal Access Token created successfully. Copy the raw token now, as it will never be shown again.',
        token: result.token,
        rawToken: result.rawToken, // DISPLAYED ONCE
      },
      {
        status: 201,
        requestId: context.requestId,
        headers: rateLimit.headers,
      }
    );
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to create personal access token', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
