import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { WebhookEngine } from '@/services/webhooks/engine';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function POST(
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

  const { id } = await params;

  try {
    // Verify webhook exists and belongs to authenticated context user (Anti-IDOR)
    const webhook = await WebhookEngine.getWebhook(id);
    if (!webhook) {
      return ApiResponse.error('WEBHOOK_NOT_FOUND', 'Webhook subscription was not found.', {
        status: 404,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    if (webhook.userId !== context.user.id && context.user.role !== 'admin') {
      return ApiResponse.error('FORBIDDEN_RESOURCE_ACCESS', 'You do not have permission to test this webhook subscription.', {
        status: 403,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    const testPayload = {
      test: true,
      event: 'developer.updated',
      developer: {
        id: context.user.id,
        username: context.user.username,
        name: context.user.name,
      },
      message: 'This is a verified test webhook dispatch from SkillVerse Developer Platform.',
      dispatchedAt: new Date().toISOString(),
    };

    const dispatchResult = await WebhookEngine.dispatch('developer.updated', testPayload, context.user.id);

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: `/api/v1/webhooks/${id}/test`,
      method: 'POST',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success({
      message: 'Test webhook event dispatched successfully.',
      dispatchedCount: dispatchResult.dispatchedCount,
      deliveries: dispatchResult.deliveries,
    }, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to dispatch test webhook event', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
