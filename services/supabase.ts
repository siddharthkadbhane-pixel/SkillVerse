// SkillVerse Authentication Service Bridge (Phase 44 Supabase Exit)
// Delegates all active session and authorization operations to Better Auth
// Preserves complete backward compatibility for 90+ existing route consumers

export { getSessionUser, isDemoAuthEnabled, type SessionUser } from '@/services/auth/session';

/**
 * Legacy compatibility stub for createSupabaseServerClient.
 * Runtime session management is fully handled by Better Auth (lib/auth.ts).
 */
export async function createSupabaseServerClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async (_code: string) => ({
        data: null,
        error: new Error('Supabase Auth is deprecated. Please authenticate via Better Auth (/api/auth).'),
      }),
    },
  };
}
