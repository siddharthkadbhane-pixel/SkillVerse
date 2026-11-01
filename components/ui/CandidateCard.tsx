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
    <div className="bg-white dark:bg-[#0D121A] hover:bg-slate-50 dark:hover:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-[#151B26] border border-slate-200 dark:border-white/[0.10] shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#6366F1]">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] dark:group-hover:text-[#93C5FD] transition-colors">
                  {name}
                </h3>
                {verified && (
                  <span title="Verified Developer" className="text-[#14B8A6]">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-1">{title}</p>
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-[#6366F1] dark:text-[#93C5FD] tracking-wider">
                Match
              </span>
              <span className="font-mono text-sm font-bold text-[#6366F1] dark:text-[#93C5FD] bg-[#6366F1]/10 border border-[#6366F1]/20 px-2 py-0.5 rounded">
                {matchScore}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-[#14B8A6] tracking-wider">
                Skill Score
              </span>
              <span className="font-mono text-sm font-bold text-[#14B8A6] bg-[#14B8A6]/10 border border-[#14B8A6]/20 px-2 py-0.5 rounded">
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
        <div className="grid grid-cols-4 gap-2 py-3 px-3 bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] rounded-lg mb-4 text-center">
          <div>
            <span className="block font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
              {projectCount}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#64748B] uppercase">Projects</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
              {commitCount}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#64748B] uppercase">Commits</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
              {prCount}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#64748B] uppercase">PRs</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#14B8A6]">
              ↑{growth}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#64748B] uppercase">Growth</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[11px] text-[#14B8A6] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
          Verified Technical Evidence
        </div>

        <div className="flex items-center gap-2">
          {onShortlist && (
            <button
              onClick={() => onShortlist(id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isShortlisted
                  ? 'bg-[#6366F1]/20 border-[#6366F1] text-[#6366F1] dark:text-[#A78BFA]'
                  : 'bg-slate-100 dark:bg-[#111722] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
              title={isShortlisted ? 'Shortlisted' : 'Shortlist Candidate'}
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          )}

          <Link
            href={`/company/candidates/${id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white transition-colors shadow-sm"
          >
            Evaluate
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
