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

// Get active session user info (with seamless Demo Test User support)
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    
    // 1. Try real Supabase auth session
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return user;
      }
    } catch {
      // Supabase connection unavailable or not configured, continue to demo user
    }

    // 2. Check for active demo test user cookie
    const demoUserId = cookieStore.get('skillverse_demo_user')?.value;
    const testUser = getDummyUserById(demoUserId);

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
  } catch (error) {
    console.error('Error fetching session user, falling back to default test developer:', error);
    const defaultUser = DUMMY_USERS[0];
    return {
      id: defaultUser.id,
      email: defaultUser.email,
      name: defaultUser.name,
      username: defaultUser.username,
      avatarUrl: defaultUser.avatarUrl,
      role: defaultUser.role,
      githubId: defaultUser.githubId,
      user_metadata: {
        full_name: defaultUser.name,
        user_name: defaultUser.username,
        avatar_url: defaultUser.avatarUrl,
      },
    } as any;
  }
}

