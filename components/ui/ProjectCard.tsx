import React from 'react';
import Link from 'next/link';
import { Star, GitFork, CheckCircle2, ArrowUpRight, Github, Code2, Clock } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  fullName?: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  isAnalyzed: boolean;
  analyzedAt?: string | null;
  aiScore?: number;
  healthScore?: number;
  commitCount?: number | string;
  prCount?: number;
  reviewId?: string;
}

export default function ProjectCard({
  id,
  name,
  fullName,
  description,
  htmlUrl,
  language,
  stars,
  forks,
  isAnalyzed,
  analyzedAt,
  aiScore = 92,
  healthScore = 90,
  commitCount = 142,
  prCount = 18,
  reviewId,
}: ProjectCardProps) {
  const getLanguageColor = (lang: string | null) => {
    switch (lang?.toLowerCase()) {
      case 'typescript':
        return '#3178C6';
      case 'javascript':
        return '#F7DF1E';
      case 'rust':
        return '#DEA584';
      case 'python':
        return '#3572A5';
      case 'go':
        return '#00ADD8';
      default:
        return '#7C3AED';
    }
  };

  return (
    <div className="bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#A78BFA] shrink-0" />
            <h3 className="font-semibold text-sm text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors truncate">
              {name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAnalyzed ? (
              <span className="font-mono text-xs font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Score {aiScore}
              </span>
            ) : (
              <span className="text-[11px] text-[#64748B] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                Pending Audit
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] line-clamp-2 mb-4 leading-relaxed min-h-[32px]">
          {description || 'No description provided for this repository.'}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-[#111722] border border-white/[0.04] rounded-lg mb-4 text-center">
          <div>
            <span className="block font-mono text-xs font-bold text-[#F8FAFC]">
              {stars}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Stars</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#F8FAFC]">
              {forks}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Forks</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#F8FAFC]">
              {commitCount}
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Commits</span>
          </div>
          <div>
            <span className="block font-mono text-xs font-bold text-[#10B981]">
              {healthScore}%
            </span>
            <span className="text-[10px] text-[#64748B] uppercase">Health</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
        <div className="flex items-center gap-3">
          {language && (
            <span className="flex items-center gap-1 text-[11px] text-[#94A3B8] font-medium">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getLanguageColor(language) }}
              />
              {language}
            </span>
          )}
          {analyzedAt && (
            <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {new Date(analyzedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-[#64748B] hover:text-[#F8FAFC] transition-colors"
            title="View on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          <Link
            href={`/reviews?repo=${encodeURIComponent(fullName || name)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#A78BFA] hover:text-white transition-colors"
          >
            Audit Report
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
