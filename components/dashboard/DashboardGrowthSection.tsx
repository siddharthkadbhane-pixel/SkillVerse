'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  FolderGit2, 
  ArrowRight, 
  History,
  CheckCircle2,
  Layers,
  Award
} from 'lucide-react';
import { DashboardGrowthSummary, GrowthTimelineItem } from '@/types/dcc';

export default function DashboardGrowthSection() {
  const [summary, setSummary] = useState<DashboardGrowthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/growth')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setSummary(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type: GrowthTimelineItem['changeType']) => {
    switch (type) {
      case 'skill_verified':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'skill_strengthened':
        return <TrendingUp className="w-3.5 h-3.5 text-blue-400" />;
      case 'dimension_improved':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      case 'repo_analyzed':
        return <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'level_promoted':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const recentEvent = summary?.recentEvents?.[0] || summary?.latestMilestone;

  return (
    <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#6366F1]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
            Capability Growth
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6366F1]/10 text-[#6366F1] dark:text-[#93C5FD] border border-[#6366F1]/20">
            DCC Telemetry
          </span>
        </div>

        <Link
          href="/dcc"
          className="text-xs font-semibold text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors flex items-center gap-1 group"
        >
          <span>View Capability History</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">Verified Skills</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {summary?.verifiedSkillsCount ?? '8'}
            </span>
            <span className="text-[10px] font-mono text-[#14B8A6] font-semibold">+3 this month</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">New Capabilities</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {summary?.newSkillsCount ?? '2'}
            </span>
            <span className="text-[10px] font-mono text-[#3B82F6] font-semibold">Detected</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">Evidence Added</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {summary?.recentProjectsCount ?? '7'} projects
            </span>
            <span className="text-[10px] font-mono text-[#6366F1] dark:text-[#C4B5FD] font-semibold">100% AST</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">Recent Change</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#F8FAFC] truncate">
              {recentEvent ? recentEvent.title.replace('+', '').trim() : 'React verification strengthened'}
            </span>
            <TrendingUp className="w-3 h-3 text-[#14B8A6] shrink-0 ml-1" />
          </div>
        </div>
      </div>

      {/* Recent Capability Milestones Feed */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#64748B] block">
          Recent Capability Changes
        </span>

        {summary?.recentEvents && summary.recentEvents.length > 0 ? (
          <div className="space-y-2">
            {summary.recentEvents.slice(0, 3).map((event, i) => (
              <div
                key={event.id || i}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1 rounded bg-slate-200 dark:bg-zinc-800 shrink-0">
                    {getIcon(event.changeType)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-zinc-200 truncate">
                      {event.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 truncate">
                      {event.evidenceRepo ? `Evidence: ${event.evidenceRepo}` : event.description}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                  {event.date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#111722]/50 border border-slate-200 dark:border-white/[0.04] text-center text-xs text-slate-500 dark:text-zinc-500">
            Analyze repositories to start populating your capability growth trail.
          </div>
        )}
      </div>
    </div>
  );
}
