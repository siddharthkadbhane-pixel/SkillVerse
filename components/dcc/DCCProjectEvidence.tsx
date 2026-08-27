'use client';

import React from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  Star, 
  GitFork, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Code
} from 'lucide-react';
import { ProjectEvidenceSummary, RepoContributionRole } from '@/types/dcc';

interface DCCProjectEvidenceProps {
  projects: ProjectEvidenceSummary[];
}

export default function DCCProjectEvidence({ projects = [] }: DCCProjectEvidenceProps) {
  const getRoleBadge = (role?: RepoContributionRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#111722] text-[#94A3B8] border border-white/[0.06]">
            Owner
          </span>
        );
      case 'contributor':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
            Contributor
          </span>
        );
      case 'fork':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
            Fork
          </span>
        );
      default:
        return null;
    }
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-6 shadow-sm">
        <div className="border-b border-white/[0.06] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
              Project Evidence
            </h2>
          </div>
        </div>
        <div className="py-10 text-center text-[#64748B] text-xs border border-dashed border-white/[0.06] rounded-lg">
          No repositories analyzed yet. Sync your GitHub account to generate verified repository proof cards.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-5 sm:p-6 shadow-sm">
      
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-4 mb-5">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
            Project Evidence & Audit Trails
          </h2>
        </div>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Audited repositories showcasing verified architecture quality, code metrics, and demonstrated skills.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-5 rounded-lg bg-[#111722] border border-white/[0.04] hover:border-white/[0.12] transition-all flex flex-col justify-between gap-4"
          >
            <div>
              {/* Repo Title & Stats */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={proj.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#F8FAFC] hover:text-[#A78BFA] transition-colors inline-flex items-center gap-1 font-mono"
                    >
                      {proj.name}
                      <ExternalLink className="w-3 h-3 text-[#64748B]" />
                    </a>

                    {getRoleBadge(proj.contributionRole)}

                    {proj.isAnalyzed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-mono">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                    {proj.description || 'Public repository audited for engineering capabilities on SkillVerse.'}
                  </p>
                </div>

                {proj.overallScore !== null && (
                  <div className="shrink-0 text-right">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#7C3AED]/15 text-[#C4B5FD] border border-[#7C3AED]/30">
                      {proj.overallScore}/100
                    </span>
                  </div>
                )}
              </div>

              {/* Languages & Skills Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {proj.language && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#151B26] text-[#F8FAFC] border border-white/[0.06]">
                    {proj.language}
                  </span>
                )}
                {proj.demonstratedSkills?.slice(0, 3).map((sk) => (
                  <span
                    key={sk}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0D121A] text-[#94A3B8] border border-white/[0.04]"
                  >
                    {sk}
                  </span>
                ))}
              </div>

              {/* Strengths Highlights */}
              {proj.strengths?.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-white/[0.04] flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-[#64748B]">Audit Highlights:</span>
                  <ul className="text-xs text-[#94A3B8] flex flex-col gap-1 list-disc list-inside">
                    {proj.strengths.slice(0, 2).map((st, i) => (
                      <li key={i} className="line-clamp-1">{st}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-[#64748B] font-mono">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#64748B]" />
                  {proj.stars}
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork className="w-3 h-3 text-[#64748B]" />
                  {proj.forks}
                </span>
              </div>

              <span className="text-[#94A3B8]">
                Activity: <strong className="text-white font-normal">{proj.activityLevel}</strong>
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
