'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import RadarChartComponent from '@/components/charts/RadarChartComponent';
import MultiLineChart from '@/components/charts/MultiLineChart';
import ActivityItem from '@/components/ui/ActivityItem';
import SkillChip from '@/components/ui/SkillChip';
import ProjectCard from '@/components/ui/ProjectCard';
import {
  Code2,
  ShieldCheck,
  TrendingUp,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Award,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  History,
  GitBranch,
} from 'lucide-react';
import { DUMMY_REPOSITORIES } from '@/lib/dummyData';

export default function SkillDetailPage() {
  const params = useParams();
  const rawSkill = (params.skill as string) || 'react';
  const skillName = decodeURIComponent(rawSkill).replace(/-/g, ' ');

  const [profile, setProfile] = useState<any>(null);
  const [skillHistoryData, setSkillHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const displayName =
    skillName.toLowerCase() === 'react'
      ? 'React'
      : skillName.toLowerCase() === 'typescript'
      ? 'TypeScript'
      : skillName.charAt(0).toUpperCase() + skillName.slice(1);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});

    // Fetch real skill progression history (Phase 23)
    fetch(`/api/dcc/growth?skill=${encodeURIComponent(displayName)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSkillHistoryData(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [displayName]);

  // 1. Skill Breakdown 6-Axis Radar Data
  const breakdownRadarData = [
    { dimension: 'Component Design', score: 96 },
    { dimension: 'State Management', score: 94 },
    { dimension: 'Performance', score: 92 },
    { dimension: 'Testing', score: 86 },
    { dimension: 'Hooks', score: 95 },
    { dimension: 'UI/UX', score: 91 },
  ];

  // 2. Skill Growth Progression Area Chart Data
  const growthTrendData = [
    { date: 'Sep', score: 74 },
    { date: 'Oct', score: 79 },
    { date: 'Nov', score: 83 },
    { date: 'Dec', score: 87 },
    { date: 'Jan', score: 89 },
    { date: 'Feb', score: 91.4 },
  ];

  const currentScore = skillHistoryData?.currentScore || 91.4;
  const currentLevel = skillHistoryData?.currentLevel || 'Advanced';
  const evidenceCount = skillHistoryData?.evidenceRepos?.length || 4;
  const hasHistory = skillHistoryData?.hasHistory || false;
  const stages = skillHistoryData?.stages || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb={`Skills / Frontend / ${displayName}`} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-5">
          {/* TOP BREADCRUMB & BACK LINK */}
          <div className="flex items-center justify-between">
            <Link
              href="/skills"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Skills &gt; Frontend &gt; <span className="text-slate-900 dark:text-[#F8FAFC]">{displayName}</span>
            </Link>

            <span className="font-mono text-xs text-emerald-700 dark:text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
              ✓ Verified by AST Engine
            </span>
          </div>

          {/* TOP HERO: Skill Identity + Skill Score Card */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Skill Icon, Title, Badge, Description & Tags */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA]">
                  <Code2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {displayName}
                    </h1>
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-[#10B981]" />
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD] border border-[#7C3AED]/40">
                      {currentLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                    A JavaScript library for building user interfaces with modular component architecture.
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {['Frontend', 'Library', 'Component Based', 'UI Development'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.04]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Skill Score Card */}
            <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] p-4 rounded-xl shadow-xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] block tracking-wider">
                  Skill Score
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-600 dark:text-[#10B981]">
                    {currentScore}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-[#64748B]">/100</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-[#10B981] font-semibold">
                  +18.4% vs last month
                </span>
              </div>

              {/* Circular Growth Meter */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-[#151B26]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-600 dark:text-[#10B981]"
                    strokeDasharray="91.4, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-bold text-slate-900 dark:text-[#F8FAFC]">
                  91%
                </span>
              </div>
            </div>
          </div>

          {/* HORIZONTAL STATISTICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-3.5 rounded-xl">
            <div className="text-center p-2 rounded bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block">
                Projects
              </span>
              <span className="font-mono text-base font-bold text-slate-900 dark:text-[#F8FAFC]">12</span>
            </div>
            <div className="text-center p-2 rounded bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block">
                Commits
              </span>
              <span className="font-mono text-base font-bold text-[#0284C7] dark:text-[#38BDF8]">3,842</span>
            </div>
            <div className="text-center p-2 rounded bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block">
                Contributions
              </span>
              <span className="font-mono text-base font-bold text-[#7C3AED]">27</span>
            </div>
            <div className="text-center p-2 rounded bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block">
                AI Reviews
              </span>
              <span className="font-mono text-base font-bold text-[#10B981]">14 Passed</span>
            </div>
            <div className="text-center p-2 rounded bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block">
                PRs Merged
              </span>
              <span className="font-mono text-base font-bold text-[#06B6D4]">148</span>
            </div>
          </div>

          {/* CAPABILITY HISTORY SECTION (Phase 23) */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Capability History
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-[#94A3B8]">
                <span>Current Level: <strong className="text-[#10B981]">{currentLevel}</strong></span>
                <span>•</span>
                <span>Score: <strong className="text-slate-900 dark:text-white">{currentScore} / 100</strong></span>
                <span>•</span>
                <span>Evidence: <strong className="text-sky-600 dark:text-[#38BDF8]">{evidenceCount} analyzed repositories</strong></span>
              </div>
            </div>

            {hasHistory && stages.length > 0 ? (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04]">
                  {stages.map((st: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-[#7C3AED]/20 border border-indigo-500/30 dark:border-[#7C3AED]/40 flex items-center justify-center text-indigo-600 dark:text-[#C4B5FD] font-mono text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{st.stage}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              {st.level}%
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] block truncate">
                            {st.date} {st.evidenceRepo ? `• ${st.evidenceRepo}` : ''}
                          </span>
                        </div>
                      </div>

                      {idx < stages.length - 1 && (
                        <div className="hidden md:flex items-center text-[#7C3AED]">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#111722]/60 border border-slate-200/60 dark:border-white/[0.04] space-y-2">
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Historical progression will appear as more verified evidence is collected.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#64748B] pt-1 border-t border-slate-200/60 dark:border-white/[0.04]">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Currently verified across <strong className="text-slate-700 dark:text-zinc-300 font-normal">SkillVerse</strong> and associated repository codebases.</span>
                </div>
              </div>
            )}
          </div>

          {/* MAIN 3-COLUMN SECTION: Skill Growth Chart + Recent Activity + Skill Breakdown Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Skill Growth Area Chart */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Skill Growth Progression
                </h3>
                <span className="font-mono text-[10px] text-[#10B981]">+17.4 pts</span>
              </div>
              <MultiLineChart
                data={growthTrendData}
                height={200}
                series={[{ key: 'score', label: 'Score', color: '#7C3AED' }]}
                showLegend={false}
              />
            </div>

            {/* Center: Recent Activity Timeline */}
            <div className="lg:col-span-3 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Recent Activity
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-[#64748B]">This Skill</span>
              </div>

              <div className="space-y-0.5 flex-1 overflow-y-auto">
                {[
                  { type: 'commit', title: 'React 19 memoization boundaries', desc: 'Zero unneeded rerenders', time: '1d ago', repo: 'SkillVerse' },
                  { type: 'pr', title: 'Merged PR #12: Context streaming', desc: 'React 19 actions', time: '3d ago', repo: 'SkillVerse' },
                  { type: 'audit', title: 'AST Component Modularity', desc: 'Score: 96/100', time: '5d ago', repo: 'react-ui' },
                ].map((item: any, i: number) => (
                  <ActivityItem
                    key={i}
                    type={item.type}
                    title={item.title}
                    description={item.desc}
                    timestamp={item.time}
                    repoName={item.repo}
                  />
                ))}
              </div>
            </div>

            {/* Right: Skill Breakdown Radar Chart */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Skill Breakdown
                </h3>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-[#A78BFA]">6 Technical Axes</span>
              </div>

              <RadarChartComponent data={breakdownRadarData} color="#38BDF8" height={200} />
            </div>
          </div>

          {/* SECONDARY 3-COLUMN SECTION: Strengths + Areas to Improve + Overall Proficiency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Strengths
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#10B981] font-bold">&bull;</span>
                  <span>Component tree modularity & memoization</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#10B981] font-bold">&bull;</span>
                  <span>React 19 Server Components and Suspense</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#10B981] font-bold">&bull;</span>
                  <span>Clean custom hooks separation</span>
                </li>
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Areas to Improve
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#F59E0B] font-bold">&bull;</span>
                  <span>Add Vitest unit tests for async custom hooks</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#F59E0B] font-bold">&bull;</span>
                  <span>Leverage useTransition in high-volume filters</span>
                </li>
              </ul>
            </div>

            {/* Overall Proficiency */}
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block pb-1 border-b border-slate-200/80 dark:border-white/[0.06]">
                Overall Proficiency
              </span>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{currentLevel} / Elite</span>
                  <span className="font-mono text-[#10B981] font-bold">{currentScore} / 100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-[#151B26] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#10B981]" style={{ width: `${currentScore}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#64748B] leading-relaxed">
                Ranks in the top 1% of {displayName} developers across 18,000+ engineers evaluated by SkillVerse.
              </p>
            </div>
          </div>

          {/* THIRD 3-COLUMN SECTION: Projects Using This Skill + Achievements + AI Insight */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Projects Using This Skill */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Projects Using {displayName}
                </h3>
                <Link href="/projects" className="text-[11px] font-semibold text-indigo-600 dark:text-[#A78BFA] hover:underline">
                  View All &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {DUMMY_REPOSITORIES.slice(0, 2).map((r) => (
                  <div key={r.id} className="p-2.5 bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-[#F8FAFC]">{r.name}</h4>
                      <span className="text-[10px] text-slate-500 dark:text-[#64748B] font-mono">{r.language} &bull; ★ {r.stars}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                      {r.overallScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Achievements */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Verified Achievements
                </h3>
                <Link href="/achievements" className="text-[11px] font-semibold text-indigo-600 dark:text-[#A78BFA] hover:underline">
                  All &rarr;
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#10B981]" />
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{displayName} Architect</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-[#64748B]">Feb 2026</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Zero Hydration Defects</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-[#64748B]">Jan 2026</span>
                </div>
              </div>
            </div>

            {/* Right: AI Insight */}
            <div className="lg:col-span-3 bg-gradient-to-br from-indigo-50/80 via-white to-white dark:from-[#7C3AED]/15 dark:via-[#0D121A] dark:to-[#0D121A] border border-indigo-200 dark:border-[#7C3AED]/30 rounded-xl p-4 shadow-sm space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-[#A78BFA]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                    AI Recommendation
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed mt-2">
                  Adding integration tests with Playwright will boost your overall testing proficiency in {displayName} from <strong className="text-slate-900 dark:text-white font-mono">86</strong> to <strong className="text-[#10B981] font-mono">95+</strong>.
                </p>
              </div>

              <Link
                href="/challenges"
                className="w-full flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
              >
                <span>Take Test Challenge</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
