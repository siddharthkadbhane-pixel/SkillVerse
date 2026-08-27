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
  const getIcon = () => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4 text-[#38BDF8]" />;
      case 'pr':
        return <GitPullRequest className="w-4 h-4 text-[#A78BFA]" />;
      case 'issue':
        return <AlertCircle className="w-4 h-4 text-[#F59E0B]" />;
      case 'review':
      case 'audit':
        return <ShieldCheck className="w-4 h-4 text-[#10B981]" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-[#FBBF24]" />;
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-[#7C3AED]" />;
      case 'challenge':
        return <Sparkles className="w-4 h-4 text-[#06B6D4]" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="flex items-start gap-3.5 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors group">
      <div className="p-2 rounded-lg bg-[#111722] border border-white/[0.06] shrink-0 mt-0.5 group-hover:border-white/[0.12] transition-colors">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors truncate">
            {title}
          </h4>
          <span className="font-mono text-[11px] text-[#64748B] shrink-0">
            {timestamp}
          </span>
        </div>

        {description && (
          <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          {repoName && (
            <span className="font-mono text-[#64748B] bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.04]">
              {repoName}
            </span>
          )}
          {metric && (
            <span className="font-mono font-medium text-[#10B981]">
              {metric}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
