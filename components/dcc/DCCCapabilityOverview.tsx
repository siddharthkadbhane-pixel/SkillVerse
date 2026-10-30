'use client';

import React from 'react';
import Link from 'next/link';
import ProgressRing from '@/components/ui/ProgressRing';
import { 
  CheckCircle2, 
  TrendingUp, 
  Briefcase, 
  Code2, 
  Layers, 
  GitFork, 
  Sparkles,
  Award,
  ShieldCheck,
  FolderGit2,
  Trophy,
  ArrowRight,
  Compass
} from 'lucide-react';
import { CapabilityDimensionsData, CapabilityLevel, ConfidenceLevel } from '@/types/dcc';

interface DCCCapabilityOverviewProps {
  card: {
    overallScore: number;
    level: CapabilityLevel;
    summary: string | null;
    confidenceScore: number;
  };
  dimensions: CapabilityDimensionsData;
  confidenceTier?: ConfidenceLevel;
  fresherState?: boolean;
  insights?: {
    strengths: string[];
    advice: string;
  };
}

export default function DCCCapabilityOverview({
  card,
  dimensions,
  confidenceTier,
  fresherState,
  insights,
}: DCCCapabilityOverviewProps) {
  const isFresher = fresherState || card.overallScore === 0;

  const eng = dimensions.engineering || { codeQuality: 75, architecture: 80, security: 70, performance: 75, testing: 60, documentation: 80 };
  const proj = dimensions.projects || { repositoryQuality: 75, complexity: 60, openSource: 70, buildSuccess: 98, deployments: 2, projectDiversity: 70 };
  const collab = dimensions.collaboration || { pullRequests: 6, codeReviews: 4, mentoring: 50, teamwork: 75 };
  const growth = dimensions.growth || { velocity: 85, consistency: 90, skillExpansion: 70, activity: 78 };
  const career = dimensions.career || { readiness: 'Immediate', roleRecommendations: ['Senior Fullstack Engineer'], strengths: [], weaknesses: [] };

  // Confidence Tier styling
  const resolvedConfidence: ConfidenceLevel = confidenceTier || (
    card.confidenceScore >= 80 ? 'High Confidence' :
    card.confidenceScore >= 60 ? 'Moderate Confidence' :
    card.confidenceScore > 0 ? 'Limited Evidence' : 'Insufficient Evidence'
  );

  const confidenceStyles: Record<ConfidenceLevel, { bg: string; text: string; border: string }> = {
    'High Confidence': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    'Moderate Confidence': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    'Limited Evidence': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    'Insufficient Evidence': { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  };

  // Fresher Path: Honest Empty State
  if (isFresher) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1015] p-8 text-center space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#7C3AED] mx-auto">
          <Compass className="w-6 h-6" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-zinc-500/10 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-500/20">
            <span>Fresher Path</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            Not enough engineering evidence yet
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Your Developer Capability Card is generated from real code implementation. Choose an action below to start proving your abilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
          <Link
            href="/projects"
            className="p-4 rounded-xl bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.07] hover:border-[#7C3AED]/40 transition-colors flex flex-col justify-between group"
          >
            <div className="space-y-1.5">
              <FolderGit2 className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors">
                Analyze Repository
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                Connect your GitHub repo for instant AST code and architecture audit.
              </p>
            </div>
            <span className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-medium flex items-center gap-1 mt-3">
              Import Repo <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/challenges"
            className="p-4 rounded-xl bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.07] hover:border-cyan-500/40 transition-colors flex flex-col justify-between group"
          >
            <div className="space-y-1.5">
              <Trophy className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                Join a Challenge
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                Complete test-driven verification challenges to earn Verified skills.
              </p>
            </div>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1 mt-3">
              View Challenges <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/career"
            className="p-4 rounded-xl bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.07] hover:border-emerald-500/40 transition-colors flex flex-col justify-between group"
          >
            <div className="space-y-1.5">
              <Compass className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                Guided Roadmap
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                Explore targeted learning goals and build projects that count as evidence.
              </p>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-3">
              Start Learning <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const pillarCards = [
    {
      title: 'Engineering Rigor',
      score: eng.codeQuality,
      icon: Code2,
      color: 'text-indigo-600 dark:text-indigo-400',
      barColor: '#6366F1',
      description: `${eng.architecture}% Arch · ${eng.security}% Sec · ${eng.testing}% Test`,
    },
    {
      title: 'Project Complexity',
      score: proj.complexity,
      icon: Layers,
      color: 'text-cyan-600 dark:text-cyan-400',
      barColor: '#06B6D4',
      description: `${proj.deployments} Verified Deploys · ${proj.buildSuccess}% CI Pass`,
    },
    {
      title: 'Collaboration & Reviews',
      score: collab.teamwork,
      icon: GitFork,
      color: 'text-emerald-600 dark:text-emerald-400',
      barColor: '#10B981',
      description: `${collab.pullRequests} PRs · ${collab.codeReviews} Code Reviews`,
    },
    {
      title: 'Growth Velocity',
      score: growth.consistency,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      barColor: '#F59E0B',
      description: `${growth.velocity}% Velocity · ${growth.activity}% Consistency`,
    },
  ];

  const cStyle = confidenceStyles[resolvedConfidence];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Score Hero (Left - 5 Cols) */}
      <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1015] p-6 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Capability Scorecard
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}>
              {resolvedConfidence}
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
              <span className="text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Assigned Tier</span>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{card.level}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                Ranked in top capability percentile based on code quality and Git audit telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Role & Readiness snapshot */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-500">Industry Readiness:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {career.readiness || 'Immediate'}
            </span>
          </div>

          {career.roleRecommendations?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500 dark:text-zinc-500">Target Role Matches:</span>
              <div className="flex flex-wrap gap-1.5">
                {career.roleRecommendations.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Pillars (Right - 7 Cols) */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pillarCards.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1015] p-5 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{pillar.title}</span>
                  <Icon className={`w-4 h-4 ${pillar.color}`} />
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    {pillar.score}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500">/100</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pillar.score}%`, backgroundColor: pillar.barColor }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-4 leading-snug">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
