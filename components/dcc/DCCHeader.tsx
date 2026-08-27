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
      case 'Elite': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
      case 'Expert': return 'bg-[#7C3AED]/15 text-[#C4B5FD] border-[#7C3AED]/30';
      case 'Advanced': return 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20';
      case 'Professional': return 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20';
      case 'Creator': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      default: return 'bg-[#111722] text-[#94A3B8] border-white/[0.06]';
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
    <div className="rounded-xl border border-white/[0.08] bg-[#0D121A] p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left: Avatar & Identity */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={developer.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
              alt={developer.name || developer.username}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-white/10 bg-[#111722]"
            />
            {isVerified && (
              <div 
                className="absolute -bottom-1.5 -right-1.5 bg-[#0D121A] p-0.5 rounded-full"
                title="Cryptographically & Git-Audited Profile"
              >
                <div className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 p-1 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] truncate">
                {developer.name || developer.username}
              </h1>
              <span className="text-xs sm:text-sm text-[#64748B] font-mono">@{developer.username}</span>

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold font-mono border ${getLevelBadgeClass(card.level)}`}>
                {card.level}
              </span>

              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-mono">
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

            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-2xl mt-0.5">
              {developer.bio || 'Fullstack software engineer with verified capability scorecards and repository code telemetry.'}
            </p>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
              {developer.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                  {developer.location}
                </span>
              )}
              {developer.website && (
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#94A3B8] hover:text-[#A78BFA] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {developer.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                DCC Standard v2.0
              </span>
            </div>

            {/* Primary Stack Chips */}
            {developer.primaryTechnologies?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs text-[#64748B] font-mono mr-1">Primary:</span>
                {developer.primaryTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-[#111722] text-[#F8FAFC] border border-white/[0.06]"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] rounded-lg transition-all"
              title="Copy public link to clipboard"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>

            {onShare && (
              <button
                onClick={onShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#8B5CF6] rounded-lg transition-all shadow-sm"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-white bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] rounded-lg transition-all disabled:opacity-50"
                title="Recalculate evidence and scores from latest commits"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Syncing...' : 'Sync Evidence'}
              </button>
            )}
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-[#64748B] font-mono">
              Audit Confidence: <strong className="text-[#10B981] font-bold">{card.confidenceScore}%</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
