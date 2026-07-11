'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Github, ArrowRight, Chrome, Mail, Lock } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate OAuth redirection delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = createSupabaseBrowserClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          scopes: 'read:user repo',
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Github Login Error:', err);
      setErrorMsg(err.message || 'Failed to initialize GitHub login');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid-bg overflow-hidden flex items-center justify-center p-4">
      {/* Glow backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glow-effect" />

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/10">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Join the Trust Layer
          </h2>
          <p className="text-zinc-400 text-xs">
            Showcase verified telemetry instead of keyword claims.
          </p>
        </div>

        {/* Login Container (Neon Border wrapped) */}
        <div className="neon-border p-[1px]">
          <div className="rounded-xl bg-zinc-950 p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Sign In</h3>
              <p className="text-xs text-zinc-500">Welcome back to SkillVerse</p>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Social Logins */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 py-3 text-xs font-semibold text-white transition-all active:scale-98"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </button>
              
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 py-3 text-xs font-semibold text-white transition-all active:scale-98"
              >
                <Chrome className="h-4 w-4 text-zinc-400" />
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-[1px] bg-zinc-900 flex-grow" />
              <span className="text-[10px] uppercase font-bold text-zinc-600">or</span>
              <div className="h-[1px] bg-zinc-900 flex-grow" />
            </div>

            {/* Credentials Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-0.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-600" />
                  <input
                    type="email"
                    required
                    placeholder="name@work.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-850 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center pl-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                  <span className="text-[10px] text-zinc-500 hover:text-white cursor-pointer transition-colors">Forgot?</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-600" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-850 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white py-3 text-xs font-bold text-black hover:bg-zinc-200 transition-all active:scale-98 mt-2"
              >
                {loading ? 'Initializing session...' : 'Sign In with Email'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-zinc-600 mt-6 leading-normal">
          By signing in, you agree to our Terms of Service and authorize GitHub API telemetry auditing.
        </p>
      </div>
    </div>
  );
}
