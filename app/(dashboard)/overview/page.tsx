'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import RadarChartComponent from '@/components/charts/RadarChartComponent';
import MultiLineChart from '@/components/charts/MultiLineChart';
import ActivityItem from '@/components/ui/ActivityItem';
import DashboardGrowthSection from '@/components/dashboard/DashboardGrowthSection';
import CareerWidget from '@/components/dashboard/CareerWidget';
import DashboardChallengesWidget from '@/components/dashboard/DashboardChallengesWidget';
import {
  ShieldCheck,
  Activity,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { DUMMY_REPOSITORIES, getDummyDCCData } from '@/lib/dummyData';

export default function DeveloperOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [dateRange, setDateRange] = useState('Last 30 days');

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

  const radarData = [
    { dimension: 'Frontend',      score: 96 },
    { dimension: 'Backend',       score: 94 },
    { dimension: 'Database',      score: 92 },
    { dimension: 'Tools & DevOps', score: 88 },
    { dimension: 'CS Fundamentals', score: 95 },
    { dimension: 'Others',        score: 89 },
  ];

  const activityTrendData = [
    { date: 'Jan 1',  commits: 42,  contributions: 68,  prs: 6  },
    { date: 'Jan 8',  commits: 56,  contributions: 82,  prs: 8  },
    { date: 'Jan 15', commits: 48,  contributions: 74,  prs: 5  },
    { date: 'Jan 22', commits: 70,  contributions: 98,  prs: 12 },
    { date: 'Jan 29', commits: 64,  contributions: 89,  prs: 9  },
    { date: 'Feb 5',  commits: 88,  contributions: 120, prs: 16 },
    { date: 'Feb 12', commits: 94,  contributions: 135, prs: 18 },
    { date: 'Feb 19', commits: 82,  contributions: 114, prs: 14 },
    { date: 'Feb 26', commits: 104, contributions: 148, prs: 22 },
  ];

  const overallScore = trustScore?.overallScore || 940;

  // KPI data — single source, no ad-hoc per-card styling
  const kpis = [
    {
      label: 'Overall score',
      value: `${overallScore / 10}`,
      unit: '/100',
      trend: '+4.2%',
      trendPositive: true,
      meta: 'Elite · Verified by AST',
      icon: ShieldCheck,
      iconColor: '#14B8A6',
    },
    {
      label: 'GitHub activity',
      value: '2,840',
      unit: '',
      trend: '+18% YoY',
      trendPositive: true,
      meta: 'Commits & contributions',
      icon: Activity,
      iconColor: '#3B82F6',
    },
    {
      label: 'Projects',
      value: '12',
      unit: '',
      trend: '100% passed',
      trendPositive: true,
      meta: '4 active · All AST audited',
      icon: FolderGit2,
      iconColor: '#6366F1',
    },
    {
      label: 'Commits',
      value: '3,842',
      unit: '',
      trend: '+142/mo',
      trendPositive: true,
      meta: '48-day streak',
      icon: GitCommit,
      iconColor: '#93C5FD',
    },
    {
      label: 'Pull requests',
      value: '148',
      unit: '',
      trend: '98% merged',
      trendPositive: true,
      meta: '24 peer reviews given',
      icon: GitPullRequest,
      iconColor: '#6366F1',
    },
  ] as const;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar user={profile} trustScore={trustScore} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Overview" />

        <main className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 max-w-[1600px] w-full mx-auto space-y-6">

          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.07]">
            <div>
              <h1 className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-tight">
                Overview
              </h1>
              <p className="text-[12.5px] text-slate-500 dark:text-[#64748B] mt-0.5">
                Engineering growth, verified skills, and technical contributions — in real time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-white dark:bg-[#131720] hover:bg-slate-100 dark:hover:bg-[#181F2C] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] transition-colors shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                {dateRange}
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-[#475569]" />
              </button>
            </div>
          </div>

          {/* KPI ROW — uniform cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-slate-500 dark:text-[#64748B]">{kpi.label}</span>
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: kpi.iconColor }} />
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-none">
                      {kpi.value}
                    </span>
                    {kpi.unit && (
                      <span className="text-[11px] text-slate-400 dark:text-[#475569]">{kpi.unit}</span>
                    )}
                    <span
                      className={[
                        'text-[10.5px] font-medium px-1.5 py-0.5 rounded ml-auto',
                        kpi.trendPositive
                          ? 'text-[#14B8A6] bg-[#14B8A6]/10'
                          : 'text-[#EF4444] bg-[rgba(239,68,68,0.10)]',
                      ].join(' ')}
                    >
                      {kpi.trend}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-[#475569] truncate">{kpi.meta}</p>
                </div>
              );
            })}
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Skill DNA Radar */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07] mb-3">
                <div>
                  <h3 className="text-[13px] font-medium text-slate-900 dark:text-[#F1F5F9]">Skill DNA snapshot</h3>
                  <p className="text-[11.5px] text-slate-500 dark:text-[#64748B] mt-0.5">6 technical dimensions</p>
                </div>
                <Link
                  href="/skill-dna"
                  className="text-[11.5px] font-medium text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
                >
                  Explore →
                </Link>
              </div>

              <div className="flex-1">
                <RadarChartComponent data={radarData} color="#6366F1" height={210} />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.07] flex flex-wrap gap-1.5">
                {['React', 'TypeScript', 'Next.js 15', 'Rust', 'PostgreSQL'].map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#131720] text-slate-600 dark:text-[#64748B] border border-slate-200 dark:border-white/[0.05]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Activity Chart */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07] mb-3">
                <div>
                  <h3 className="text-[13px] font-medium text-slate-900 dark:text-[#F1F5F9]">Activity overview</h3>
                  <p className="text-[11.5px] text-slate-500 dark:text-[#64748B] mt-0.5">
                    Commits, contributions & PR merges
                  </p>
                </div>
                <Link
                  href="/github"
                  className="text-[11.5px] font-medium text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
                >
                  GitHub →
                </Link>
              </div>

              <div className="flex-1">
                <MultiLineChart
                  data={activityTrendData}
                  height={210}
                  series={[
                    { key: 'commits',       label: 'Commits',       color: '#6366F1' },
                    { key: 'contributions', label: 'Contributions', color: '#3B82F6' },
                    { key: 'prs',           label: 'PRs',           color: '#14B8A6' },
                  ]}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.07] flex items-center justify-between text-[11.5px] text-slate-500 dark:text-[#64748B]">
                <span>
                  Continuous streak:{' '}
                  <strong className="text-[#14B8A6] font-medium">48 days</strong>
                </span>
                <span>
                  Velocity: <strong className="text-slate-900 dark:text-[#F1F5F9] font-medium">+22%</strong>
                </span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-3 bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07] mb-1">
                <h3 className="text-[13px] font-medium text-slate-900 dark:text-[#F1F5F9]">Recent activity</h3>
                <Link
                  href="/activity"
                  className="text-[11.5px] font-medium text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
                >
                  All →
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto space-y-0.5">
                {[
                  { type: 'audit',       title: 'SkillVerse AST Review',    desc: 'Overall: 95/100',        time: '2h ago',  repo: 'SkillVerse'         },
                  { type: 'commit',      title: 'Raft consensus buffer pool', desc: 'Zero-alloc unsafe check', time: '5h ago',  repo: 'hyperion-cache'     },
                  { type: 'pr',          title: 'Merged PR #24: LLM Pruning', desc: 'Context latency −42%',   time: '1d ago',  repo: 'neural-orchestrator' },
                  { type: 'achievement', title: 'Elite Level Achieved',       desc: 'Sustained 940+ score',   time: '2d ago',  repo: 'Skill DNA'          },
                ].map((act, i) => (
                  <ActivityItem
                    key={i}
                    type={act.type as any}
                    title={act.title}
                    description={act.desc}
                    timestamp={act.time}
                    repoName={act.repo}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CAPABILITY GROWTH */}
          <DashboardGrowthSection />

          {/* CAREER & CHALLENGES ACCELERATOR SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Career & Learning Pathway */}
            <div className="lg:col-span-6 flex flex-col">
              <CareerWidget />
            </div>

            {/* Challenges & Competitions */}
            <div className="lg:col-span-6 flex flex-col">
              <DashboardChallengesWidget />
            </div>
          </div>

          {/* RECENT PROJECTS & ACHIEVEMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recent projects */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07] mb-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-900 dark:text-[#F1F5F9]">Recent projects</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#64748B] mt-0.5">Audited repositories with verified health</p>
                </div>
                <Link
                  href="/projects"
                  className="text-[11.5px] font-medium text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
                >
                  All ({DUMMY_REPOSITORIES.length}) →
                </Link>
              </div>

              <div className="space-y-2.5">
                {DUMMY_REPOSITORIES.slice(0, 3).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.09] transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12.5px] font-semibold text-slate-900 dark:text-[#F1F5F9] truncate">{repo.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#14B8A6]/10 text-[#14B8A6] shrink-0 font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-[#64748B] line-clamp-1">{repo.description}</p>
                      <div className="flex items-center gap-3 text-[10.5px] text-slate-400 dark:text-[#475569]">
                        <span className="font-mono">{repo.language}</span>
                        <span>★ {repo.stars}</span>
                        <span>Health {repo.healthScore}%</span>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-[#14B8A6] shrink-0 mt-0.5">
                      {repo.overallScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07] mb-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-900 dark:text-[#F1F5F9]">Achievements & Honors</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#64748B] mt-0.5">Empirical milestones and verified capability benchmarks</p>
                </div>
                <Link
                  href="/achievements"
                  className="text-[11.5px] font-medium text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
                >
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'Elite Developer Status',    desc: 'Sustained 900+ score across 5 codebases',      date: 'Feb 2026', color: '#14B8A6' },
                  { title: 'Zero Memory Leak Audit',    desc: 'Raft consensus verified with 0 unsafe leaks',   date: 'Jan 2026', color: '#6366F1' },
                  { title: 'Global Hackathon Finalist', desc: 'Top 1% in Distributed Raft Challenge',          date: 'Dec 2025', color: '#3B82F6' },
                ].map((ach, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.05] flex items-start gap-3"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: ach.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[12.5px] font-semibold text-slate-900 dark:text-[#F1F5F9] truncate">{ach.title}</h4>
                        <span className="text-[10.5px] text-slate-400 dark:text-[#475569] shrink-0 font-mono">{ach.date}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-[#64748B] truncate mt-0.5">{ach.desc}</p>
                    </div>
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
