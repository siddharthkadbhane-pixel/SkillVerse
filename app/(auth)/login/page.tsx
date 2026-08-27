'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Github, ArrowRight, Chrome, Mail, Lock, Sparkles, UserCheck, Briefcase, Building2, Cpu, CheckCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { DUMMY_USERS } from '@/lib/dummyData';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeUserSwitching, setActiveUserSwitching] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('siddharth@skillverse.dev');
  const [passwordInput, setPasswordInput] = useState('password123');

  const handleTestUserLogin = async (user: typeof DUMMY_USERS[0]) => {
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
        throw new Error('Failed to set test session');
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

    try {
      // Find matching dummy user or fallback to primary developer
      const matchedUser = DUMMY_USERS.find(u => u.email.toLowerCase() === emailInput.toLowerCase()) || DUMMY_USERS[0];
      await handleTestUserLogin(matchedUser);
    } catch {
      router.push('/dashboard');
    }
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
      setErrorMsg(err.message || 'GitHub OAuth failed. Using instant test account instead.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 aurora-bg dot-matrix" style={{ background: '#08090D' }}>
      {/* Glow accents */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] ambient-glow-1 pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] ambient-glow-2 pointer-events-none" />

      <div className="w-full max-w-xl z-10 my-8">
        {/* Brand header */}
        <div className="text-center mb-6 flex flex-col items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25 animate-pulse-glow">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight heading-font">
            SkillVerse Test & Demo Portal
          </h2>
          <p className="text-muted text-xs max-w-md">
            Choose a verified persona below for instant 1-click evaluation, or sign in with custom credentials.
          </p>
        </div>

        {/* Login Container with gradient border */}
        <div className="neon-border p-[1px]">
          <div className="rounded-xl p-6 sm:p-8 flex flex-col gap-6" style={{ background: '#0A0B10' }}>
            
            {/* ═══ SECTION: 1-CLICK TEST ACCOUNTS ═══ */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Instant Test Accounts (1-Click Login)
                </span>
                <span className="text-[10px] text-dim font-mono">No OAuth required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DUMMY_USERS.map((user) => {
                  const isSwitching = activeUserSwitching === user.id;
                  const isDev = user.role === 'developer';
                  const isRecruiter = user.role === 'recruiter';
                  const isAdmin = user.role === 'company_admin';

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleTestUserLogin(user)}
                      disabled={loading}
                      type="button"
                      className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3 group relative overflow-hidden ${
                        user.username === 'siddharthkadbhane-pixel' ? 'sm:col-span-2 bg-gradient-to-r from-violet-950/40 via-purple-900/20 to-cyan-950/30 border-violet-500/30' : 'bg-elevated/70 border-white/5 hover:border-accent-muted'
                      }`}
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-accent transition-colors truncate">
                            {user.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                            isAdmin ? 'bg-pink-500/20 text-pink-300' :
                            isRecruiter ? 'bg-amber-500/20 text-amber-300' :
                            user.dccLevel === 'Elite' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {isAdmin ? 'Admin' : isRecruiter ? 'Recruiter' : user.dccLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-dim truncate mt-0.5">{user.tagline}</p>
                        {isDev && (
                          <div className="flex items-center gap-3 text-[10px] text-muted mt-1 font-mono">
                            <span>Score: <b className="text-white">{user.trustScore.overallScore}</b>/1000</span>
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

            {errorMsg && (
              <div className="rounded-lg bg-danger-dim border border-danger/20 p-3 text-xs text-danger flex items-center gap-2">
                <span className="shrink-0">⚠</span>
                {errorMsg}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-grow" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] uppercase font-bold text-dim">Or Sign In with OAuth / Email</span>
              <div className="h-[1px] flex-grow" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleGithubLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-elevated border py-2.5 text-xs font-semibold text-white transition-all active:scale-98 hover:border-accent-muted hover:bg-hover group"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Github className="h-4 w-4 group-hover:text-accent-hover transition-colors" />
                GitHub
              </button>
              
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-elevated border py-2.5 text-xs font-semibold text-white transition-all active:scale-98 hover:border-accent-muted hover:bg-hover group"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Chrome className="h-4 w-4 text-muted group-hover:text-accent-hover transition-colors" />
                Google
              </button>
            </div>

            {/* Credentials Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-dim pl-0.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-dim" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@work.com"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-elevated border rounded-lg text-white placeholder-dim focus:outline-none focus:border-accent-muted focus:ring-2 focus:ring-accent-dim transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center pl-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-dim">Password</label>
                  <span className="text-[10px] text-dim hover:text-accent-hover cursor-pointer transition-colors">Forgot?</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-dim" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-elevated border rounded-lg text-white placeholder-dim focus:outline-none focus:border-accent-muted focus:ring-2 focus:ring-accent-dim transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white transition-all active:scale-98 mt-1 relative overflow-hidden"
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
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-dim mt-4 leading-normal">
          SkillVerse Test Suite &bull; Instant multi-role sandbox enabled &bull; Telemetry verification active
        </p>
      </div>
    </div>
  );
}
