import React from 'react';
import { GitCommit, GitPullRequest, AlertCircle, ShieldCheck, Award, FolderGit2, Sparkles, CheckCircle2 } from 'lucide-react';

export type ActivityType =
  | 'commit'
  | 'pr'
  | 'issue'
  | 'review'
  | 'audit'
  | 'project'
  | 'achievement'
  | 'challenge';

interface ActivityItemProps {
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  repoName?: string;
  metric?: string;
  url?: string;
}

export default function ActivityItem({
  type,
  title,
  description,
  timestamp,
  repoName,
  metric,
  url,
}: ActivityItemProps) {
  // Theme-aware semantic icon and container config
  // Verified Evidence Teal (#14B8A6) is strictly reserved for genuine verification/audits
  const getConfig = () => {
    switch (type) {
      case 'commit':
        return {
          icon: <GitCommit className="w-4 h-4 text-[#3B82F6] dark:text-[#60A5FA]" />,
          containerBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/40',
        };
      case 'pr':
        return {
          icon: <GitPullRequest className="w-4 h-4 text-[#6366F1] dark:text-[#A5B4FC]" />,
          containerBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-800/40',
        };
      case 'issue':
        return {
          icon: <AlertCircle className="w-4 h-4 text-[#F59E0B] dark:text-[#FBBF24]" />,
          containerBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40',
        };
      case 'review':
      case 'audit':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-[#14B8A6] dark:text-[#2DD4BF]" />,
          containerBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-800/40',
        };
      case 'achievement':
        return {
          icon: <Award className="w-4 h-4 text-[#F59E0B] dark:text-[#FCD34D]" />,
          containerBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40',
        };
      case 'project':
        return {
          icon: <FolderGit2 className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]" />,
          containerBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-800/40',
        };
      case 'challenge':
        return {
          icon: <Sparkles className="w-4 h-4 text-[#06B6D4] dark:text-[#38BDF8]" />,
          containerBg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-800/40',
        };
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />,
          containerBg: 'bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.08]',
        };
    }
  };

  const { icon, containerBg } = getConfig();

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-white/[0.05] last:border-0 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors group">
      <div className={`p-2 rounded-lg border shrink-0 mt-0.5 transition-colors ${containerBg}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] dark:group-hover:text-[#A5B4FC] transition-colors truncate">
            {title}
          </h4>
          <span className="font-mono text-[11px] text-slate-400 dark:text-[#64748B] shrink-0">
            {timestamp}
          </span>
        </div>

        {description && (
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 line-clamp-1">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          {repoName && (
            <span className="font-mono text-slate-600 dark:text-[#94A3B8] bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.06]">
              {repoName}
            </span>
          )}
          {metric && (
            <span className="font-mono font-medium text-[#14B8A6] dark:text-[#2DD4BF]">
              {metric}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
