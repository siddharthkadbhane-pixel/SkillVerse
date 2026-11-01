'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  FolderGit2, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  Layers,
  HelpCircle 
} from 'lucide-react';
import { DeveloperSearchResultItem } from '@/types/discovery';
import { CapabilityLevel, SkillVerificationStatus } from '@/types/dcc';

interface DeveloperDiscoveryCardProps {
  developer: DeveloperSearchResultItem;
}

export default function DeveloperDiscoveryCard({ developer }: DeveloperDiscoveryCardProps) {
  const getLevelBadge = (level: CapabilityLevel) => {
    switch (level) {
      case 'Elite':
        return 'bg-[#6366F1]/10 text-[#6366F1] dark:text-[#C4B5FD] border-[#6366F1]/30';
      case 'Expert':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#93C5FD] border-[#3B82F6]/30';
      case 'Advanced':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#93C5FD] border-[#3B82F6]/30';
      case 'Professional':
        return 'bg-[#14B8A6]/10 text-[#14B8A6] dark:text-[#5EEAD4] border-[#14B8A6]/30';
      case 'Creator':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-100 dark:bg-[#64748B]/20 text-slate-700 dark:text-[#CBD5E1] border-slate-200 dark:border-[#64748B]/40';
    }
  };

  const getStatusBadge = (status: SkillVerificationStatus) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified',
          classes: 'bg-[#14B8A6]/10 text-[#14B8A6] dark:text-[#5EEAD4] border-[#14B8A6]/30',
          icon: CheckCircle2,
        };
      case 'supported':
        return {
          label: 'Supported',
          classes: 'bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#93C5FD] border-[#3B82F6]/30',
          icon: Layers,
        };
      case 'detected':
      default:
        return {
          label: 'Detected',
          classes: 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-white/[0.10]',
          icon: Terminal,
        };
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D121A] hover:bg-slate-50 dark:hover:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group relative overflow-hidden">
      {/* Match Reason Banner if present */}
      {developer.matchReason && developer.relevanceScore && developer.relevanceScore > 50 && (
        <div className="mb-3.5 -mt-1 -mx-1 px-3 py-1 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg flex items-center justify-between text-[11px]">
          <span className="text-[#6366F1] dark:text-[#A78BFA] font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#6366F1]" />
            {developer.matchReason}
          </span>
          <span className="text-[10px] font-mono text-[#6366F1] dark:text-[#A78BFA]/80 font-bold">
            {developer.relevanceScore} pts match
          </span>
        </div>
      )}

      <div>
        {/* Header: Avatar, Name, Username, Score */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-[#151B26] border border-slate-200 dark:border-white/[0.12] shrink-0">
              {developer.avatarUrl ? (
                <img
                  src={developer.avatarUrl}
                  alt={developer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[#6366F1]">
                  {developer.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] dark:group-hover:text-[#93C5FD] transition-colors leading-tight">
                  {developer.name}
                </h3>
                <span title="Verified SkillVerse Developer" className="inline-flex items-center">
                  <ShieldCheck className="w-4 h-4 text-[#14B8A6] shrink-0" />
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">@{developer.username}</p>
              {developer.location && (
                <p className="text-[11px] text-slate-400 dark:text-[#64748B] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {developer.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border mb-1 ${getLevelBadge(
                developer.dccLevel
              )}`}
            >
              {developer.dccLevel}
            </span>
            <span className="font-mono text-xs font-bold text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded-md border border-[#14B8A6]/20">
              {developer.overallScore} <span className="text-[10px] text-slate-400 dark:text-[#64748B]">/ 1000</span>
            </span>
          </div>
        </div>

        {/* Bio / Tagline */}
        {developer.bio && (
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-2 mb-3.5 leading-relaxed">
            {developer.bio}
          </p>
        )}

        {/* Top Verified Skills Grid */}
        <div className="space-y-1.5 mb-4">
          <span className="text-[10px] font-bold text-slate-400 dark:text-[#64748B] uppercase tracking-wider block">
            Verified Capabilities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {developer.topVerifiedSkills.slice(0, 5).map((skill, idx) => {
              const badge = getStatusBadge(skill.status);
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium ${badge.classes}`}
                  title={skill.whyVerified || `${skill.name} (${badge.label})`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{skill.name}</span>
                  <span className="text-[10px] font-mono opacity-70">Lvl {skill.level}</span>
                </div>
              );
            })}
            {developer.topVerifiedSkills.length > 5 && (
              <span className="text-[11px] font-mono text-slate-400 dark:text-[#64748B] self-center px-1">
                +{developer.topVerifiedSkills.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Projects & Technologies summary */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-[#94A3B8] bg-slate-50 dark:bg-[#070A0F]/60 border border-slate-200 dark:border-white/[0.04] p-2 rounded-lg mb-4">
          <span className="flex items-center gap-1 font-medium text-slate-900 dark:text-[#F8FAFC]">
            <FolderGit2 className="w-3.5 h-3.5 text-[#6366F1]" />
            {developer.analyzedProjectCount} Analyzed {developer.analyzedProjectCount === 1 ? 'Project' : 'Projects'}
          </span>
          <span className="text-slate-300 dark:text-white/[0.12]">•</span>
          <span className="truncate font-mono text-slate-500 dark:text-[#64748B]">
            {developer.primaryTechnologies.slice(0, 3).join(', ')}
          </span>
        </div>
      </div>

      {/* Footer Action: View Capability Card */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B]">
          Updated {new Date(developer.lastUpdated).toLocaleDateString()}
        </span>
        <Link
          href={developer.dccUrl}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#6366F1] dark:text-[#C4B5FD] hover:text-[#4F46E5] dark:hover:text-white border border-[#6366F1]/30 text-xs font-semibold transition-all group-hover:border-[#6366F1]/50"
        >
          View Capability Card
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
