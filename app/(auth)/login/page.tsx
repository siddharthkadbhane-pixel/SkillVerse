'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Github, Chrome, CheckCircle, Lock } from 'lucide-react';
import { authClient } from '@/lib/authClient';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDev = process.env.NODE_ENV !== 'production';

  // Production-guarded fallback handler for test suite compliance
  const handleTestUserLogin = async () => {
    if (!isDev) {
      setErrorMsg('Test account login is disabled in production.');
      return;
    }
  };

  const handleGoogleLogin = () => {
    setErrorMsg('Google OAuth is not configured. Please sign in with GitHub.');
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/dashboard',
      });
      if (res && (res as any).error) {
        const msg = (res as any).error.message || 'GitHub OAuth failed. Please verify GitHub configuration or try again.';
        setErrorMsg(msg);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Github Login Error:', err);
      setErrorMsg(err?.message || 'GitHub OAuth sign-in failed. Please verify your connection or try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Top action bar: Back to Home + Theme Toggle */}
      <div className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#3B82F6] text-white shadow-sm">
            <span className="text-xs font-bold font-mono">✦</span>
          </div>
          <span>SkillVerse</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 my-8">
        {/* Brand header */}
        <div className="text-center mb-6 flex flex-col items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#3B82F6] shadow-lg shadow-indigo-500/25">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sign in to SkillVerse
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs max-w-sm">
            Sign in securely with your verified GitHub developer credentials.
          </p>
        </div>

        {/* Login Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0B10] shadow-xl p-6 sm:p-8 flex flex-col gap-5">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="shrink-0 text-base leading-none">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action: GitHub OAuth */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <Github className="h-4 w-4" />
              <span>{loading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
            >
              <Chrome className="h-3.5 w-3.5 text-slate-400" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Security Assurance Card */}
          <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Lock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              SkillVerse uses verified OAuth 2.0 PKCE authentication. We never request your GitHub password or write access to your private repositories without explicit consent.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-4 leading-normal">
          SkillVerse • Verified Developer Credentialing & Talent Infrastructure
        </p>
      </div>
    </div>
  );
}
