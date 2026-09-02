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

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178C6',
  javascript: '#F7DF1E',
  rust:       '#DEA584',
  python:     '#3572A5',
  go:         '#00ADD8',
  java:       '#B07219',
  cpp:        '#F34B7D',
};

function getLanguageColor(lang: string | null): string {
  return LANGUAGE_COLORS[lang?.toLowerCase() ?? ''] ?? '#7C3AED';
}

export default function ProjectCard({
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
  prCount,
  reviewId,
}: ProjectCardProps) {
  return (
    <div className="group bg-[#0E1117] border border-white/[0.07] hover:border-white/[0.12] rounded-xl p-4 transition-colors flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          <h3 className="text-[13px] font-medium text-[#F1F5F9] group-hover:text-[#A78BFA] transition-colors truncate">
            {name}
          </h3>
        </div>
        <div className="shrink-0">
          {isAnalyzed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981] bg-[rgba(16,185,129,0.10)] px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {aiScore}
            </span>
          ) : (
            <span className="text-[11px] text-[#64748B] bg-white/[0.04] px-1.5 py-0.5 rounded">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[12px] text-[#64748B] line-clamp-2 leading-relaxed min-h-[32px]">
        {description || 'No description provided.'}
      </p>

      {/* Metrics strip — compact 3-column */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06] text-center bg-[#131720] border border-white/[0.05] rounded-lg py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-[#F1F5F9]">{stars}</span>
          <span className="text-[10px] text-[#475569]">Stars</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-[#F1F5F9]">{commitCount}</span>
          <span className="text-[10px] text-[#475569]">Commits</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-[#10B981]">{healthScore}%</span>
          <span className="text-[10px] text-[#475569]">Health</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[11.5px]">
        <div className="flex items-center gap-3 text-[#64748B]">
          {language && (
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getLanguageColor(language) }}
              />
              {language}
            </span>
          )}
          {analyzedAt && (
            <span className="flex items-center gap-1 font-mono text-[10.5px] text-[#475569]">
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
            aria-label={`View ${name} on GitHub`}
            className="text-[#475569] hover:text-[#F1F5F9] transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
          <Link
            href={`/reviews?repo=${encodeURIComponent(fullName || name)}`}
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
          >
            Audit
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
