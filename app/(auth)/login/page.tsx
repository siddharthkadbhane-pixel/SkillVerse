'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Github, ArrowRight, Chrome, Mail, Lock, Sparkles, UserCheck, Briefcase, Building2, Cpu, CheckCircle } from 'lucide-react';
import { authClient } from '@/lib/authClient';
import { DUMMY_USERS } from '@/lib/dummyData';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeUserSwitching, setActiveUserSwitching] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('siddharth@skillverse.dev');
  const [passwordInput, setPasswordInput] = useState('password123');

  const isDev = process.env.NODE_ENV !== 'production';

  const handleTestUserLogin = async (user: typeof DUMMY_USERS[0]) => {
    if (!isDev) {
      setErrorMsg('Test account login is disabled in production.');
      return;
    }

    try {
      setActiveUserSwitching(user.id);
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initialize test session');
      }

      // Route according to role
      const targetUrl = user.role === 'recruiter' ? '/recruiter/dcc' : '/dashboard';
      router.push(targetUrl);
    } catch (err: any) {
      console.error('Demo Login Error:', err);
      setErrorMsg(err.message || 'Failed to switch demo account');
      setLoading(false);
      setActiveUserSwitching(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!isDev) {
      setErrorMsg('Direct email/password login is not supported in production. Please sign in with GitHub.');
      setLoading(false);
      return;
    }

    // In local development sandbox only, find matching test persona if exists
    const matchedUser = DUMMY_USERS.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
    if (matchedUser) {
      await handleTestUserLogin(matchedUser);
    } else {
      setErrorMsg('No development test account found for this email. Use an instant test persona or sign in with GitHub.');
      setLoading(false);
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

      <div className="w-full max-w-xl z-10 my-8">
        {/* Brand header */}
        <div className="text-center mb-6 flex flex-col items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#3B82F6] shadow-lg shadow-indigo-500/25">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isDev ? 'SkillVerse Test & Demo Portal' : 'Sign in to SkillVerse'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs max-w-md">
            {isDev
              ? 'Choose a verified persona below for instant 1-click evaluation, or sign in with custom credentials.'
              : 'Sign in securely with your verified GitHub developer credentials.'}
          </p>
        </div>

        {/* Login Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0B10] shadow-xl p-6 sm:p-8 flex flex-col gap-6">

          {/* ═══ SECTION: 1-CLICK TEST ACCOUNTS (DEV ONLY) ═══ */}
          {isDev && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Instant Test Accounts (1-Click Login)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">No OAuth required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DUMMY_USERS.map((user) => {
                  const isSwitching = activeUserSwitching === user.id;
                  const isDevUser = user.role === 'developer';
                  const isRecruiter = user.role === 'recruiter';
                  const isAdmin = user.role === 'company_admin';

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleTestUserLogin(user)}
                      disabled={loading}
                      type="button"
                      className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 group relative overflow-hidden ${
                        user.username === 'siddharthkadbhane-pixel'
                          ? 'sm:col-span-2 bg-gradient-to-r from-indigo-50/80 dark:from-indigo-950/40 via-blue-50/50 dark:via-blue-900/20 to-teal-50/50 dark:to-teal-950/30 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400'
                          : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-slate-100/60 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {user.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                            isAdmin ? 'bg-pink-500/15 text-pink-600 dark:text-pink-300' :
                            isRecruiter ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300' :
                            user.dccLevel === 'Elite' ? 'bg-[#14B8A6]/15 text-[#0D9488] dark:text-[#14B8A6]' :
                            'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                          }`}>
                            {isAdmin ? 'Admin' : isRecruiter ? 'Recruiter' : user.dccLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.tagline}</p>
                        {isDevUser && (
                          <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono">
                            <span>Score: <b className="text-slate-900 dark:text-white">{user.trustScore.overallScore}</b>/1000</span>
                            <span>@{user.username}</span>
                          </div>
                        )}
                      </div>
                      {isSwitching && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-white">
                          <span className="sv-spinner" style={{ width: 14, height: 14 }} />
                          Entering...
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="shrink-0">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-grow bg-slate-200 dark:bg-white/[0.08]" />
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              {isDev ? 'Or Sign In with OAuth / Email' : 'Or Continue With'}
            </span>
            <div className="h-[1px] flex-grow bg-slate-200 dark:bg-white/[0.08]" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleGithubLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 py-2.5 text-xs font-semibold text-slate-800 dark:text-white transition-all active:scale-98 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] group"
            >
              <Github className="h-4 w-4 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              GitHub
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 py-2.5 text-xs font-semibold text-slate-800 dark:text-white transition-all active:scale-98 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] group"
            >
              <Chrome className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              Google
            </button>
          </div>

          {/* Credentials Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-0.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@work.com"
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center pl-0.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all active:scale-98 mt-1 relative overflow-hidden"
            >
              {loading && !activeUserSwitching ? (
                <span className="flex items-center gap-2">
                  <span className="sv-spinner" style={{ width: 12, height: 12 }} />
                  Initializing session...
                </span>
              ) : (
                <>
                  Sign In with Email
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-4 leading-normal">
          {isDev
            ? 'SkillVerse Development Sandbox • Instant multi-role sandbox enabled • Telemetry verification active'
            : 'SkillVerse • Verified Developer Credentialing & Talent Infrastructure'}
        </p>
      </div>
    </div>
  );
}
