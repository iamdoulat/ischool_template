import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window rate-limit cache
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired IP entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 120000);

function getClientIp(request: NextRequest): string {
  // Respect Cloudflare CF-Connecting-IP, X-Forwarded-For, or X-Real-IP
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  return '127.0.0.1';
}

function checkRateLimit(ip: string, limit: number, windowMs: number, prefix: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, retryAfter: 0 };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, Next.js internal files, images, icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);

  // 1. Strict WAF Rate Limit for Login & Authentication Endpoints (Max 60 requests/minute per IP)
  const isAuthEndpoint = pathname === '/login' || pathname.startsWith('/api/v1/auth');
  if (isAuthEndpoint) {
    const { allowed, remaining, retryAfter } = checkRateLimit(clientIp, 60, 60000, 'auth');

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          status: 'error',
          message: 'Too Many Requests: Rate limit of 60 requests/min exceeded. Please try again shortly.',
          retry_after: retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '60');
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // 2. General Flood Protection for other pages & dynamic requests (Max 240 requests/minute per IP)
  const { allowed, remaining, retryAfter } = checkRateLimit(clientIp, 240, 60000, 'global');
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        message: 'High traffic detected. Please slow down.',
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
