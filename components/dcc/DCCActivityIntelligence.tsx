'use client';

import React from 'react';
import { 
  GitCommit, 
  GitPullRequest, 
  FolderGit2, 
  Calendar, 
  Activity, 
  Sparkles, 
  Info,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import { ContributionIntelligenceSummary, MonthlyContributionBucket, ContributionActivityItem } from '@/types/activity';

interface DCCActivityIntelligenceProps {
  activityContext?: ContributionIntelligenceSummary | null;
}

export default function DCCActivityIntelligence({ activityContext }: DCCActivityIntelligenceProps) {
  if (!activityContext) {
    return null;
  }

  const {
    activeRepositoriesCount,
    analyzedRepositoriesCount,
    totalRecentContributions,
    frequency,
    primaryLanguages,
    lastActiveDate,
    contextualSummary,
    monthlyTimeline,
    recentActivities,
  } = activityContext;

  const maxCount = Math.max(...monthlyTimeline.map(m => m.count), 1);

  return (
    <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#38BDF8]/10 text-cyan-700 dark:text-[#38BDF8] border border-[#38BDF8]/20">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Engineering Activity & Contribution Context
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-cyan-700 dark:text-[#38BDF8] border border-[#38BDF8]/30">
              Supporting Context
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Real GitHub contribution activity provides operational context alongside AST reviews. Activity frequency does not replace verified technical benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-slate-500 dark:text-[#64748B]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last active: {new Date(lastActiveDate || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Top 4 Key Activity Context Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
            Active Repositories
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{activeRepositoriesCount}</span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8]">public repos</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B]">With verified commit history</p>
        </div>

        <div className="bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
            Analyzed Codebases
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#10B981]">{analyzedRepositoriesCount}</span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8]">audited</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Deep AST reviews completed</p>
        </div>

        <div className="bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
            Recent Contributions
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-[#38BDF8]">{totalRecentContributions}</span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8]">events (90d)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Commits & merged PRs</p>
        </div>

        <div className="bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
            Activity Cadence
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#7C3AED] dark:text-[#A78BFA]">{frequency}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Regularity of engineering output</p>
        </div>
      </div>

      {/* Contextual Narrative Alert */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-600 dark:text-[#38BDF8] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
          <strong className="text-slate-900 dark:text-[#F8FAFC]">Contextual Evidence: </strong>
          {contextualSummary}
        </div>
      </div>

      {/* Simple Contribution Timeline Widget */}
      {monthlyTimeline.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Contribution Cadence Timeline (Last 6 Months)
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#64748B]">
              <span className="inline-block w-2.5 h-2.5 rounded bg-cyan-500/60" />
              <span>Verified Activity Density</span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] p-4 rounded-xl">
            {monthlyTimeline.map((bucket, idx) => {
              const heightPercent = Math.max(20, Math.round((bucket.count / maxCount) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-full h-24 bg-slate-200/70 dark:bg-[#070A0F]/60 rounded-lg flex items-end justify-center p-1.5 border border-slate-200 dark:border-white/[0.03] group relative">
                    <div 
                      className="w-full max-w-[28px] bg-gradient-to-t from-cyan-500/40 to-cyan-500 rounded-md transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 bg-slate-900 dark:bg-[#070A0F] border border-slate-700 dark:border-white/[0.12] px-2 py-1 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                      {bucket.count} events ({bucket.commitCount}c / {bucket.prCount}pr)
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-[#94A3B8] text-center">{bucket.label.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-[#64748B] -mt-1.5">{bucket.count} events</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Stream (Selected top 5 items) */}
      {recentActivities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Public Contributions
          </h4>
          <div className="space-y-2">
            {recentActivities.slice(0, 5).map((act, idx) => {
              const isCommit = act.activityType === 'commit';
              const isPR = act.activityType === 'pull_request';
              return (
                <div
                  key={idx}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-[#111722] dark:hover:bg-[#151B26] border border-slate-200 hover:border-slate-300 dark:border-white/[0.06] dark:hover:border-white/[0.10] p-3 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isCommit
                        ? 'bg-[#38BDF8]/10 text-cyan-700 dark:text-[#38BDF8] border border-[#38BDF8]/20'
                        : isPR
                        ? 'bg-[#10B981]/10 text-emerald-700 dark:text-[#10B981] border border-[#10B981]/20'
                        : 'bg-slate-200/60 dark:bg-white/[0.05] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.08]'
                    }`}>
                      {isCommit ? <GitCommit className="w-3.5 h-3.5" /> : isPR ? <GitPullRequest className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-[#F8FAFC] truncate leading-tight">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono truncate mt-0.5">
                        {act.repositoryName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {act.metadata?.language && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.04] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.06] hidden sm:inline-block">
                        {act.metadata.language}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono whitespace-nowrap">
                      {new Date(act.activityDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
