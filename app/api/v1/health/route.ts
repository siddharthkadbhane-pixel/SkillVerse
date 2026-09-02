import { NextRequest } from 'next/server';
import { ApiResponse } from '@/services/api/response';
import { checkDbAvailability } from '@/lib/drizzle';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const isDbLive = checkDbAvailability();
  const metrics = ApiAnalyticsService.getSummary();

  const healthData = {
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      apiGateway: 'operational',
      dccEngine: 'operational',
      verificationPipeline: 'operational',
      astAnalyzer: 'operational',
      webhookDispatcher: 'operational',
      database: isDbLive ? 'connected' : 'circuit_breaker_open_fallback_mode',
    },
    metrics: {
      totalRequestsServed: metrics.totalRequests,
      errorRatePercent: metrics.errorRate,
      p95LatencyMs: metrics.p95LatencyMs,
    },
  };

  return ApiResponse.success(healthData, {
    requestId,
  });
}
