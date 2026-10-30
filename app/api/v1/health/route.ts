import { NextRequest } from 'next/server';
import { ApiResponse } from '@/services/api/response';
import { checkDbAvailability, getDbMetrics } from '@/lib/drizzle';
import { ApiAnalyticsService } from '@/services/api/analytics';

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const isDbLive = checkDbAvailability();
  const metrics = ApiAnalyticsService.getSummary();
  const dbReliability = getDbMetrics();

  const healthData = {
    status: isDbLive ? 'healthy' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      apiGateway: 'operational',
      dccEngine: 'operational',
      verificationPipeline: 'operational',
      astAnalyzer: 'operational',
      webhookDispatcher: 'operational',
      database: isDbLive ? 'connected' : `circuit_breaker_${dbReliability.state.toLowerCase()}`,
    },
    metrics: {
      totalRequestsServed: metrics.totalRequests,
      errorRatePercent: metrics.errorRate,
      p95LatencyMs: metrics.p95LatencyMs,
    },
    databaseReliability: {
      circuitBreakerState: dbReliability.state,
      totalQueries: dbReliability.totalQueries,
      successfulQueries: dbReliability.successfulQueries,
      timedOutQueries: dbReliability.timedOutQueries,
      failedQueries: dbReliability.failedQueries,
      circuitBreakerTrips: dbReliability.circuitBreakerTrips,
      recoveredCount: dbReliability.recoveredCount,
    },
  };

  return ApiResponse.success(healthData, {
    requestId,
  });
}
