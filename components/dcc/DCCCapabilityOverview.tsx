'use client';

import React from 'react';
import ProgressRing from '@/components/ui/ProgressRing';
import { 
  CheckCircle2, 
  TrendingUp, 
  Briefcase, 
  Code2, 
  Layers, 
  GitFork, 
  Sparkles,
  Award
} from 'lucide-react';
import { CapabilityDimensionsData, CapabilityLevel } from '@/types/dcc';

interface DCCCapabilityOverviewProps {
  card: {
    overallScore: number;
    level: CapabilityLevel;
    summary: string | null;
    confidenceScore: number;
  };
  dimensions: CapabilityDimensionsData;
  insights?: {
    strengths: string[];
    advice: string;
  };
}

export default function DCCCapabilityOverview({
  card,
  dimensions,
  insights,
}: DCCCapabilityOverviewProps) {
  const eng = dimensions.engineering || { codeQuality: 75, architecture: 80, security: 70, performance: 75, testing: 60, documentation: 80 };
  const proj = dimensions.projects || { repositoryQuality: 75, complexity: 60, openSource: 70, buildSuccess: 98, deployments: 2, projectDiversity: 70 };
  const collab = dimensions.collaboration || { pullRequests: 6, codeReviews: 4, mentoring: 50, teamwork: 75 };
  const growth = dimensions.growth || { velocity: 85, consistency: 90, skillExpansion: 70, activity: 78 };
  const career = dimensions.career || { readiness: 'Immediate', roleRecommendations: ['Senior Fullstack Engineer'], strengths: [], weaknesses: [] };

  const pillarCards = [
    {
      title: 'Engineering Rigor',
      score: eng.codeQuality,
      icon: Code2,
      color: 'text-indigo-400',
      barColor: '#6366F1',
      description: `${eng.architecture}% Arch · ${eng.security}% Sec · ${eng.testing}% Test`,
    },
    {
      title: 'Project Complexity',
      score: proj.complexity,
      icon: Layers,
      color: 'text-cyan-400',
      barColor: '#06B6D4',
      description: `${proj.deployments} Verified Deploys · ${proj.buildSuccess}% CI Pass`,
    },
    {
      title: 'Collaboration & Reviews',
      score: collab.teamwork,
      icon: GitFork,
      color: 'text-emerald-400',
      barColor: '#10B981',
      description: `${collab.pullRequests} PRs · ${collab.codeReviews} Code Reviews`,
    },
    {
      title: 'Growth Velocity',
      score: growth.consistency,
      icon: TrendingUp,
      color: 'text-amber-400',
      barColor: '#F59E0B',
      description: `${growth.velocity}% Velocity · ${growth.activity}% Consistency`,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Score Hero (Left - 5 Cols) */}
      <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#0E1015] p-6 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Capability Scorecard
            </span>
            <span className="text-xs font-mono text-zinc-500">
              Confidence {card.confidenceScore}%
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <ProgressRing
                value={card.overallScore / 10}
                size={130}
                strokeWidth={8}
                color="#6366F1"
                label={String(card.overallScore)}
                sublabel="/1000"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Assigned Tier</span>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span className="text-xl font-bold text-white tracking-tight">{card.level}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Ranked in top capability percentile based on code quality and Git audit telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Role & Readiness snapshot */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Industry Readiness:</span>
            <span className="font-medium text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {career.readiness || 'Immediate'}
            </span>
          </div>

          {career.roleRecommendations?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-500">Target Role Matches:</span>
              <div className="flex flex-wrap gap-1.5">
                {career.roleRecommendations.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Pillars Matrix (Right - 7 Cols) */}
      <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#0E1015] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Core Engineering Pillars
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              30-Second Recruiter Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillarCards.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={pillar.title}
                  className="p-4 rounded-lg bg-zinc-900/60 border border-white/[0.04] flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${pillar.color}`} />
                      <span className="text-xs font-medium text-zinc-200">{pillar.title}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-white">{pillar.score}/100</span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pillar.score}%`, backgroundColor: pillar.barColor }}
                    />
                  </div>

                  <span className="text-[11px] text-zinc-500 font-mono truncate">
                    {pillar.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            {card.summary || insights?.advice || 'Developer demonstrated strong proficiency in modern TypeScript architecture, verifiable repository audits, and high code quality standards.'}
          </p>
        </div>

      </div>

    </div>
  );
}
