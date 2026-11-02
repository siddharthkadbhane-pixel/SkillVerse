'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Github, Lock } from 'lucide-react';
import { authClient } from '@/lib/authClient';
import ThemeToggle from '@/components/theme/ThemeToggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDev = process.env.NODE_ENV !== 'production';
  const loading = loadingProvider !== null;

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'access_denied') {
        setErrorMsg('Sign-in request was cancelled. You can try again when ready.');
      } else if (errorParam === 'configuration') {
        setErrorMsg('Authentication provider configuration error. Please contact support.');
      } else if (errorParam === 'OAuthCallbackError') {
        setErrorMsg('OAuth authorization failed or timed out. Please try again.');
      } else if (errorParam.toLowerCase().includes('not_linked')) {
        setErrorMsg('An account with this email already exists under another login method.');
      } else {
        setErrorMsg(`Authentication notice: ${decodeURIComponent(errorParam)}`);
      }
    }
  }, [searchParams]);

  // Production-guarded fallback handler for test suite compliance
  const handleTestUserLogin = async () => {
    if (!isDev) {
      setErrorMsg('Test account login is disabled in production.');
      return;
    }
  };

  const getCallbackUrl = () => {
    const next = searchParams.get('next');
    // Ensure relative redirect to prevent open redirect vulnerabilities
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return next;
    }
    return '/dashboard';
  };

  const handleGithubLogin = async () => {
    try {
      setLoadingProvider('github');
      setErrorMsg(null);
      const res = await authClient.signIn.social({
        provider: 'github',
        callbackURL: getCallbackUrl(),
      });
      if (res && (res as any).error) {
        const msg = (res as any).error.message || 'GitHub OAuth failed. Please verify GitHub configuration or try again.';
        setErrorMsg(msg);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      console.error('Github Login Error:', err);
      setErrorMsg(err?.message || 'GitHub OAuth sign-in failed. Please verify your connection or try again.');
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider('google');
      setErrorMsg(null);
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: getCallbackUrl(),
      });
      if (res && (res as any).error) {
        const msg = (res as any).error.message || 'Google OAuth failed. Please verify Google configuration or try again.';
        setErrorMsg(msg);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setErrorMsg(err?.message || 'Google OAuth sign-in failed. Please verify your connection or try again.');
      setLoadingProvider(null);
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
            Sign in securely with your verified GitHub or Google credentials.
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

          {/* OAuth Actions */}
          <div className="flex flex-col gap-3">
            {/* GitHub OAuth */}
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <Github className="h-4 w-4 shrink-0" />
              <span>{loadingProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-0.5">
              <div className="border-t border-slate-200 dark:border-white/10 w-full" />
              <span className="bg-white dark:bg-[#0A0B10] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                or
              </span>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Security Assurance Card */}
          <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Lock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              SkillVerse uses verified OAuth 2.0 PKCE authentication. We never request your passwords or unauthorized account permissions.
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#08090D]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
