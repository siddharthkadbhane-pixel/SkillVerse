'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle2, ChevronRight, Star, Terminal, Code2, Cpu, Globe, Check, X, ShieldCheck, Sparkles, Zap, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-canvas dot-matrix flex flex-col justify-between selection:bg-violet-500/30 selection:text-white aurora-bg">
      
      {/* Immersive radial glow lights */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] ambient-glow-1 pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[5%] w-[700px] h-[700px] ambient-glow-2 pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] ambient-glow-3 pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-canvas/60 backdrop-blur-xl" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white heading-font">
              SkillVerse
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/developers" className="text-xs font-semibold text-[#A78BFA] hover:text-white transition-colors">
              Discover Talent
            </Link>
            <a href="#pipeline" className="text-xs font-semibold text-secondary hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#comparison" className="text-xs font-semibold text-secondary hover:text-white transition-colors hidden sm:block">
              Compare
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-elevated border hover:border-accent-muted px-4.5 py-2.5 text-xs font-bold text-white transition-all active:scale-95"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Presentation */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-36 z-10 flex flex-col gap-32 items-center">
        
        {/* Intro */}
        <div className="text-center max-w-3xl flex flex-col gap-6 items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-dim border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-hover"
               style={{ borderColor: 'rgba(139,92,246,0.25)' }}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Trust Layer for Code Quality</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.08] heading-font">
            Prove your code.{<br />}
            <span className="text-gradient">
              Skip the resume.
            </span>
          </h1>
          
          <p className="text-secondary text-sm sm:text-base max-w-lg leading-relaxed font-normal">
            SkillVerse replaces generic claims and unverified resumes with AI-driven repository reviews, cryptographic reputation points, and verified Git timelines.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link
              href="/login"
              className="btn-primary flex items-center justify-center gap-2 rounded-xl text-white font-bold px-7 py-3.5 text-xs active:scale-98 relative overflow-hidden"
            >
              Get Started with GitHub
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/developers"
              className="flex items-center justify-center gap-2 rounded-xl bg-elevated border text-[#F8FAFC] font-semibold px-7 py-3.5 text-xs hover:bg-hover hover:border-[#7C3AED]/40 transition-all active:scale-98"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <Search className="h-3.5 w-3.5 text-[#A78BFA]" />
              Discover Developers
            </Link>
          </div>
        </div>

        {/* Corporate Trust Badge */}
        <div className="flex flex-col gap-5 items-center w-full max-w-4xl text-center py-10 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-muted to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-muted to-transparent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dim">
            INTEGRATED TELEMETRY PARTNERS
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-25 grayscale hover:opacity-40 transition-opacity duration-500">
            <span className="font-black text-sm tracking-widest text-white heading-font">STRIPE</span>
            <span className="font-black text-sm tracking-widest text-white heading-font">GITHUB</span>
            <span className="font-black text-sm tracking-widest text-white heading-font">VERCEL</span>
            <span className="font-black text-sm tracking-widest text-white heading-font">SUPABASE</span>
          </div>
        </div>

        {/* Philosophy Comparison */}
        <section id="comparison" className="w-full max-w-5xl flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight heading-font">
              A Paradigm Shift in Recruiting
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Traditional credential screening vs verified SkillVerse telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            
            {/* Legacy Card */}
            <div className="rounded-xl border bg-surface/40 p-6 sm:p-8 flex flex-col justify-between gap-8 transition-all hover:border-red-500/20"
                 style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 text-dim text-xs font-bold uppercase tracking-wider">
                <X className="h-4 w-4 text-danger shrink-0" />
                Claims-Based Resume (Legacy)
              </div>

              <div className="flex flex-col gap-4">
                {[
                  'Keyword-stuffed resume claims of expertise that lack proof',
                  'Recruiters screening by college brand or company tenure',
                  'Exhaustive live coding loops that test syntax memory',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3.5 text-xs text-muted leading-normal">
                    <span className="h-5.5 w-5.5 rounded bg-elevated border text-[10px] flex items-center justify-center text-dim shrink-0 font-bold"
                          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>{i + 1}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <span className="text-[10px] text-dim font-semibold pl-1">
                Result: Time wasted on false positives and recruitment mismatches.
              </span>
            </div>

            {/* Telemetry Card */}
            <div className="rounded-xl border p-6 sm:p-8 flex flex-col justify-between gap-8 transition-all hover:shadow-glow-sm"
                 style={{ borderColor: 'rgba(139,92,246,0.20)', background: 'rgba(139,92,246,0.03)' }}>
              <div className="flex items-center gap-2 text-accent-hover text-xs font-bold uppercase tracking-wider">
                <Check className="h-4 w-4 text-success shrink-0" />
                SkillVerse Telemetry (Modern)
              </div>

              <div className="flex flex-col gap-4">
                {[
                  'Deep AI reviewing of actual project layout, structures & commits',
                  'Standardized skill scores generated from verified Git footprints',
                  'Instant job matches based on trust gating verification scores',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3.5 text-xs text-secondary leading-normal">
                    <span className="h-5.5 w-5.5 rounded text-[10px] flex items-center justify-center text-accent shrink-0 font-bold"
                          style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}>{i + 1}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <span className="text-[10px] text-muted font-semibold pl-1">
                Result: Rapid hiring cycles with full code quality alignment.
              </span>
            </div>

          </div>
        </section>

        {/* How It Works pipeline */}
        <section id="pipeline" className="w-full max-w-5xl flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight heading-font">
              The AI Review Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              How repository structures are parsed, and verified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
            {[
              { icon: Code2, title: '1. Fetch Manifests', desc: 'Scans package files, readme descriptions, and recent commit messages under 500KB thresholds.', color: '#8B5CF6' },
              { icon: Terminal, title: '2. Context Compilation', desc: 'Structures a targeted instruction prompt detailing code snippets, file metrics, and design targets.', color: '#06B6D4' },
              { icon: Cpu, title: '3. Inference Audit', desc: 'Processes telemetry queries through high-capacity instruct models on edge servers.', color: '#EC4899' },
              { icon: Globe, title: '4. Score Publication', desc: 'Saves audit summaries, registers verified skills, and publishes your cryptographic developer passport.', color: '#10B981' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="glow-card rounded-xl p-6 flex flex-col gap-4 group">
                  <div className="flex items-center justify-center rounded-xl w-10 h-10 transition-all duration-300 group-hover:shadow-glow-sm"
                       style={{ background: `${step.color}15`, border: `1px solid ${step.color}25` }}>
                    <Icon style={{ width: 20, height: 20, color: step.color }} />
                  </div>
                  <div className="flex flex-col gap-1.5 relative z-10">
                    <span className="text-xs font-bold text-white">{step.title}</span>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-[11px] text-dim z-10 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-muted to-transparent" />
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SkillVerse Inc. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-secondary cursor-pointer transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-secondary cursor-pointer transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-secondary cursor-pointer transition-colors">Cookie Policy</Link>
            <Link href="/contact/privacy" className="hover:text-secondary cursor-pointer transition-colors">Privacy Request</Link>
            <Link href="/api/health" className="hover:text-secondary cursor-pointer transition-colors">System Health</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
