import { NextResponse } from 'next/server';

/**
 * Backward compatibility redirect for legacy OAuth callbacks.
 * Primary OAuth authentication and PKCE code exchange is handled by Better Auth at /api/auth/callback/github.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (code) {
    const betterAuthCallbackUrl = new URL('/api/auth/callback/github', origin);
    betterAuthCallbackUrl.searchParams.set('code', code);
    if (state) betterAuthCallbackUrl.searchParams.set('state', state);
    return NextResponse.redirect(betterAuthCallbackUrl.toString());
  }

  return NextResponse.redirect(`${origin}${next}`);
}
