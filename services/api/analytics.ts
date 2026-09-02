import { db, withDbTimeout } from '@/lib/drizzle';
import { apiUsageLogs } from '@/database/schema';
import { ApiClientType } from '@/types/api';

interface RequestMetric {
  requestId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  clientType: ApiClientType;
  timestamp: number;
}

const metricsQueue: RequestMetric[] = [];
const MAX_METRICS_HISTORY = 1000;

export class ApiAnalyticsService {
  /**
   * Records an API request metric
   */
  public static record(metric: {
    requestId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    clientType: ApiClientType;
    userId?: string;
    tokenId?: string;
  }): void {
    const entry: RequestMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    metricsQueue.push(entry);
    if (metricsQueue.length > MAX_METRICS_HISTORY) {
      metricsQueue.shift();
    }

    // Persist to database asynchronously without blocking request lifecycle
    try {
      withDbTimeout(
        db.insert(apiUsageLogs).values({
          requestId: metric.requestId,
          userId: metric.userId,
          tokenId: metric.tokenId,
          clientType: metric.clientType,
          endpoint: metric.endpoint,
          method: metric.method,
          statusCode: metric.statusCode,
          durationMs: metric.durationMs,
          createdAt: new Date(),
        }),
        150
      ).catch(() => {});
    } catch {}
  }

  /**
   * Retrieves summary analytics for API usage
   */
  public static getSummary(): {
    totalRequests: number;
    errorRate: number;
    p95LatencyMs: number;
    avgLatencyMs: number;
    clientBreakdown: Record<ApiClientType, number>;
    topEndpoints: { endpoint: string; count: number }[];
  } {
    const total = metricsQueue.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        errorRate: 0,
        p95LatencyMs: 0,
        avgLatencyMs: 0,
        clientBreakdown: { web: 0, cli: 0, vscode: 0, api: 0, sdk: 0 },
        topEndpoints: [],
      };
    }

    let errorCount = 0;
    let totalLatency = 0;
    const latencies: number[] = [];
    const clientBreakdown: Record<ApiClientType, number> = {
      web: 0,
      cli: 0,
      vscode: 0,
      api: 0,
      sdk: 0,
    };
    const endpointCounts = new Map<string, number>();

    for (const m of metricsQueue) {
      if (m.statusCode >= 400) errorCount++;
      totalLatency += m.durationMs;
      latencies.push(m.durationMs);

      clientBreakdown[m.clientType] = (clientBreakdown[m.clientType] || 0) + 1;
      endpointCounts.set(m.endpoint, (endpointCounts.get(m.endpoint) || 0) + 1);
    }

    latencies.sort((a, b) => a - b);
    const p95Index = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);
    const p95LatencyMs = latencies[p95Index] || 0;
    const avgLatencyMs = Math.round(totalLatency / total);

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests: total,
      errorRate: Math.round((errorCount / total) * 100),
      p95LatencyMs,
      avgLatencyMs,
      clientBreakdown,
      topEndpoints,
    };
  }
}
