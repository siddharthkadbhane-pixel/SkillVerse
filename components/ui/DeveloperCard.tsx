import React from 'react';
import Link from 'next/link';
import { ShieldCheck, GitBranch, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import SkillChip from './SkillChip';

interface DeveloperCardProps {
  username: string;
  name: string;
  avatarUrl?: string;
  role: string;
  location?: string;
  trustScore: number;
  dccLevel?: string;
  skills: string[];
  bio?: string;
  mutualSkillsCount?: number;
  isAvailable?: boolean;
}

export default function DeveloperCard({
  username,
  name,
  avatarUrl,
  role,
  location,
  trustScore,
  dccLevel = 'Expert',
  skills,
  bio,
  mutualSkillsCount,
  isAvailable = true,
}: DeveloperCardProps) {
  const getLevelBadge = (lvl: string) => {
    if (lvl === 'Elite') return 'bg-[#7C3AED]/20 text-[#C4B5FD] border-[#7C3AED]/40';
    if (lvl === 'Expert') return 'bg-[#06B6D4]/20 text-[#67E8F9] border-[#06B6D4]/40';
    return 'bg-[#10B981]/20 text-[#6EE7B7] border-[#10B981]/40';
  };

  return (
    <div className="bg-white dark:bg-[#0D121A] hover:bg-slate-50 dark:hover:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-[#151B26] border border-slate-200 dark:border-white/[0.10] shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[#6366F1]">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] dark:group-hover:text-[#A78BFA] transition-colors">
                  {name}
                </h3>
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">@{username}</p>
              {location && (
                <p className="text-[11px] text-slate-400 dark:text-[#64748B] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {location}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border mb-1 ${getLevelBadge(
                dccLevel
              )}`}
            >
              {dccLevel}
            </span>
            <span className="font-mono text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20">
              {trustScore} / 1000
            </span>
          </div>
        </div>

        {bio && (
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-2 mb-3 leading-relaxed">
            {bio}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 4).map((skill, i) => (
            <SkillChip key={i} name={skill} size="sm" verified={false} />
          ))}
          {skills.length > 4 && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] self-center">
              +{skills.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
        {mutualSkillsCount ? (
          <span className="text-[11px] text-[#0284C7] dark:text-[#38BDF8] font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {mutualSkillsCount} mutual skills
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 dark:text-[#64748B]">
            {role || 'Full-Stack Developer'}
          </span>
        )}

        <Link
          href={`/u/${username}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6366F1] dark:text-[#A78BFA] hover:text-[#4F46E5] dark:hover:text-white transition-colors"
        >
          View Passport
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
