'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import SkillDnaMap from '@/components/skill-dna/SkillDnaMap';
import MultiLineChart from '@/components/charts/MultiLineChart';
import SkillChip from '@/components/ui/SkillChip';
import {
  Dna,
  ShieldCheck,
  TrendingUp,
  Share2,
  Download,
  Check,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import { getDummyDCCData } from '@/lib/dummyData';

export default function SkillDnaPage() {
  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [historyTimeline, setHistoryTimeline] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});

    // Fetch real growth timeline for DNA verification events (Phase 23)
    fetch('/api/dcc/growth?limit=5')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.timeline) {
          setHistoryTimeline(json.data.timeline);
        }
      })
      .catch(() => {});
  }, []);

  const dcc = getDummyDCCData('00000000-0000-0000-0000-000000000001');

  // DNA Composition Data
  const composition = [
    { label: 'Frontend', percentage: 27, score: 96, color: '#7C3AED' },
    { label: 'Backend', percentage: 23, score: 94, color: '#38BDF8' },
    { label: 'Database', percentage: 15, score: 92, color: '#10B981' },
    { label: 'Tools & DevOps', percentage: 13, score: 88, color: '#F59E0B' },
    { label: 'CS Fundamentals', percentage: 12, score: 95, color: '#06B6D4' },
    { label: 'Others', percentage: 10, score: 89, color: '#A78BFA' },
  ];

  // DNA Evolution Multi-Month Line Data
  const evolutionData = [
    { date: 'Oct', score: 72 },
    { date: 'Nov', score: 76 },
    { date: 'Dec', score: 81 },
    { date: 'Jan', score: 85 },
    { date: 'Feb', score: 89.2 },
  ];

  const copyDnaShare = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/passport/${profile?.username || 'siddharthkadbhane-pixel'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Skill DNA" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-5">
          {/* TOP: Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2">
                Skill DNA <Dna className="w-5 h-5 text-[#7C3AED]" />
              </h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Your unique developer fingerprint, built from your code.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Downloading Verified Skill DNA Export (.json)...')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export DNA
              </button>
              <button
                onClick={copyDnaShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Share Your DNA'}
              </button>
            </div>
          </div>

          {/* MAIN CONTENT: 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Overall DNA Score + DNA Composition */}
            <div className="lg:col-span-3 space-y-4">
              {/* Overall DNA Score Card */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Overall DNA Score
                </span>

                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-bold text-[#F8FAFC]">
                    89.2
                    <span className="text-xs text-[#64748B] font-normal"> / 100</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20">
                    +14.6%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
                  <span className="font-semibold text-[#10B981]">Tier: Advanced</span>
                  <span className="text-[10px] text-[#64748B]">vs last month</span>
                </div>
              </div>

              {/* DNA Composition Card */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                    DNA Composition
                  </h3>
                  <span className="text-[10px] font-mono text-[#64748B]">6 Domains</span>
                </div>

                <div className="space-y-2.5">
                  {composition.map((comp) => (
                    <div key={comp.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#94A3B8] font-medium">{comp.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-[#F8FAFC]">{comp.percentage}%</span>
                          <span className="text-[10px] text-[#64748B]">({comp.score})</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[#151B26] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${comp.percentage * 3.5}%`, backgroundColor: comp.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Large Skill DNA Map Network (Primary and Visually Dominant) */}
            <div className="lg:col-span-6">
              <SkillDnaMap />
            </div>

            {/* Right Column: DNA Evolution + Key Insights */}
            <div className="lg:col-span-3 space-y-4">
              {/* DNA Evolution Card (Phase 23) */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                    DNA Evolution
                  </h3>
                  <span className="text-[10px] font-mono text-[#10B981] font-bold">+6.5 pts</span>
                </div>

                {/* Score Delta Matrix */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#111722] border border-white/[0.04] text-center">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#64748B] block">Current</span>
                    <strong className="text-xs font-mono font-bold text-white">89.2</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#64748B] block">Previous</span>
                    <strong className="text-xs font-mono font-normal text-[#94A3B8]">82.7</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#64748B] block">Change</span>
                    <strong className="text-xs font-mono font-bold text-[#10B981]">+6.5</strong>
                  </div>
                </div>

                <MultiLineChart
                  data={evolutionData}
                  height={130}
                  series={[{ key: 'score', label: 'Score', color: '#7C3AED' }]}
                  showLegend={false}
                />
              </div>

              {/* Key Insights List */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#64748B] pb-1 border-b border-white/[0.06]">
                  Key DNA Signals
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-[#10B981] block flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Strongest Area
                    </span>
                    <span className="font-bold text-[#F8FAFC] block mt-0.5">Frontend (96/100)</span>
                    <span className="text-[10px] text-[#64748B]">Top 0.5% React / TS</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-[#38BDF8] block flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Fastest Growing
                    </span>
                    <span className="font-bold text-[#F8FAFC] block mt-0.5">Rust / DevOps (+34%)</span>
                    <span className="text-[10px] text-[#64748B]">High commit frequency</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-[#F59E0B] block flex items-center gap-1">
                      <Target className="w-3 h-3" /> Focus Area
                    </span>
                    <span className="font-bold text-[#F8FAFC] block mt-0.5">Testing & Reliability</span>
                    <span className="text-[10px] text-[#64748B]">Target: Vitest coverage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Skill DNA Timeline & Skills to Explore Next */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Skill DNA Timeline */}
            <div className="lg:col-span-6 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#7C3AED]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                    Skill DNA Verification Timeline
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#94A3B8]">Last 120 Days</span>
              </div>

              <div className="space-y-2">
                {historyTimeline.length > 0 ? (
                  historyTimeline.slice(0, 4).map((item, i) => (
                    <div key={item.id || i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#111722] border border-white/[0.04] text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-[#7C3AED]" />
                        <span className="font-medium text-[#F8FAFC] truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                        <span className="text-[#64748B]">{item.date}</span>
                        <span className="font-bold text-[#10B981]">{item.badgeText || '+10 pts'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { title: 'Rust Actix Web Architecture Verified', date: 'Feb 18, 2026', badge: '+12 pts', color: '#10B981' },
                    { title: 'React 19 Server Actions Benchmark', date: 'Jan 28, 2026', badge: '+8 pts', color: '#7C3AED' },
                    { title: 'PostgreSQL Indexation Audit Passed', date: 'Jan 12, 2026', badge: '+10 pts', color: '#38BDF8' },
                    { title: 'Docker Multi-Stage Build Optimization', date: 'Dec 22, 2025', badge: '+6 pts', color: '#F59E0B' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#111722] border border-white/[0.04] text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-[#F8FAFC] truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                        <span className="text-[#64748B]">{item.date}</span>
                        <span className="font-bold text-[#10B981]">{item.badge}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Skills to Explore Next (3 Recommendation Cards) */}
            <div className="lg:col-span-6 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FBBF24]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                    Skills to Explore Next
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#A78BFA]">AI Recommended</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'GraphQL & Apollo', benefit: '+18 Backend Score', reason: 'High synergy with TypeScript & REST APIs', difficulty: 'Intermediate' },
                  { name: 'Playwright E2E', benefit: '+15 Test Score', reason: 'Fills frontend automated test coverage gap', difficulty: 'Beginner' },
                  { name: 'Vector Embeddings', benefit: '+22 AI/ML Score', reason: 'Complements Python & multi-agent systems', difficulty: 'Advanced' },
                ].map((sk, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] hover:border-white/[0.12] transition-all flex flex-col justify-between space-y-2">
                    <div>
                      <span className="font-bold text-xs text-[#F8FAFC] block">{sk.name}</span>
                      <span className="font-mono text-[10px] text-[#10B981] font-semibold block">{sk.benefit}</span>
                      <p className="text-[10px] text-[#64748B] line-clamp-2 mt-1">{sk.reason}</p>
                    </div>
                    <Link
                      href="/challenges"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#A78BFA] hover:underline pt-1"
                    >
                      Start Sprint &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
