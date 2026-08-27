'use client';

import React from 'react';
import { 
  Code2, 
  Layers, 
  ShieldCheck, 
  Zap, 
  FileCheck2, 
  BookOpen,
  FolderGit2,
  CheckCircle2
} from 'lucide-react';
import { EngineeringMetricEvidence } from '@/types/dcc';

interface DCCEngineeringCapabilityProps {
  metrics: EngineeringMetricEvidence[];
}

export default function DCCEngineeringCapability({ metrics = [] }: DCCEngineeringCapabilityProps) {
  const getIcon = (key: string) => {
    switch (key) {
      case 'codeQuality': return Code2;
      case 'architecture': return Layers;
      case 'security': return ShieldCheck;
      case 'performance': return Zap;
      case 'testing': return FileCheck2;
      default: return BookOpen;
    }
  };

  const getRatingBadgeClass = (rating: EngineeringMetricEvidence['rating']) => {
    switch (rating) {
      case 'Exceptional': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Strong': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Adequate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0E1015] p-6 shadow-sm">
      
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Engineering Capability & Rigor
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          In-depth architectural, security, testing, and clean code metrics verified across codebase trees.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const Icon = getIcon(m.key);
          return (
            <div
              key={m.key}
              className="p-4 rounded-lg bg-zinc-900/50 border border-white/[0.04] flex flex-col justify-between gap-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-zinc-800 text-indigo-400 border border-white/[0.04]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{m.label}</h3>
                    <span className="text-[11px] font-mono text-zinc-500">Score: {m.score}/100</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getRatingBadgeClass(m.rating)}`}>
                  {m.rating}
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${m.score}%`,
                    backgroundColor: m.score >= 80 ? '#10B981' : m.score >= 65 ? '#6366F1' : '#F59E0B',
                  }}
                />
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {m.explanation}
              </p>

              {/* Verified Repos Evidence footer */}
              {m.evidenceRepos?.length > 0 && (
                <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <FolderGit2 className="w-3 h-3 text-zinc-400" />
                    {m.evidenceRepos.length} verified {m.evidenceRepos.length === 1 ? 'repo' : 'repos'}
                  </span>
                  <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Audited
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
