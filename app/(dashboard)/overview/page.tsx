'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import RadarChartComponent from '@/components/charts/RadarChartComponent';
import MultiLineChart from '@/components/charts/MultiLineChart';
import ActivityItem from '@/components/ui/ActivityItem';
import SkillChip from '@/components/ui/SkillChip';
import DashboardGrowthSection from '@/components/dashboard/DashboardGrowthSection';
import {
  ShieldCheck,
  Activity,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  TrendingUp,
  Sparkles,
  Award,
  Calendar,
  ChevronDown,
  Star,
  ExternalLink,
  CheckCircle2,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { DUMMY_REPOSITORIES, getDummyDCCData } from '@/lib/dummyData';

export default function DeveloperOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setProfile(json.data.profile);
          setTrustScore(json.data.trustScore);
        }
      })
      .catch(() => {});
  }, []);

  const dcc = getDummyDCCData('00000000-0000-0000-0000-000000000001');

  // 1. Radar Data for Skill DNA Snapshot (6 Technical Dimensions)
  const radarData = [
    { dimension: 'Frontend', score: 96 },
    { dimension: 'Backend', score: 94 },
    { dimension: 'Database', score: 92 },
    { dimension: 'Tools & DevOps', score: 88 },
    { dimension: 'CS Fundamentals', score: 95 },
    { dimension: 'Others', score: 89 },
  ];

  // 2. Activity Overview Multi-series Line Chart Data
  const activityTrendData = [
    { date: 'Jan 1', commits: 42, contributions: 68, prs: 6 },
    { date: 'Jan 8', commits: 56, contributions: 82, prs: 8 },
    { date: 'Jan 15', commits: 48, contributions: 74, prs: 5 },
    { date: 'Jan 22', commits: 70, contributions: 98, prs: 12 },
    { date: 'Jan 29', commits: 64, contributions: 89, prs: 9 },
    { date: 'Feb 5', commits: 88, contributions: 120, prs: 16 },
    { date: 'Feb 12', commits: 94, contributions: 135, prs: 18 },
    { date: 'Feb 19', commits: 82, contributions: 114, prs: 14 },
    { date: 'Feb 26', commits: 104, contributions: 148, prs: 22 },
  ];

  // 3. KPI Mini-Sparklines Data
  const sparklineData = [
    { value: 40 },
    { value: 45 },
    { value: 42 },
    { value: 55 },
    { value: 68 },
    { value: 74 },
    { value: 89 },
  ];

  const overallScore = trustScore?.overallScore || 940;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} trustScore={trustScore} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Overview" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-5">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2">
                Overview <span className="text-xl">👋</span>
              </h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Track your engineering growth, verified skills, and technical contributions in real-time.
              </p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>{dateRange}</span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>
              </div>
            </div>
          </div>

          {/* FIRST ROW: 5 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Overall Score */}
            <div className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Overall Score
                </span>
                <div className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#F8FAFC]">
                  {overallScore / 10}
                  <span className="text-xs text-[#64748B] font-normal">/100</span>
                </span>
                <span className="font-mono text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded border border-[#10B981]/20">
                  +4.2%
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Verified by AST Engine</span>
                <span className="font-mono text-[#10B981]">Elite</span>
              </div>
            </div>

            {/* KPI 2: GitHub Activity */}
            <div className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  GitHub Activity
                </span>
                <div className="p-1.5 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#F8FAFC]">
                  2,840
                </span>
                <span className="font-mono text-[10px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.2 rounded border border-[#38BDF8]/20">
                  +18% YoY
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Commits & Contributions</span>
                <span className="font-mono text-[#38BDF8]">Top 2%</span>
              </div>
            </div>

            {/* KPI 3: Projects */}
            <div className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Projects
                </span>
                <div className="p-1.5 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#F8FAFC]">
                  12
                </span>
                <span className="font-mono text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded">
                  100% Passed
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>100% AST Audited</span>
                <span className="font-mono text-[#A78BFA]">4 Active</span>
              </div>
            </div>

            {/* KPI 4: Commits */}
            <div className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Commits
                </span>
                <div className="p-1.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4]">
                  <GitCommit className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#F8FAFC]">
                  3,842
                </span>
                <span className="font-mono text-[10px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.2 rounded">
                  +142 /mo
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Across 6 repositories</span>
                <span className="font-mono text-[#F8FAFC]">48d Streak</span>
              </div>
            </div>

            {/* KPI 5: Pull Requests */}
            <div className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Pull Requests
                </span>
                <div className="p-1.5 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                  <GitPullRequest className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#F8FAFC]">
                  148
                </span>
                <span className="font-mono text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded">
                  98% Merged
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Peer-reviewed code</span>
                <span className="font-mono text-[#A78BFA]">24 Reviews</span>
              </div>
            </div>
          </div>

          {/* SECOND SECTION (3-Column Desktop Grid: Radar Chart + Line Chart + Activity Timeline) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Skill DNA Snapshot with Radar Chart */}
            <div className="lg:col-span-4 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                  Skill DNA Snapshot
                </h3>
                <Link
                  href="/skill-dna"
                  className="text-[11px] font-semibold text-[#A78BFA] hover:underline flex items-center gap-1"
                >
                  Explore DNA &rarr;
                </Link>
              </div>

              {/* Mathematical 6-Axis Radar Chart */}
              <div className="py-2">
                <RadarChartComponent data={radarData} color="#7C3AED" height={220} />
              </div>

              {/* Core Skill Chips */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                {['React', 'TypeScript', 'Next.js 15', 'Rust', 'PostgreSQL'].map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#94A3B8] border border-white/[0.04]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Center: Activity Overview Multi-Series Line Chart */}
            <div className="lg:col-span-5 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                    Activity Overview
                  </h3>
                  <span className="text-[10px] text-[#64748B]">
                    Commits, Contributions & PR Merges
                  </span>
                </div>
                <Link
                  href="/github"
                  className="text-[11px] font-semibold text-[#A78BFA] hover:underline"
                >
                  GitHub Telemetry &rarr;
                </Link>
              </div>

              {/* Multi-Series Line Chart */}
              <div className="py-2">
                <MultiLineChart
                  data={activityTrendData}
                  height={220}
                  series={[
                    { key: 'commits', label: 'Commits', color: '#7C3AED' },
                    { key: 'contributions', label: 'Contributions', color: '#38BDF8' },
                    { key: 'prs', label: 'PRs', color: '#10B981' },
                  ]}
                />
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Continuous streak: <strong className="text-[#10B981] font-mono">48 days</strong></span>
                <span>Velocity: <strong className="text-white font-mono">+22%</strong></span>
              </div>
            </div>

            {/* Right: Recent Activity Vertical Timeline */}
            <div className="lg:col-span-3 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                  Recent Activity
                </h3>
                <Link
                  href="/activity"
                  className="text-[11px] font-semibold text-[#A78BFA] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-0.5 flex-1 overflow-y-auto">
                {[
                  { type: 'audit', title: 'SkillVerse AST Review', desc: 'Overall: 95/100', time: '2h ago', repo: 'SkillVerse' },
                  { type: 'commit', title: 'Raft consensus buffer pool', desc: 'Zero-alloc unsafe check', time: '5h ago', repo: 'hyperion-cache' },
                  { type: 'pr', title: 'Merged PR #24: LLM Pruning', desc: 'Context latency -42%', time: '1d ago', repo: 'neural-orchestrator' },
                  { type: 'achievement', title: 'Elite Level Achieved', desc: 'Sustained 940+ score', time: '2d ago', repo: 'Skill DNA' },
                ].map((act: any, i: number) => (
                  <ActivityItem
                    key={i}
                    type={act.type}
                    title={act.title}
                    description={act.desc}
                    timestamp={act.time}
                    repoName={act.repo}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CAPABILITY GROWTH SECTION (Phase 23) */}
          <DashboardGrowthSection />

          {/* THIRD SECTION (3-Column Desktop Grid: Recent Projects + Achievements + AI Insight) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Recent Projects */}
            <div className="lg:col-span-5 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                  Recent Verified Projects
                </h3>
                <Link
                  href="/projects"
                  className="text-[11px] font-semibold text-[#A78BFA] hover:underline"
                >
                  All ({DUMMY_REPOSITORIES.length}) &rarr;
                </Link>
              </div>

              <div className="space-y-2.5">
                {DUMMY_REPOSITORIES.slice(0, 2).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] hover:border-white/[0.10] transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#F8FAFC] truncate">
                          {repo.name}
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] line-clamp-1">
                        {repo.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#94A3B8] font-mono pt-1">
                        <span>{repo.language}</span>
                        <span>★ {repo.stars}</span>
                        <span>Health: {repo.healthScore}%</span>
                      </div>
                    </div>

                    <span className="font-mono text-sm font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded shrink-0">
                      {repo.overallScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Achievements */}
            <div className="lg:col-span-4 bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                  Achievements & Proofs
                </h3>
                <Link
                  href="/achievements"
                  className="text-[11px] font-semibold text-[#A78BFA] hover:underline"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'Elite Developer Status', desc: 'Sustained 900+ score across 5 codebases', date: 'Feb 2026', color: '#10B981' },
                  { title: 'Zero Memory Leak Audit', desc: 'Raft consensus verified with 0 unsafe leaks', date: 'Jan 2026', color: '#7C3AED' },
                  { title: 'Global Hackathon Finalist', desc: 'Top 1% in Distributed Raft Challenge', date: 'Dec 2025', color: '#F59E0B' },
                ].map((ach, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.04] flex items-start gap-2.5"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: ach.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#F8FAFC] truncate">
                          {ach.title}
                        </h4>
                        <span className="font-mono text-[10px] text-[#64748B]">
                          {ach.date}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] truncate">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: AI Insight */}
            <div className="lg:col-span-3 bg-gradient-to-br from-[#7C3AED]/15 via-[#0D121A] to-[#0D121A] border border-[#7C3AED]/30 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
                  <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                    AI Insight
                  </h3>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed mt-2.5">
                  Your codebase demonstrates <strong className="text-white">Elite modular architecture</strong> in Next.js 15. Adding Playwright end-to-end integration tests to your UI will push your test reliability score past 95%.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/challenges"
                  className="w-full flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                >
                  <span>Start Test Sprint (+15 pts)</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
