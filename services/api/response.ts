import { NextResponse } from 'next/server';
import { ApiSuccessPayload, ApiErrorDetails } from '@/types/api';

export class ApiResponse {
  /**
   * Generates standard successful API v1 response
   */
  static success<T>(
    data: T,
    options: {
      status?: number;
      requestId?: string;
      headers?: Record<string, string>;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    } = {}
  ): NextResponse<ApiSuccessPayload<T>> {
    const status = options.status || 200;
    const requestId = options.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payload: ApiSuccessPayload<T> = {
      version: 'v1',
      requestId,
      data,
      pagination: options.pagination,
    };

    const headers = new Headers(options.headers || {});
    headers.set('X-Request-Id', requestId);
    headers.set('X-API-Version', '1.0');
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(payload, {
      status,
      headers,
    });
  }

  /**
   * Generates standard error API v1 response with structured code and request ID
   */
  static error(
    code: string,
    message: string,
    options: {
      status?: number;
      requestId?: string;
      headers?: Record<string, string>;
      details?: any;
    } = {}
  ): NextResponse<{ error: ApiErrorDetails }> {
    const status = options.status || 400;
    const requestId = options.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const errorPayload: { error: ApiErrorDetails } = {
      error: {
        code,
        message,
        requestId,
        details: options.details,
      },
    };

    const headers = new Headers(options.headers || {});
    headers.set('X-Request-Id', requestId);
    headers.set('X-API-Version', '1.0');
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(errorPayload, {
      status,
      headers,
    });
  }
}
