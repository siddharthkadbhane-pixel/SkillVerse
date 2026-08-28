'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  FolderGit2, 
  Code2,
  Cpu,
  Database,
  Server,
  Terminal,
  Cloud,
  Shield,
  Activity,
  Check
} from 'lucide-react';
import { DeveloperCapabilityItem, EngineeringCapabilityLevel, CapabilityVerificationState } from '@/types/capability';

interface DCCEngineeringCapabilitiesProps {
  capabilities?: DeveloperCapabilityItem[] | null;
}

export default function DCCEngineeringCapabilities({ capabilities }: DCCEngineeringCapabilitiesProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  const getCapabilityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('frontend')) return <Code2 className="w-4 h-4" />;
    if (n.includes('backend') || n.includes('api')) return <Server className="w-4 h-4" />;
    if (n.includes('database')) return <Database className="w-4 h-4" />;
    if (n.includes('architecture') || n.includes('full-stack')) return <Cpu className="w-4 h-4" />;
    if (n.includes('cloud') || n.includes('devops')) return <Cloud className="w-4 h-4" />;
    if (n.includes('security')) return <Shield className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
  };

  const getLevelBadge = (level: EngineeringCapabilityLevel) => {
    switch (level) {
      case 'Strong':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
            Strong
          </span>
        );
      case 'Proficient':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
            Proficient
          </span>
        );
      case 'Developing':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#818CF8]/15 text-[#A5B4FC] border border-[#818CF8]/30">
            Developing
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8] border border-white/[0.10]">
            Emerging
          </span>
        );
    }
  };

  const getVerificationStateBadge = (state: CapabilityVerificationState) => {
    switch (state) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified</span>
          </span>
        );
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            <span>Supported</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#94A3B8] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
            <span>Detected</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#8B5CF6]/10 text-[#C4B5FD] border border-[#8B5CF6]/20">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Engineering Capabilities & Skill Intelligence
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#111722] text-[#A78BFA] border border-[#8B5CF6]/30">
              Evidence-Mapped
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Multi-signal capability mapping derived from AST codebase audits, verified frameworks, and architectural evidence. Technology usage alone does not determine mastery.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#111722] border border-white/[0.08] text-[#94A3B8]">
            {capabilities.length} Capabilities Assessed
          </span>
        </div>
      </div>

      {/* Grid of Capability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capabilities.map((cap) => {
          const isExpanded = expandedCardId === cap.id;
          return (
            <div
              key={cap.id}
              className="bg-[#111722] hover:bg-[#141B27] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all"
            >
              {/* Card Top: Title, Category, Level Badge */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-white/[0.04] text-[#A78BFA] border border-white/[0.06] shrink-0">
                      {getCapabilityIcon(cap.capabilityName)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {cap.capabilityName}
                      </h4>
                      <p className="text-[11px] text-[#64748B] font-mono truncate">
                        {cap.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getLevelBadge(cap.level)}
                  </div>
                </div>

                {/* Verification State & Confidence Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {getVerificationStateBadge(cap.verificationState)}
                    </div>
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      Confidence: <strong className="text-white">{cap.confidenceScore}%</strong>
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#070A0F] rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cap.level === 'Strong'
                          ? 'bg-gradient-to-r from-[#10B981] to-[#34D399]'
                          : cap.level === 'Proficient'
                          ? 'bg-gradient-to-r from-[#0284C7] to-[#38BDF8]'
                          : cap.level === 'Developing'
                          ? 'bg-gradient-to-r from-[#6366F1] to-[#818CF8]'
                          : 'bg-white/20'
                      }`}
                      style={{ width: `${cap.confidenceScore}%` }}
                    />
                  </div>
                </div>

                {/* Evidence Metrics */}
                <div className="flex items-center gap-3 pt-1 text-[11px] text-[#94A3B8]">
                  <div className="flex items-center gap-1">
                    <FolderGit2 className="w-3 h-3 text-[#64748B]" />
                    <span>{cap.analyzedProjectsCount} analyzed repo(s)</span>
                  </div>
                  <span className="text-[#64748B]">•</span>
                  <div className="flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-[#64748B]" />
                    <span>{cap.supportingSkills.length} supporting tech</span>
                  </div>
                </div>

                {/* Supporting Skills Pills */}
                {cap.supportingSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cap.supportingSkills.map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#CBD5E1] border border-white/[0.06]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Explainability Accordion */}
              <div className="pt-2 border-t border-white/[0.04]">
                <button
                  onClick={() => setExpandedCardId(isExpanded ? null : cap.id)}
                  className="w-full flex items-center justify-between text-[11px] font-medium text-[#94A3B8] hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#38BDF8]" />
                    <span>Why this capability level?</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-lg bg-[#070A0F]/80 border border-white/[0.06] text-xs text-[#94A3B8] space-y-2 leading-relaxed animate-in fade-in duration-200">
                    <p>{cap.whyExplanation}</p>
                    {cap.evidenceRepos.length > 0 && (
                      <div className="pt-1.5 border-t border-white/[0.04] text-[10px] font-mono text-[#64748B]">
                        <span className="text-[#94A3B8]">Audit Evidence: </span>
                        {cap.evidenceRepos.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
