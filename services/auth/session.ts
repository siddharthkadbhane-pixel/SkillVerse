import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { DUMMY_USERS } from '@/lib/dummyData';
import { checkDbAvailability } from '@/lib/drizzle';

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  username: string;
  avatarUrl?: string;
  role: string;
  githubId?: string;
  user_metadata?: {
    full_name?: string;
    user_name?: string;
    avatar_url?: string;
    email?: string;
    sub?: string;
  };
  app_metadata?: {
    provider?: string;
    role?: string;
  };
  createdAt?: string;
}

/**
 * Determine if demo test authentication is explicitly permitted in this environment
 */
export function isDemoAuthEnabled(): boolean {
  // Demo authentication is strictly and unconditionally prohibited in production mode
  // Regardless of environment variable misconfigurations or override attempts
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  // In development and testing, enabled unless explicitly turned off
  return process.env.ENABLE_DEMO_AUTH !== 'false';
}

/**
 * Get active session user info (Better Auth with fail-closed security and demo fallback)
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    // Fast check for Better Auth session token cookie presence
    const hasBetterAuthCookie =
      cookieStore.has('better-auth.session_token') ||
      cookieStore.has('__Secure-better-auth.session_token');

    // 1. Try Better Auth session resolution if database is available
    if (checkDbAvailability()) {
      try {
        const session = await auth.api.getSession({
          headers: headersList,
        });

        if (session && session.user && session.user.id) {
          const u = session.user as any;
          return {
            id: u.id,
            email: u.email,
            name: u.name || u.username || 'Developer',
            username: u.username || u.name || u.email?.split('@')[0] || 'developer',
            avatarUrl: u.avatarUrl || u.image || '',
            role: u.role || 'developer',
            githubId: u.githubId,
            user_metadata: {
              full_name: u.name,
              user_name: u.username || u.name,
              avatar_url: u.avatarUrl || u.image,
              email: u.email,
              sub: u.githubId,
            },
            app_metadata: {
              provider: 'github',
              role: u.role || 'developer',
            },
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          };
        }
      } catch (err: any) {
        // If an explicit session cookie was sent by the client, a database error must fail-closed
        // Never fall through to demo credentials when a real session was intended but failed
        if (hasBetterAuthCookie) {
          console.error('[SessionAuth] Error validating existing session cookie:', err?.message || err);
          return null;
        }
      }
    }

    // 2. Check for active demo test user cookie ONLY if demo auth is explicitly enabled
    // and no Better Auth session cookie was sent
    if (isDemoAuthEnabled() && !hasBetterAuthCookie) {
      const demoUserId = cookieStore.get('skillverse_demo_user')?.value;
      if (demoUserId) {
        const testUser = DUMMY_USERS.find((u) => u.id === demoUserId);
        if (testUser) {
          return {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            username: testUser.username,
            avatarUrl: testUser.avatarUrl,
            role: testUser.role,
            githubId: testUser.githubId,
            user_metadata: {
              full_name: testUser.name,
              user_name: testUser.username,
              avatar_url: testUser.avatarUrl,
              email: testUser.email,
              sub: testUser.githubId,
            },
            app_metadata: {
              provider: 'demo',
              role: testUser.role,
            },
            createdAt: new Date().toISOString(),
          };
        }
      }
    }

    // Unauthenticated request
    return null;
  } catch {
    // In case of execution outside request scope, return null
    return null;
  }
}
