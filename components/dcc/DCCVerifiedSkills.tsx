'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  Layers, 
  GitBranch, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  FolderGit2,
  ChevronRight,
  X,
  Flame,
  Zap,
  Info,
  ArrowRight,
  GitFork,
  UserCheck,
  Award
} from 'lucide-react';
import { VerifiedSkill, SkillVerificationStatus, EvidenceStrength, RepoContributionRole } from '@/types/dcc';

interface DCCVerifiedSkillsProps {
  skills: VerifiedSkill[];
}

export default function DCCVerifiedSkills({ skills = [] }: DCCVerifiedSkillsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSkillForEvidence, setActiveSkillForEvidence] = useState<VerifiedSkill | null>(null);

  const categories = ['all', 'Languages', 'Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'AI & ML', 'Testing & Tools'];

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      selectedStatus === 'all' || 
      skill.status === selectedStatus ||
      (selectedStatus === 'insufficient_evidence' && (skill.status === 'not_enough_evidence' || skill.status === 'insufficient_evidence'));
    const matchesCat = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const getStatusBadge = (status: SkillVerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            <Sparkles className="w-3 h-3" />
            Supported
          </span>
        );
      case 'detected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            <Search className="w-3 h-3" />
            Detected
          </span>
        );
      case 'inferred':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
            <Sparkles className="w-3 h-3" />
            Inferred
          </span>
        );
      case 'insufficient_evidence':
      case 'not_enough_evidence':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            <HelpCircle className="w-3 h-3" />
            Insufficient Evidence
          </span>
        );
    }
  };

  const getStrengthBadge = (strength?: EvidenceStrength) => {
    switch (strength) {
      case 'strong':
        return (
          <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
            Strength: Strong
          </span>
        );
      case 'moderate':
        return (
          <span className="text-[10px] font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
            Strength: Moderate
          </span>
        );
      case 'weak':
      default:
        return (
          <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
            Strength: Weak
          </span>
        );
    }
  };

  const getRoleBadge = (role?: RepoContributionRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/[0.06]">
            Owner
          </span>
        );
      case 'contributor':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Contributor
          </span>
        );
      case 'fork':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Fork
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0D121A] p-5 sm:p-6 shadow-sm">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6366F1]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
              Verified Technical Skills & Evidence
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5">
            Every capability backed by concrete AST repository audits, commit history, and codebase proof chains.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter verified skills..."
            className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]/50"
          />
        </div>
      </div>

      {/* Category Pills & Status Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[#6366F1]/15 text-[#6366F1] dark:text-[#C4B5FD] border border-[#6366F1]/30 font-bold'
                  : 'bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.04] hover:bg-slate-200 dark:hover:bg-[#151B26] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Verification Status Filter */}
        <div className="flex flex-wrap items-center gap-1 shrink-0 bg-slate-100 dark:bg-[#111722] p-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
          {[
            { key: 'all', label: 'All' },
            { key: 'verified', label: 'Verified' },
            { key: 'supported', label: 'Supported' },
            { key: 'detected', label: 'Detected' },
            { key: 'insufficient_evidence', label: 'Insufficient' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setSelectedStatus(st.key)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-all ${
                selectedStatus === st.key
                  ? 'bg-white dark:bg-[#151B26] text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/[0.06]'
                  : 'text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-[#64748B] text-xs border border-dashed border-slate-200 dark:border-white/[0.06] rounded-lg">
          No skills match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredSkills.map((skill) => (
            <div
              key={skill.name}
              onClick={() => setActiveSkillForEvidence(skill)}
              className="p-4 rounded-lg bg-slate-50 dark:bg-[#111722]/70 hover:bg-white dark:hover:bg-[#111722] border border-slate-200 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] dark:group-hover:text-[#A78BFA] transition-colors">
                      {skill.name}
                    </span>
                    {skill.primaryLanguage && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#6366F1]/15 text-[#6366F1] dark:text-[#C4B5FD] border border-[#6366F1]/30">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#64748B]">{skill.category}</span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(skill.status)}
                  {getStrengthBadge(skill.evidenceStrength)}
                </div>
              </div>

              {/* Progress bar and score */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-[#64748B] font-mono text-[11px]">Proficiency Level</span>
                  <span className="text-slate-900 dark:text-[#F8FAFC] font-mono font-medium">{skill.level}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#151B26] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${skill.level}%`,
                      backgroundColor: skill.level >= 80 ? '#10B981' : skill.level >= 60 ? '#6366F1' : '#F59E0B',
                    }}
                  />
                </div>
              </div>

              {/* Why Verified Preview Quote */}
              {skill.whyVerified && (
                <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] line-clamp-2 leading-relaxed bg-slate-100/70 dark:bg-[#0D121A] p-2 rounded border border-slate-200 dark:border-white/[0.04]">
                  &ldquo;{skill.whyVerified}&rdquo;
                </p>
              )}

              {/* Evidence footer */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#64748B]">
                <span className="inline-flex items-center gap-1 font-mono">
                  <FolderGit2 className="w-3 h-3 text-slate-400 dark:text-[#94A3B8]" />
                  {skill.evidenceCount} repository {skill.evidenceCount === 1 ? 'proof' : 'proofs'}
                </span>

                <span className="inline-flex items-center gap-0.5 text-slate-600 dark:text-[#94A3B8] group-hover:text-[#6366F1] dark:group-hover:text-[#A78BFA] transition-colors font-medium">
                  Why verified? <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Detail Drawer / Modal (Phase 24) */}
      {activeSkillForEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D121A] p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{activeSkillForEvidence.name}</h3>
                  {getStatusBadge(activeSkillForEvidence.status)}
                  {getStrengthBadge(activeSkillForEvidence.evidenceStrength)}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 font-mono">
                  Category: <strong className="text-slate-900 dark:text-white">{activeSkillForEvidence.category}</strong> · Last Verified: <strong className="text-slate-900 dark:text-white">{activeSkillForEvidence.lastVerifiedDate || 'Recent'}</strong>
                </p>
              </div>

              <button
                onClick={() => setActiveSkillForEvidence(null)}
                className="p-1.5 rounded-md text-slate-400 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111722] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Why Verified Banner */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-[#6366F1]/30 flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6366F1] dark:text-[#A78BFA] font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#6366F1]" />
                Why is this capability verified?
              </span>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC] leading-relaxed">
                {activeSkillForEvidence.whyVerified || 'Verified by SkillVerse automated code telemetry and AST repository review analysis.'}
              </p>
            </div>

            {/* Evidence Strength Breakdown Matrix */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] text-center text-xs">
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-[#64748B] block">Evidence Strength</span>
                <strong className="text-xs font-mono capitalize text-slate-900 dark:text-white">{activeSkillForEvidence.evidenceStrength || 'Moderate'}</strong>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-[#64748B] block">Confidence Rating</span>
                <strong className="text-xs font-mono text-[#10B981]">{activeSkillForEvidence.confidence}%</strong>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-[#64748B] block">Repository Proofs</span>
                <strong className="text-xs font-mono text-[#3B82F6]">{activeSkillForEvidence.evidenceCount}</strong>
              </div>
            </div>

            {/* Skill Progression History */}
            {activeSkillForEvidence.history && activeSkillForEvidence.history.length > 0 && (
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#64748B] font-mono flex items-center justify-between">
                  <span>Capability Progression Trail</span>
                  <span className="text-[#10B981] font-normal text-[10px]">Real Evidence Chain</span>
                </span>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {activeSkillForEvidence.history.map((h, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#151B26] border border-slate-200 dark:border-white/[0.04] text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">{h.stage}</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">({h.date})</span>
                      </div>
                      {i < activeSkillForEvidence.history!.length - 1 && (
                        <span className="text-[#6366F1] font-bold text-xs">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence items list */}
            <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#64748B] font-mono">
                Verified Repository Proofs ({activeSkillForEvidence.evidenceCount})
              </span>

              {activeSkillForEvidence.evidenceList?.length > 0 ? (
                activeSkillForEvidence.evidenceList.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderGit2 className="w-4 h-4 text-[#6366F1] shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono text-slate-900 dark:text-[#F8FAFC] font-medium truncate">{ev.repoFullName || ev.repoName}</p>
                          {getRoleBadge(ev.contributionRole)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#64748B] truncate">
                          Method: <span className="text-slate-600 dark:text-[#94A3B8]">{ev.verificationMethod || (ev.isAnalyzed ? 'AI Full AST Audit' : 'Primary Codebase Scan')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ev.reviewScore && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                          Score: {ev.reviewScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-[#64748B] bg-slate-50 dark:bg-[#111722] rounded-lg">
                  No repository proof recorded yet for this capability.
                </div>
              )}
            </div>

            {/* Insufficient Evidence CTA */}
            {(activeSkillForEvidence.status === 'detected' || 
              activeSkillForEvidence.status === 'insufficient_evidence' || 
              activeSkillForEvidence.status === 'not_enough_evidence') && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Want to elevate <strong className="text-slate-900 dark:text-white">{activeSkillForEvidence.name}</strong> to Verified?
                </span>
                <Link
                  href="/projects"
                  className="px-3 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold shrink-0 transition-colors inline-flex items-center gap-1"
                >
                  <span>Analyze Repo</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                SkillVerse AST Code Intelligence & Evidence Engine
              </span>
              <button
                onClick={() => setActiveSkillForEvidence(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#111722] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-200 dark:hover:bg-[#151B26] border border-slate-200 dark:border-white/[0.06] transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
