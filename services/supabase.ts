import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DUMMY_USERS, getDummyUserById } from '@/lib/dummyData';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method can be called from a Server Component,
            // which cannot write cookies. We can ignore this error safely.
          }
        },
      },
    }
  );
}

// Determine if demo test authentication is explicitly permitted in this environment
export function isDemoAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ENABLE_DEMO_AUTH === 'true';
  }
  // In development and testing, enabled unless explicitly turned off
  return process.env.ENABLE_DEMO_AUTH !== 'false';
}

// Get active session user info (strictly enforcing authenticated sessions in production)
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();

    // 1. Try real Supabase auth session
    try {
      const supabase = await createSupabaseServerClient();
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase auth timeout')), 2500)
      );
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);
      if (user && user.id) {
        return user;
      }
    } catch {
      // Supabase connection unavailable, timed out, or unauthenticated
    }

    // 2. Check for active demo test user cookie ONLY if demo auth is explicitly enabled
    if (isDemoAuthEnabled()) {
      const demoUserId = cookieStore.get('skillverse_demo_user')?.value;
      if (demoUserId) {
        const testUser = DUMMY_USERS.find((u) => u.id === demoUserId);
        if (testUser) {
          // Return normalized user object compatible with Supabase Auth shape and SkillVerse DB
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
          } as any;
        }
      }
    }

    // Unauthenticated request
    return null;
  } catch (error) {
    // In case of error (e.g. called outside request scope), log safe diagnostic and return null
    return null;
  }
}

