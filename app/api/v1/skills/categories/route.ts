import { NextRequest } from 'next/server';
import { ApiRateLimiter } from '@/services/api/rateLimiter';
import { ApiResponse } from '@/services/api/response';
import { CapabilityMappingService } from '@/services/capability/mapping';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(req: NextRequest) {
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

  try {
    const taxonomies = CapabilityMappingService.getAllTaxonomies();

    const categories = [
      { name: 'Languages', description: 'Core programming languages evaluated via AST complexity' },
      { name: 'Frontend', description: 'Web UI, rendering performance, state architecture' },
      { name: 'Backend', description: 'Microservices, APIs, concurrency, data streaming' },
      { name: 'Database', description: 'Query performance, indexing, schema normalization' },
      { name: 'DevOps & Cloud', description: 'CI/CD pipelines, containerization, cloud infrastructure' },
      { name: 'AI & ML', description: 'Model orchestration, vector memory, LLM pipelines' },
      { name: 'Testing & Tools', description: 'Unit testing, integration testing, static analysis' },
      { name: 'Architecture', description: 'System design, modular boundaries, security' },
    ];

    ApiAnalyticsService.record({
      requestId,
      endpoint: '/api/v1/skills/categories',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      clientType: 'api',
    });

    return ApiResponse.success({ categories, taxonomies }, {
      requestId,
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', 'Failed to retrieve skill categories', {
      status: 500,
      requestId,
      headers: rateLimit.headers,
    });
  }
}
