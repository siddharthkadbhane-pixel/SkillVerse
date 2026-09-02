'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Code2, 
  GitFork, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Activity, 
  FileText, 
  ArrowLeft,
  Lock,
  Compass
} from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#08090D] text-[#F1F5F9] font-sans antialiased selection:bg-purple-900/30 selection:text-white">
      {/* Top Bar */}
      <header className="h-14 border-b border-white/[0.07] bg-[#0E1117] px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/overview" className="flex items-center gap-2 text-white font-semibold text-sm hover:text-[#A78BFA] transition-colors">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-xs font-black">
              ✦
            </div>
            <span>SkillVerse</span>
          </Link>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-zinc-400 text-xs font-medium">Evaluation Methodology</span>
        </div>
        <Link 
          href="/overview"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <section className="space-y-4 border-b border-white/[0.07] pb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Product Trust & Integrity Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            How SkillVerse Evaluates Capability
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">
            SkillVerse is built on a simple conviction: <strong className="text-zinc-200">engineering capability should be measured by demonstrated code evidence, not popularity or self-claims.</strong>
          </p>
        </section>

        {/* Section 1: The Evidence Hierarchy */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7C3AED]" />
              <span>1. The Evidence Hierarchy</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Every skill on a Developer Capability Card (DCC) must earn its verification level through concrete technical signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strong */}
            <div className="p-4 rounded-xl bg-[#0E1117] border border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Strong Evidence</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">Verified</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Analyzed codebase with verified AST review score ≥ 75</li>
                <li>Multi-project implementation evidence</li>
                <li>Verified test-driven challenge evaluation</li>
                <li>Comprehensive architectural design patterns</li>
              </ul>
            </div>

            {/* Moderate */}
            <div className="p-4 rounded-xl bg-[#0E1117] border border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Moderate Evidence</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">Supported</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Primary language in active repositories</li>
                <li>Analyzed codebase with score 60–74</li>
                <li>Active multi-file commit contributions</li>
                <li>Verified pull requests with peer review</li>
              </ul>
            </div>

            {/* Weak */}
            <div className="p-4 rounded-xl bg-[#0E1117] border border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Weak Evidence</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">Detected Only</span>
              </div>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Package manifest detection only (<code className="text-zinc-300">package.json</code>)</li>
                <li>Mention in repository README or description</li>
                <li>Self-reported skill on profile</li>
                <li><strong className="text-zinc-300">Never verifies a skill on its own</strong></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Technology vs Capability */}
        <section className="space-y-4 p-5 rounded-xl bg-[#0E1117] border border-white/[0.07]">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <span>2. Technology vs. Capability: A Strict Distinction</span>
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Finding a library in a project does not automatically make someone a domain expert. SkillVerse uses a four-stage capability pipeline:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
            <div className="p-3 rounded-lg bg-[#131720] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 font-mono block">Stage 1</span>
              <strong className="text-zinc-300 font-medium">Technology Detected</strong>
              <span className="text-[10px] text-zinc-500 block mt-1">e.g. React in manifest</span>
            </div>
            <div className="p-3 rounded-lg bg-[#131720] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 font-mono block">Stage 2</span>
              <strong className="text-zinc-300 font-medium">Implementation Evidence</strong>
              <span className="text-[10px] text-zinc-500 block mt-1">Components & Hooks in source</span>
            </div>
            <div className="p-3 rounded-lg bg-[#131720] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 font-mono block">Stage 3</span>
              <strong className="text-cyan-400 font-medium">Skill Supported / Verified</strong>
              <span className="text-[10px] text-zinc-400 block mt-1">AST audit ≥ 75 benchmark</span>
            </div>
            <div className="p-3 rounded-lg bg-[#131720] border border-purple-500/20 bg-purple-500/5">
              <span className="text-[11px] text-purple-400 font-mono block">Stage 4</span>
              <strong className="text-purple-300 font-medium">Frontend Capability</strong>
              <span className="text-[10px] text-purple-400/80 block mt-1">Proven engineering domain</span>
            </div>
          </div>
        </section>

        {/* Section 3: AI is an Analyst, Not the Sole Judge */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>3. AI is an Analyst, Not the Final Judge</span>
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            AI language models assist in parsing patterns, but <strong className="text-zinc-200">cannot independently grant high capability claims</strong>. Every capability evaluation combines four distinct telemetry sources:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-[#0E1117] border border-white/[0.07] text-xs space-y-1">
              <strong className="text-white block font-medium">Deterministic AST Telemetry</strong>
              <span className="text-zinc-400">Cyclomatic complexity, modularity, typings, and architectural layers evaluated via deterministic rules.</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0E1117] border border-white/[0.07] text-xs space-y-1">
              <strong className="text-white block font-medium">AI Heuristic Review</strong>
              <span className="text-zinc-400">Synthesizes code quality insights, architectural strengths, maintainability, and learning recommendations.</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0E1117] border border-white/[0.07] text-xs space-y-1">
              <strong className="text-white block font-medium">Historical Evidence & Freshness</strong>
              <span className="text-zinc-400">Tracks commit recency and skills evolution over time, preventing stale claims.</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0E1117] border border-white/[0.07] text-xs space-y-1">
              <strong className="text-white block font-medium">Contribution & Provenance Context</strong>
              <span className="text-zinc-400">Distinguishes original codebase ownership from forks, single-commit samples, and multi-author projects.</span>
            </div>
          </div>
        </section>

        {/* Section 4: What Does NOT Count */}
        <section className="space-y-4 p-5 rounded-xl bg-red-500/5 border border-red-500/20">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>4. What Does NOT Count as Capability</span>
          </h2>
          <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4 leading-relaxed">
            <li><strong className="text-white">Popularity metrics</strong>: GitHub stars, forks, and followers do not increase capability scores.</li>
            <li><strong className="text-white">Raw commit volume alone</strong>: 1,000 trivial commits without architectural complexity do not yield an Advanced rating.</li>
            <li><strong className="text-white">Copied or forked projects</strong>: Cloned repositories evaluate only the developer&apos;s personal contributions, never original authorship.</li>
            <li><strong className="text-white">Unused dependencies</strong>: Packages in configuration files without imported usage in source code remain unverified.</li>
          </ul>
        </section>

        {/* Section 5: Transparency & Auditability */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>5. Transparency & Audit Trail</span>
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every DCC capability transition is recorded in an immutable internal audit trail. Developers and recruiters can always inspect the exact reasoning and supporting repository evidence behind any score or capability tier.
          </p>
        </section>

        {/* Footer CTA */}
        <div className="pt-6 border-t border-white/[0.07] flex items-center justify-between">
          <Link 
            href="/overview"
            className="px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-medium transition-colors"
          >
            View Your Capability Card
          </Link>
          <Link
            href="/challenges"
            className="px-4 py-2 rounded-lg bg-[#131720] hover:bg-[#181F2C] border border-white/[0.07] text-zinc-300 text-xs font-medium transition-colors"
          >
            Explore Verification Challenges
          </Link>
        </div>
      </main>
    </div>
  );
}
