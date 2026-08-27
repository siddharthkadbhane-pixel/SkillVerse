'use client';

import React from 'react';
import { 
  TrendingUp, 
  History, 
  Award, 
  BookOpen, 
  AlertCircle, 
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  LineChart,
  Layers,
  FolderGit2,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { CapabilityHistoryEntry, GrowthTimelineItem, GrowthChartPoint } from '@/types/dcc';
import DCCCapabilityTrendChart from './DCCCapabilityTrendChart';
import DCCGrowthTimeline from './DCCGrowthTimeline';

interface DCCGrowthHistoryProps {
  history?: CapabilityHistoryEntry[];
  timeline?: GrowthTimelineItem[];
  growthChart?: GrowthChartPoint[];
  insights?: {
    strengths: string[];
    weaknesses: string[];
    learningSuggestions: { topic: string; resource: string }[];
    advice: string;
  };
}

export default function DCCGrowthHistory({
  history = [],
  timeline = [],
  growthChart = [],
  insights,
}: DCCGrowthHistoryProps) {

  // Format recent capability changes from timeline / history
  const recentChanges = timeline.slice(0, 5).map(item => {
    let icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    let iconBg = 'bg-emerald-500/10 border-emerald-500/20';

    if (item.changeType === 'skill_strengthened') {
      icon = <TrendingUp className="w-3.5 h-3.5 text-blue-400" />;
      iconBg = 'bg-blue-500/10 border-blue-500/20';
    } else if (item.changeType === 'dimension_improved') {
      icon = <Layers className="w-3.5 h-3.5 text-purple-400" />;
      iconBg = 'bg-purple-500/10 border-purple-500/20';
    } else if (item.changeType === 'repo_analyzed') {
      icon = <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />;
      iconBg = 'bg-indigo-500/10 border-indigo-500/20';
    } else if (item.changeType === 'level_promoted') {
      icon = <Award className="w-3.5 h-3.5 text-amber-400" />;
      iconBg = 'bg-amber-500/10 border-amber-500/20';
    }

    return {
      id: item.id,
      title: item.title.startsWith('+') ? item.title : `+ ${item.title}`,
      explanation: item.description,
      date: item.date,
      evidenceRepo: item.evidenceRepo,
      badgeText: item.badgeText || 'Verified',
      icon,
      iconBg,
    };
  });

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/[0.06]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
            Capability Growth
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            How your verified engineering capabilities have evolved.
          </p>
        </div>
        <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20 self-start sm:self-auto">
          ✓ Real-Time Evidence Telemetry
        </span>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT / MAIN AREA (7 cols) -> Capability Growth Chart + Growth Timeline */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Capability Growth Chart */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Capability Trajectory
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">Score & Skills Over Time</span>
            </div>

            <DCCCapabilityTrendChart data={growthChart} height={200} />
          </div>

          {/* 2. Growth Timeline */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Growth Timeline
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">Chronological Log</span>
            </div>

            <DCCGrowthTimeline timeline={timeline} />
          </div>
        </div>

        {/* RIGHT / SUPPORTING AREA (5 cols) -> Recent Capability Changes + Targeted Upgrades */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* 1. Recent Capability Changes (Visually similar to Recent Activity) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Recent Capability Changes
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">Verified Events</span>
            </div>

            {recentChanges.length > 0 ? (
              <div className="space-y-2.5">
                {recentChanges.map((change, idx) => (
                  <div
                    key={change.id || idx}
                    className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] hover:border-white/[0.08] transition-all flex items-start gap-3"
                  >
                    <div className={`p-1.5 rounded-lg border ${change.iconBg} shrink-0 mt-0.5`}>
                      {change.icon}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-[#F8FAFC] truncate">
                          {change.title}
                        </h4>
                        <span className="font-mono text-[10px] text-[#64748B] shrink-0">
                          {change.date}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#94A3B8] leading-tight line-clamp-2">
                        {change.explanation}
                      </p>

                      {change.evidenceRepo && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#64748B] pt-0.5">
                          <FolderGit2 className="w-3 h-3 text-[#7C3AED]" />
                          <span>Repo: <strong className="text-zinc-300 font-normal">{change.evidenceRepo}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[#111722]/50 border border-white/[0.04] text-center space-y-1">
                <History className="w-5 h-5 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No Capability Changes Yet</p>
                <p className="text-[11px] text-zinc-500">Analyze repositories to build your verified change history.</p>
              </div>
            )}
          </div>

          {/* 2. Actionable Growth Vectors / Targeted Upgrades */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Actionable Growth Vectors
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">Targeted Upgrades</span>
            </div>

            <div className="space-y-3">
              {insights?.weaknesses && insights.weaknesses.length > 0 && (
                <div className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#F59E0B] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Key Capability Opportunities:
                  </span>
                  <ul className="text-xs text-[#94A3B8] space-y-1 list-disc list-inside">
                    {insights.weaknesses.slice(0, 2).map((w, i) => (
                      <li key={i} className="leading-relaxed">{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights?.learningSuggestions && insights.learningSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    Suggested Action Modules:
                  </span>
                  <div className="space-y-1.5">
                    {insights.learningSuggestions.slice(0, 2).map((sugg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#111722] border border-white/[0.04] text-xs"
                      >
                        <span className="font-medium text-zinc-200">{sugg.topic}</span>
                        <span className="text-[11px] font-mono text-[#A78BFA] flex items-center gap-0.5">
                          {sugg.resource} <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights?.advice && (
                <div className="pt-2 border-t border-white/[0.04]">
                  <p className="text-xs text-[#94A3B8] italic leading-relaxed">
                    "{insights.advice}"
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
