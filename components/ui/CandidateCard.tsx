import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, GitCommit, GitPullRequest, FolderGit2, ArrowUpRight, BookmarkPlus } from 'lucide-react';
import SkillChip from './SkillChip';

interface CandidateCardProps {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  matchScore: number;
  skillScore: number;
  topSkills: { name: string; level: number }[];
  projectCount: number;
  commitCount: string | number;
  prCount: number;
  growth: number | string;
  verified?: boolean;
  onShortlist?: (id: string) => void;
  isShortlisted?: boolean;
}

export default function CandidateCard({
  id,
  name,
  title,
  avatarUrl,
  matchScore,
  skillScore,
  topSkills,
  projectCount,
  commitCount,
  prCount,
  growth,
  verified = true,
  onShortlist,
  isShortlisted = false,
}: CandidateCardProps) {
  return (
    <div className="bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#151B26] border border-white/[0.10] shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#A78BFA]">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors">
                  {name}
                </h3>
                {verified && (
                  <span title="Verified Developer" className="text-[#10B981]">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] line-clamp-1">{title}</p>
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-[#38BDF8] tracking-wider">
                Match
              </span>
              <span className="font-mono text-sm font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2 py-0.5 rounded">
                {matchScore}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-[#10B981] tracking-wider">
                Skill Score
              </span>
              <span className="font-mono text-sm font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded">
                {skillScore}
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {topSkills.slice(0, 4).map((skill, i) => (
            <SkillChip
              key={i}
              name={skill.name}
              level={skill.level}
              size="sm"
              verified={false}
            />
          ))}
        </div>

        {/* Evidence Metrics */}
        <div className="grid grid-cols-4 gap-2 py-3 px-3 bg-[#111722] border border-white/[0.04] rounded-lg mb-4 text-center">
          <div>
            <span className="block font-mono text-xs font-bold text-[#F8FAFC]">
              {projectCount}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Projects</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#F8FAFC]">
              {commitCount}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Commits</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#F8FAFC]">
              {prCount}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">PRs</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#10B981]">
              ↑{growth}%
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Growth</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          Verified Technical Evidence
        </div>

        <div className="flex items-center gap-2">
          {onShortlist && (
            <button
              onClick={() => onShortlist(id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isShortlisted
                  ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-[#A78BFA]'
                  : 'bg-[#111722] border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title={isShortlisted ? 'Shortlisted' : 'Shortlist Candidate'}
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          )}

          <Link
            href={`/company/candidates/${id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
          >
            Evaluate
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
