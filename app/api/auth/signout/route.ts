import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';

const COOKIES_TO_DECONTAMINATE = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
  'better-auth.session_data',
  '__Secure-better-auth.session_data',
  'better-auth.csrf_token',
  '__Secure-better-auth.csrf_token',
  'skillverse_demo_user',
  'sb-access-token',
  'sb-refresh-token',
];

export async function POST(req?: Request) {
  try {
    try {
      const cookieStore = await cookies();
      for (const name of COOKIES_TO_DECONTAMINATE) {
        cookieStore.delete(name);
      }
    } catch {
      // Context outside Next.js async storage (e.g. unit test runner)
    }

    try {
      const headersList = await headers();
      await auth.api.signOut({
        headers: headersList,
      });
    } catch {
      // Offline / circuit breaker / already revoked / test harness
    }

    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });

    // Ensure Set-Cookie deletion headers are explicitly attached to the HTTP response across all variants
    for (const name of COOKIES_TO_DECONTAMINATE) {
      response.cookies.set({
        name,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
