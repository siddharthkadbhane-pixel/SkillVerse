import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { DCCEvidenceService } from '@/services/dcc/evidence';
import { VerificationIntegrityEngine } from '@/services/verification/integrity';
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

  if (!ApiAuthService.hasScope(context, 'read:evidence')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: read:evidence', {
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

  try {
    const projectEvidence = await DCCEvidenceService.compileProjectEvidence(context.user.id);
    const integritySummary = await VerificationIntegrityEngine.getVerificationIntegritySummary(context.user.id);

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/evidence',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success({
      projectEvidence,
      integritySummary,
    }, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve evidence audit logs', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
