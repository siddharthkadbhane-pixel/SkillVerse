import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { JobEngine } from '@/services/opportunity/engine';
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

  if (!ApiAuthService.hasScope(context, 'write:applications')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: write:applications', {
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

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const note = body.note || '';

    const applyResult = await JobEngine.applyToJob(id, context.user.id, note);

    if (!applyResult.success) {
      return ApiResponse.error('APPLICATION_FAILED', applyResult.error || 'Failed to submit application', {
        status: 400,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    // Trigger webhook event
    WebhookEngine.dispatch('application.updated', {
      opportunityId: id,
      applicationId: applyResult.application?.id,
      applicantId: context.user.id,
      status: 'applied',
    }, context.user.id).catch(() => {});

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: `/api/v1/opportunities/${id}/apply`,
      method: 'POST',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success({
      message: 'Application submitted successfully with verified DCC capability proof.',
      application: applyResult.application,
    }, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to apply to opportunity', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
