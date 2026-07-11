import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/services/supabase';
import { db } from '@/lib/drizzle';
import { users } from '@/database/schema';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data?.session) {
        const user = data.user;
        const providerToken = data.session.provider_token; // GitHub Access Token
        
        const githubUsername = user.user_metadata.user_name || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
        const fullName = user.user_metadata.full_name || githubUsername;
        const avatarUrl = user.user_metadata.avatar_url || '';
        const githubId = String(user.user_metadata.sub || '');

        try {
          // Upsert into our public users table
          await db
            .insert(users)
            .values({
              id: user.id, // Match Supabase Auth UUID
              email: user.email!,
              name: fullName,
              username: githubUsername,
              avatarUrl,
              githubId,
              githubToken: providerToken || null,
              role: 'developer',
            })
            .onConflictDoUpdate({
              target: users.id,
              set: {
                name: fullName,
                username: githubUsername,
                avatarUrl,
                githubToken: providerToken || null,
                updatedAt: new Date(),
              },
            });
        } catch (dbError) {
          console.error('Failed to upsert user into database:', dbError);
        }

        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('Supabase Auth error:', error);
      }
    } catch (err) {
      console.error('Authorization callback processing error:', err);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
