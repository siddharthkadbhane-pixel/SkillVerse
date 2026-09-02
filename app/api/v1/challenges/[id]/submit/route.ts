import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { ChallengeEngine } from '@/services/challenge/engine';
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

  if (!ApiAuthService.hasScope(context, 'write:submissions')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: write:submissions', {
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
    const { repositoryUrl, description, liveDemoUrl, teamId } = body;

    if (!repositoryUrl) {
      return ApiResponse.error('BAD_REQUEST', 'repositoryUrl is required for challenge submission', {
        status: 400,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    const submissionResult = await ChallengeEngine.submitSolution(id, context.user.id, {
      repositoryUrl,
      liveDemoUrl,
      description,
      teamId,
    });

    if (!submissionResult.success) {
      return ApiResponse.error('SUBMISSION_FAILED', submissionResult.message || 'Failed to submit challenge solution', {
        status: 400,
        requestId: context.requestId,
        headers: rateLimit.headers,
      });
    }

    // Trigger webhook event
    WebhookEngine.dispatch('challenge.completed', {
      challengeId: id,
      submissionId: submissionResult.submission?.id,
      userId: context.user.id,
      repositoryUrl,
    }, context.user.id).catch(() => {});

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: `/api/v1/challenges/${id}/submit`,
      method: 'POST',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success({
      message: 'Challenge solution submitted successfully and queued for AST verification.',
      submission: submissionResult.submission,
    }, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to submit challenge solution', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
