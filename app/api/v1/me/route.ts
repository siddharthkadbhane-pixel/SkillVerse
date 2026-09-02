import { NextRequest } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { SkillIntelligenceService } from '@/services/capability/engine';
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

  if (!ApiAuthService.hasScope(context, 'read:profile')) {
    return ApiResponse.error('FORBIDDEN_INSUFFICIENT_SCOPE', 'Missing required scope: read:profile', {
      status: 403,
      requestId: context.requestId,
    });
  }

  // Rate Limiting
  const rateLimit = ApiRateLimiter.check(context.user.id, 'authenticated');
  if (rateLimit.isExceeded) {
    return ApiResponse.error('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down your requests.', {
      status: 429,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }

  try {
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(context.user.id);
    const capabilities = await SkillIntelligenceService.getDeveloperCapabilities(context.user.id);

    const safeProfile = {
      id: context.user.id,
      name: context.user.name,
      username: context.user.username,
      email: context.user.email,
      role: context.user.role,
      avatarUrl: context.user.avatarUrl,
      dccSummary: {
        overallScore: fullDCC.card.overallScore,
        level: fullDCC.card.level,
        verificationStatus: fullDCC.card.verificationStatus,
        verifiedSkillsCount: fullDCC.verifiedSkills.length,
        lastUpdated: fullDCC.card.lastUpdated,
      },
      engineeringCapabilities: capabilities.slice(0, 5).map(c => ({
        capabilityName: c.capabilityName,
        category: c.category,
        level: c.level,
        verificationState: c.verificationState,
        confidence: c.confidenceScore,
        supportingSkills: c.supportingSkills,
      })),
      scopes: context.scopes,
      authMethod: context.authMethod,
    };

    ApiAnalyticsService.record({
      requestId: context.requestId,
      endpoint: '/api/v1/me',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: context.clientType,
      userId: context.user.id,
    });

    return ApiResponse.success(safeProfile, {
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve authenticated developer profile', {
      status: 500,
      requestId: context.requestId,
      headers: rateLimit.headers,
    });
  }
}
