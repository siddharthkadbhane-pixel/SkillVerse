'use client';

import React, { useState } from 'react';
import { Star, GitFork, Cpu, CheckCircle2, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface RepoItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  isAnalyzed: boolean;
  analyzedAt: string | null;
  reviewId: string | null;
}

interface RepoCardProps {
  repo: RepoItem;
  onAnalyze: (repo: RepoItem) => Promise<void>;
  onDelete?: (repo: RepoItem) => Promise<void>;
}

export default function RepoCard({ repo, onAnalyze, onDelete }: RepoCardProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onAnalyze(repo);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (deleting || !onDelete) return;
    if (!confirm(`Are you sure you want to delete the AI review and analysis for ${repo.name}?`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onDelete(repo);
    } catch (err: any) {
      setError(err.message || 'Deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  const langColorMap: Record<string, string> = {
    typescript: 'bg-blue-500',
    javascript: 'bg-yellow-500',
    python: 'bg-sky-400',
    go: 'bg-cyan-500',
    rust: 'bg-orange-500',
    html: 'bg-red-500',
    css: 'bg-violet-500',
  };

  const getLangColor = (lang: string | null) => {
    if (!lang) return 'bg-zinc-500';
    return langColorMap[lang.toLowerCase()] || 'bg-zinc-400';
  };

  return (
    <div className="glass-card relative flex flex-col justify-between rounded-xl p-5 overflow-hidden">
      {/* Background radial accent */}
      {(loading || deleting) && (
        <div className="absolute inset-0 bg-violet-600/5 animate-pulse" />
      )}

      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-white text-base tracking-tight hover:text-violet-400 transition-colors truncate">
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a>
          </h3>
          
          {repo.isAnalyzed ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
              Unanalyzed
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 line-clamp-2 h-8 leading-relaxed">
          {repo.description || 'No description provided for this repository.'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-zinc-500 text-xs">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${getLangColor(repo.language)}`} />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            <span>{repo.stars}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" />
            <span>{repo.forks}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-900">
        {error && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {repo.isAnalyzed ? (
          <div className="flex gap-2 w-full">
            <Link
              href={`/reviews/${repo.reviewId}`}
              className="flex-grow flex items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              <Cpu className="h-3.5 w-3.5 text-violet-400" />
              View AI Review
              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
            </Link>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting || loading}
                title="Delete Repository Analysis"
                className="flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-900 hover:bg-red-950/20 p-2.5 text-zinc-400 hover:text-red-400 transition-all active:scale-95 disabled:opacity-50"
              >
                {deleting ? (
                  <svg className="animate-spin h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleAnalyzeClick}
            disabled={loading || deleting}
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing Code...
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5" />
                Generate AI Review
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
