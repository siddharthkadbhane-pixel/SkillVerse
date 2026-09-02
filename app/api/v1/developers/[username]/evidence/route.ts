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

    // Sanitize evidence: extract only safe verification summaries
    const safeEvidence = {
      username: result.username,
      totalProjectsVerified: (result.projectEvidence || []).length,
      projectEvidence: (result.projectEvidence || []).map((p: any) => ({
        name: p.name,
        fullName: p.fullName,
        isAnalyzed: p.isAnalyzed,
        overallScore: p.overallScore,
        codeQualityScore: p.codeQualityScore,
        architectureScore: p.architectureScore,
        strengths: p.strengths,
        demonstratedSkills: p.demonstratedSkills,
      })),
      verifiedSkillsEvidence: (result.verifiedSkills || []).map((s: any) => ({
        skillName: s.name,
        level: s.level,
        status: s.status,
        confidence: s.confidence,
        evidenceCount: s.evidenceCount,
        whyVerified: s.whyVerified,
        lastVerifiedDate: s.lastVerifiedDate,
      })),
    };

    ApiAnalyticsService.record({
      requestId,
      endpoint: `/api/v1/developers/${username}/evidence`,
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success(safeEvidence, {
      requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve developer evidence audit trail', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
