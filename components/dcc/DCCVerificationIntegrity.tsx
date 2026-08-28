'use client';

import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  Info, 
  Lock,
  Sparkles
} from 'lucide-react';
import { VerificationIntegritySummary } from '@/types/verification';

interface DCCVerificationIntegrityProps {
  integritySummary?: VerificationIntegritySummary | null;
}

export default function DCCVerificationIntegrity({ integritySummary }: DCCVerificationIntegrityProps) {
  if (!integritySummary) {
    return null;
  }

  const {
    totalEvidenceCount,
    verifiedSkillsCount,
    supportedSkillsCount,
    detectedSkillsCount,
    staleSkillsCount,
    averageEvidenceScore,
    freshnessDistribution,
    integrityScore,
    lastAuditDate,
  } = integritySummary;

  return (
    <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Verification Integrity & Evidence Quality
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#111722] text-[#10B981] border border-[#10B981]/30">
              Conservative Standard
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Every capability on this card is verified conservatively against concrete AST syntax trees, automated test assertions, and active Git history. Weak or unreviewed signals are never inflated.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#111722] border border-white/[0.08] text-[#94A3B8]">
            Last Audited: {new Date(lastAuditDate || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Top 4 Key Verification Integrity Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#111722] border border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
            Integrity Confidence
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#10B981]">{integrityScore}</span>
            <span className="text-xs text-[#94A3B8]">/ 100</span>
          </div>
          <p className="text-[11px] text-[#64748B]">Rigorous proof verification</p>
        </div>

        <div className="bg-[#111722] border border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
            Average Code Quality
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#38BDF8]">{averageEvidenceScore}</span>
            <span className="text-xs text-[#94A3B8]">/ 100</span>
          </div>
          <p className="text-[11px] text-[#64748B]">Across audited repositories</p>
        </div>

        <div className="bg-[#111722] border border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
            Evidence Records
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">{totalEvidenceCount}</span>
            <span className="text-xs text-[#94A3B8]">audited items</span>
          </div>
          <p className="text-[11px] text-[#64748B]">Deduplicated proof links</p>
        </div>

        <div className="bg-[#111722] border border-white/[0.06] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
            Evidence Freshness
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#34D399]">
              {freshnessDistribution.current > 0 ? 'Current' : 'Aging'}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B]">Active within &lt; 180 days</p>
        </div>
      </div>

      {/* Freshness Distribution Bar */}
      <div className="space-y-2 bg-[#111722] border border-white/[0.06] p-4 rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Evidence Freshness Lifecycle
          </h4>
          <span className="text-[11px] font-mono text-[#94A3B8]">
            {freshnessDistribution.current} Current • {freshnessDistribution.aging} Aging • {freshnessDistribution.stale} Stale
          </span>
        </div>

        <div className="w-full h-2 bg-[#070A0F] rounded-full overflow-hidden flex border border-white/[0.04]">
          <div
            className="bg-[#10B981] h-full"
            style={{ width: `${Math.max(10, (freshnessDistribution.current / (totalEvidenceCount || 1)) * 100)}%` }}
            title="Current (< 180 days)"
          />
          <div
            className="bg-[#F59E0B] h-full"
            style={{ width: `${(freshnessDistribution.aging / (totalEvidenceCount || 1)) * 100}%` }}
            title="Aging (180 - 365 days)"
          />
          <div
            className="bg-[#64748B] h-full"
            style={{ width: `${(freshnessDistribution.stale / (totalEvidenceCount || 1)) * 100}%` }}
            title="Stale (> 365 days)"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Current (&lt; 180 days)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Aging (180–365 days)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#64748B]" />
            <span>Stale (&gt; 365 days)</span>
          </span>
        </div>
      </div>

      {/* Conservative Verification Principle Callout */}
      <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.06] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
        <div className="text-xs text-[#94A3B8] leading-relaxed">
          <strong className="text-[#F8FAFC]">Anti-Inflation Guarantee: </strong>
          SkillVerse does not promote package manifest detections or unverified dependencies to &ldquo;Verified&rdquo;. Capability tiers strictly reflect audited codebase implementations and passing AST quality benchmarks.
        </div>
      </div>
    </div>
  );
}
