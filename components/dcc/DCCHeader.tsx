'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Share2, 
  RefreshCw, 
  ExternalLink, 
  MapPin, 
  Globe, 
  Calendar, 
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { CapabilityLevel } from '@/types/dcc';

interface DCCHeaderProps {
  developer: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    primaryTechnologies: string[];
    joinedAt?: string;
  };
  card: {
    overallScore: number;
    level: CapabilityLevel;
    verificationStatus: 'verified' | 'unverified';
    confidenceScore: number;
    lastUpdated?: string;
  };
  onRegenerate?: () => void;
  onShare?: () => void;
  isRegenerating?: boolean;
  isPublicView?: boolean;
}

export default function DCCHeader({
  developer,
  card,
  onRegenerate,
  onShare,
  isRegenerating = false,
  isPublicView = false,
}: DCCHeaderProps) {
  const isVerified = card.verificationStatus === 'verified';
  const [copiedLink, setCopiedLink] = useState(false);

  const getLevelBadgeClass = (lvl: CapabilityLevel) => {
    switch (lvl) {
      case 'Elite': return 'bg-[#14B8A6]/10 text-[#0D9488] dark:text-[#14B8A6] border-[#14B8A6]/20';
      case 'Expert': return 'bg-[#6366F1]/15 text-[#6366F1] dark:text-[#C4B5FD] border-[#6366F1]/30';
      case 'Advanced': return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
      case 'Professional': return 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20';
      case 'Creator': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      default: return 'bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-white/[0.06]';
    }
  };

  const copyProfileLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/developer/${developer.username}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0D121A] p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left: Avatar & Identity */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={developer.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
              alt={developer.name || developer.username}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#111722]"
            />
            {isVerified && (
              <div 
                className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-[#0D121A] p-0.5 rounded-full"
                title="Cryptographically & Git-Audited Profile"
              >
                <div className="bg-[#14B8A6]/20 text-[#0D9488] dark:text-[#14B8A6] border border-[#14B8A6]/30 p-1 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] truncate">
                {developer.name || developer.username}
              </h1>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-[#64748B] font-mono">@{developer.username}</span>

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold font-mono border ${getLevelBadgeClass(card.level)}`}>
                {card.level}
              </span>

              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#14B8A6]/10 text-[#0D9488] dark:text-[#14B8A6] border border-[#14B8A6]/20 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Audit Trail
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Pending Repo Sync
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-2xl mt-0.5">
              {developer.bio || 'Fullstack software engineer with verified capability scorecards and repository code telemetry.'}
            </p>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-[#64748B] pt-1">
              {developer.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8]" />
                  {developer.location}
                </span>
              )}
              {developer.website && (
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 dark:text-[#94A3B8] hover:text-[#6366F1] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {developer.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8]" />
                DCC Standard v2.0
              </span>
            </div>

            {/* Primary Stack Chips */}
            {developer.primaryTechnologies?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs text-slate-500 dark:text-[#64748B] font-mono mr-1">Primary:</span>
                {developer.primaryTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-slate-50 dark:bg-[#111722] text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-white/[0.06]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0 pt-2 sm:pt-0">
          <div className="flex items-center gap-2">
            <button
              onClick={copyProfileLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-[#151B26] border border-slate-200 dark:border-white/[0.08] rounded-lg transition-all"
              title="Copy public link to clipboard"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#14B8A6]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>

            {onShare && (
              <button
                onClick={onShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg transition-all shadow-sm"
                title="Share or Export Developer Capability Card"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share DCC</span>
              </button>
            )}

            {!isPublicView && onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-[#151B26] border border-slate-200 dark:border-white/[0.08] rounded-lg transition-all disabled:opacity-50"
                title="Recalculate evidence and scores from latest commits"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Syncing...' : 'Sync Evidence'}
              </button>
            )}
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono">
              Audit Confidence: <strong className="text-[#0D9488] dark:text-[#14B8A6] font-bold">{card.confidenceScore}%</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
