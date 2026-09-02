import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { WebhookEngine } from '@/services/webhooks/engine';
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

  if (!ApiAuthService.hasScope(context, 'write:webhooks')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: write:webhooks', {
      status: 403,
      requestId: context.requestId,
    });
  }

  const rateLimit = ApiRateLimiter.check(context.user.id, 'management');
  if (rateLimit.isExceeded) {
    return ApiResponse.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down your requests.', {
      status: 429,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }

  try {
    const webhooksList = await WebhookEngine.listWebhooks(context.user.id);

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/webhooks',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(webhooksList, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve webhook subscriptions', {
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

  if (!ApiAuthService.hasScope(context, 'write:webhooks')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: write:webhooks', {
      status: 403,
      requestId: context.requestId,
    });
  }

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
    const { url, events, description } = body;

    if (!url || typeof url !== 'string') {
      return ApiResponse.error('BAD_REQUEST', 'A valid destination URL is required.', {
        status: 400,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return ApiResponse.error('BAD_REQUEST', 'At least one event type must be specified.', {
        status: 400,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    const newSub = await WebhookEngine.subscribe(
      context.user.id,
      url.trim(),
      events,
      description
    );

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/webhooks',
      method: 'POST',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(
      {
        message: 'Webhook subscription created successfully. Store the secret to verify HMAC-SHA256 signatures.',
        webhook: newSub,
      },
      {
        status: 201,
        requestId: context.requestId,
        headers: rateLimit.headers,
      }
    );
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', error.message || 'Failed to create webhook subscription', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
