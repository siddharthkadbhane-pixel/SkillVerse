'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle2, ChevronRight, Star, Terminal, Code2, Cpu, Globe, Check, X, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030303] dot-matrix flex flex-col justify-between selection:bg-violet-500/30 selection:text-white">
      
      {/* Immersive radial glow lights */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] ambient-glow-1 pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[5%] w-[600px] h-[600px] ambient-glow-2 pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/10">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white heading-font">
              SkillVerse
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#pipeline" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
              How It Works
            </a>
            <Link
              href="/dashboard"
              className="rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4.5 py-2.5 text-xs font-bold text-white transition-all active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Presentation */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-36 z-10 flex flex-col gap-28 items-center">
        
        {/* Intro */}
        <div className="text-center max-w-3xl flex flex-col gap-6 items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
            <ShieldCheck className="h-4 w-4" />
            <span>The Trust Layer for Code Quality</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.08] heading-font">
            Prove your code.{<br />}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              Skip the resume.
            </span>
          </h1>
          
          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed font-normal">
            SkillVerse replaces generic claims and unverified resumes with AI-driven repository reviews, cryptographic reputation points, and verified Git timelines.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link
              href="/dashboard"
              className="btn-primary flex items-center justify-center gap-2 rounded-xl text-white font-bold px-7 py-3.5 text-xs active:scale-98"
            >
              Get Started with GitHub
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#comparison"
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold px-7 py-3.5 text-xs hover:bg-zinc-850 hover:text-white transition-all active:scale-98"
            >
              Compare Verification
            </a>
          </div>
        </div>

        {/* Corporate Trust Badge */}
        <div className="flex flex-col gap-5 items-center w-full max-w-4xl text-center border-y border-zinc-900/60 py-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
            INTEGRATED TELEMETRY PARTNERS
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-30 grayscale hover:opacity-50 transition-opacity">
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
            <p className="text-xs sm:text-sm text-zinc-500">
              Traditional credential screening vs verified SkillVerse telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            
            {/* Legacy Card */}
            <div className="rounded-xl border border-zinc-900 bg-[#060608]/40 p-6 sm:p-8 flex flex-col justify-between gap-8">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <X className="h-4 w-4 text-red-500 shrink-0" />
                Claims-Based Resume (Legacy)
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3.5 text-xs text-zinc-400 leading-normal">
                  <span className="h-5.5 w-5.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] flex items-center justify-center text-zinc-600 shrink-0 font-bold">1</span>
                  <span>Keyword-stuffed resume claims of expertise that lack proof</span>
                </div>
                <div className="flex items-start gap-3.5 text-xs text-zinc-400 leading-normal">
                  <span className="h-5.5 w-5.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] flex items-center justify-center text-zinc-600 shrink-0 font-bold">2</span>
                  <span>Recruiters screening by college brand or company tenure</span>
                </div>
                <div className="flex items-start gap-3.5 text-xs text-zinc-400 leading-normal">
                  <span className="h-5.5 w-5.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] flex items-center justify-center text-zinc-600 shrink-0 font-bold">3</span>
                  <span>Exhaustive live coding loops that test syntax memory</span>
                </div>
              </div>

              <span className="text-[10px] text-zinc-600 font-semibold pl-1">
                Result: Time wasted on false positives and recruitment mismatches.
              </span>
            </div>

            {/* Telemetry Card */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-6 sm:p-8 flex flex-col justify-between gap-8">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                SkillVerse Telemetry (Modern)
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3.5 text-xs text-zinc-300 leading-normal">
                  <span className="h-5.5 w-5.5 rounded bg-violet-950/40 border border-violet-850 text-[10px] flex items-center justify-center text-violet-400 shrink-0 font-bold">1</span>
                  <span>Deep AI reviewing of actual project layout, structures & commits</span>
                </div>
                <div className="flex items-start gap-3.5 text-xs text-zinc-300 leading-normal">
                  <span className="h-5.5 w-5.5 rounded bg-violet-950/40 border border-violet-850 text-[10px] flex items-center justify-center text-violet-400 shrink-0 font-bold">2</span>
                  <span>Standardized skill scores generated from verified Git footprints</span>
                </div>
                <div className="flex items-start gap-3.5 text-xs text-zinc-300 leading-normal">
                  <span className="h-5.5 w-5.5 rounded bg-violet-950/40 border border-violet-850 text-[10px] flex items-center justify-center text-violet-400 shrink-0 font-bold">3</span>
                  <span>Instant job matches based on trust gating verification scores</span>
                </div>
              </div>

              <span className="text-[10px] text-zinc-500 font-semibold pl-1">
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
            <p className="text-xs sm:text-sm text-zinc-500">
              How repository structures are parsed, and verified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
            <div className="glass-card rounded-xl p-5.5 flex flex-col gap-4">
              <Code2 className="h-6 w-6 text-violet-400" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">1. Fetch Manifests</span>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Scans package files, readme descriptions, and recent commit messages under 500KB thresholds.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5.5 flex flex-col gap-4">
              <Terminal className="h-6 w-6 text-violet-400" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">2. Context Compilation</span>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Structures a targeted instruction prompt detailing code snippets, file metrics, and design targets.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5.5 flex flex-col gap-4">
              <Cpu className="h-6 w-6 text-violet-400" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">3. Inference Audit</span>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Processes telemetry queries through high-capacity instruct models on edge servers.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5.5 flex flex-col gap-4">
              <Globe className="h-6 w-6 text-violet-400" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">4. Score Publication</span>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Saves audit summaries, registers verified skills, and publishes your cryptographic developer passport.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900/60 py-8 text-[11px] text-zinc-600 bg-zinc-950/20 z-10">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SkillVerse Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Security Audits</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">API Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
