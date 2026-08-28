'use client';

import React, { useState } from 'react';
import DCCHeader from '@/components/dcc/DCCHeader';
import DCCCapabilityOverview from '@/components/dcc/DCCCapabilityOverview';
import DCCVerificationIntegrity from '@/components/dcc/DCCVerificationIntegrity';
import DCCVerifiedSkills from '@/components/dcc/DCCVerifiedSkills';
import DCCEngineeringCapabilities from '@/components/dcc/DCCEngineeringCapabilities';
import DCCEngineeringCapability from '@/components/dcc/DCCEngineeringCapability';
import DCCProjectEvidence from '@/components/dcc/DCCProjectEvidence';
import DCCActivityIntelligence from '@/components/dcc/DCCActivityIntelligence';
import DCCGrowthHistory from '@/components/dcc/DCCGrowthHistory';
import DCCShareModal from '@/components/dcc/DCCShareModal';
import { DCCPublicData } from '@/types/dcc';
import { ShieldCheck, ArrowRight, ExternalLink, Share2, Sparkles, FolderGit2 } from 'lucide-react';
import Link from 'next/link';

interface DCCPublicViewProps {
  data: DCCPublicData;
}

export default function DCCPublicView({ data }: DCCPublicViewProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const developer = {
    name: data.name,
    username: data.username,
    avatarUrl: data.avatarUrl,
    bio: data.bio,
    location: data.location,
    website: null,
    primaryTechnologies: data.primaryTechnologies,
  };

  const card = {
    overallScore: data.overallScore,
    level: data.level,
    summary: data.summary,
    verificationStatus: data.verificationStatus,
    confidenceScore: data.confidenceScore,
    lastUpdated: data.lastUpdated,
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#7C3AED]/30 selection:text-white">
      
      {/* Top Banner Navigation */}
      <header className="border-b border-white/[0.06] bg-[#0D121A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm">
              SV
            </div>
            <span className="font-bold tracking-tight">SkillVerse</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#94A3B8] border border-white/[0.06] hidden sm:inline-block">
              DCC v2.0 Public Profile
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={`https://github.com/${data.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#F8FAFC] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Share Profile</span>
            </button>

            <Link
              href={`/u/${data.username}`}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all shadow-sm"
            >
              <span>Full Passport</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main DCC Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 flex-1 w-full">
        
        {/* Core Philosophy Value Prop Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#7C3AED]/15 via-[#0D121A] to-[#0D121A] border border-[#7C3AED]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#C4B5FD] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                &ldquo;Resume tells what you claim. SkillVerse shows what you have proven.&rdquo;
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Every capability below is backed by concrete AST code audits, commit telemetry, and repository evidence.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded border border-[#10B981]/20 shrink-0 self-start sm:self-center">
            ✓ 100% Cryptographically & Git-Audited
          </span>
        </div>

        {/* 1. Developer Header */}
        <DCCHeader
          developer={developer}
          card={card}
          onShare={() => setIsShareModalOpen(true)}
          isPublicView={true}
        />

        {/* 2. Capability Overview (Hero) */}
        <DCCCapabilityOverview
          card={card}
          dimensions={data.dimensions}
          insights={data.insights}
        />

        {/* 2b. Verification Integrity & Evidence Quality */}
        <DCCVerificationIntegrity integritySummary={data.integritySummary} />

        {/* 3. Verified Skills & Proofs */}
        <DCCVerifiedSkills skills={data.verifiedSkills} />

        {/* 4. Engineering Capabilities & Skill Intelligence */}
        <DCCEngineeringCapabilities capabilities={data.engineeringCapabilities} />

        {/* 5. Engineering Capability & Rigor */}
        <DCCEngineeringCapability metrics={data.engineeringMetrics} />

        {/* 5. Project Evidence & Audit Trails */}
        <DCCProjectEvidence projects={data.projectEvidence} />

        {/* 6. Engineering Activity & Contribution Intelligence */}
        <DCCActivityIntelligence activityContext={data.activityContext} />

        {/* 7. Capability Growth & Milestone Trajectory */}
        <DCCGrowthHistory 
          timeline={data.timeline || []} 
          growthChart={data.growthChart || []} 
          insights={data.insights as any} 
        />

      </main>

      {/* Public Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0D121A] py-6 text-center text-xs text-[#64748B]">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>Cryptographically & Git-Audited Engineering Credential</span>
          </div>
          <span className="font-mono text-[11px]">Powered by SkillVerse Verification Protocol</span>
        </div>
      </footer>

      {/* Share Modal */}
      <DCCShareModal
        username={data.username}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        overallScore={data.overallScore}
        level={data.level}
      />

    </div>
  );
}
