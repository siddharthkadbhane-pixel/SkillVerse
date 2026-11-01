// Legacy client compatibility stub (Phase 44 Supabase Exit)
// Browser authentication is now handled via Better Auth client (lib/authClient.ts)

export const createSupabaseBrowserClient = () => ({
  auth: {
    signInWithOAuth: async () => ({
      data: null,
      error: new Error('Supabase client OAuth is deprecated. Use authClient.signIn.social() from @/lib/authClient.'),
    }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  },
});
