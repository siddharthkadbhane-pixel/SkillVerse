import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Global In-Memory Rate Limiter Map for edge/middleware protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 180; // Generous default burst limit per IP

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 1. Global API Rate Limiting for /api/ routes
  if (pathname.startsWith('/api/')) {
    const now = Date.now();
    const rateData = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    } else {
      rateData.count += 1;
    }

    rateLimitMap.set(clientIp, rateData);

    // Block if rate limit exceeded (excluding health check endpoint)
    if (rateData.count > MAX_REQUESTS_PER_MINUTE && pathname !== '/api/health' && pathname !== '/api/ping') {
      const retryAfter = Math.ceil((rateData.resetTime - now) / 1000);
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please retry after ' + retryAfter + ' seconds.',
          requestId,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateData.resetTime / 1000).toString(),
            'X-Request-Id': requestId,
          },
        }
      );
    }
  }

  // 2. Request Size Guard for POST / PUT / PATCH payloads (> 5MB rejected early)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Payload Too Large',
        message: 'Request payload exceeds maximum permitted size of 5MB.',
        requestId,
      }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      }
    );
  }

  // 3. Clone response and inject Enterprise Security Headers
  const response = NextResponse.next();

  // Correlation Request ID
  response.headers.set('X-Request-Id', requestId);

  // Content Security Policy (CSP)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://avatars.githubusercontent.com https://*.githubassets.com",
    "connect-src 'self' https://api.github.com https://api-inference.huggingface.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
