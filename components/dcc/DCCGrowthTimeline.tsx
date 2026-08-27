'use client';

import React from 'react';
import { 
  History, 
  CheckCircle2, 
  TrendingUp, 
  FolderGit2, 
  Sparkles, 
  Award,
  Layers,
  ArrowUpRight,
  GitBranch
} from 'lucide-react';
import { GrowthTimelineItem } from '@/types/dcc';

interface DCCGrowthTimelineProps {
  timeline: GrowthTimelineItem[];
}

export default function DCCGrowthTimeline({ timeline = [] }: DCCGrowthTimelineProps) {
  const getBadgeStyle = (variant?: GrowthTimelineItem['badgeVariant']) => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

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

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 rounded-lg bg-zinc-900/30 border border-white/[0.04] text-center flex flex-col items-center gap-2">
        <History className="w-6 h-6 text-zinc-600 mb-1" />
        <h4 className="text-xs font-semibold text-zinc-300">No Capability History Yet</h4>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          Analyze your first repository to start building your verified engineering growth timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-5 border-l border-white/[0.08] space-y-4">
      {timeline.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          
          {/* Bullet node on timeline line */}
          <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#0E1015] border-2 border-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </div>

          {/* Event Content Box */}
          <div className="p-3.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/[0.04] hover:border-white/[0.08] transition-all flex flex-col gap-2">
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-zinc-800/80 border border-white/[0.04]">
                  {getIcon(item.changeType)}
                </span>
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getBadgeStyle(item.badgeVariant)}`}>
                  {item.badgeText || 'Verified'}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {item.date}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {item.description}
            </p>

            {item.evidenceRepo && (
              <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <FolderGit2 className="w-3 h-3 text-zinc-400" />
                  Evidence: <strong className="text-zinc-300 font-medium">{item.evidenceRepo}</strong>
                </span>
                <span className="text-zinc-400 flex items-center gap-0.5 text-[10px]">
                  Git Audit Linked
                </span>
              </div>
            )}

          </div>
        </div>
      ))}
    </div>
  );
}
