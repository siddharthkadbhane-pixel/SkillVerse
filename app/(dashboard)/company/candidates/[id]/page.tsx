'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import SkillChip from '@/components/ui/SkillChip';
import ProjectCard from '@/components/ui/ProjectCard';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitCommit,
  GitPullRequest,
  FolderGit2,
  TrendingUp,
  MapPin,
  Github,
  ArrowRight,
  ExternalLink,
  BookmarkPlus,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';
import { DUMMY_USERS, DUMMY_REPOSITORIES, getDummyDCCData } from '@/lib/dummyData';

export default function CandidateProfilePage() {
  const params = useParams();
  const candidateId = (params.id as string) || '00000000-0000-0000-0000-000000000001';

  const [profile, setProfile] = useState<any>(null);
  const [isShortlisted, setIsShortlisted] = useState(true);

  const candidate = DUMMY_USERS.find((u) => u.id === candidateId) || DUMMY_USERS[0];
  const dcc = getDummyDCCData(candidate.id);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Candidate Evaluation" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Breadcrumb & Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/company/developers"
              className="text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
            >
              &larr; Back to Developer Search
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShortlisted(!isShortlisted)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isShortlisted
                    ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-[#A78BFA]'
                    : 'bg-[#111722] border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {isShortlisted ? 'Shortlisted in Pipeline' : 'Shortlist Candidate'}
              </button>
              <Link
                href={`/company/jobs/job_1/match/${candidate.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Deep AI Match Analysis
              </Link>
            </div>
          </div>

          {/* Candidate Identity Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <img
                  src={candidate.avatarUrl}
                  alt=""
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/10 shadow-lg"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
                      {candidate.name}
                    </h1>
                    <span title="Verified Technical Profile">
                      <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                      ✓ Verified Developer
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#94A3B8]">
                    @{candidate.username} &bull; {candidate.role === 'recruiter' ? 'Technical Talent' : 'Lead Full-Stack Architect'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#64748B] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {candidate.location}
                    </span>
                    <a
                      href="https://github.com/siddharthkadbhane-pixel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#F8FAFC] transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      GitHub Profile
                    </a>
                  </div>
                </div>
              </div>

              {/* Match & Skill Score Cards */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-[#111722] border border-[#38BDF8]/20 text-center min-w-[100px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                    AI Match
                  </span>
                  <span className="font-mono text-2xl font-bold text-[#38BDF8]">
                    96%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#111722] border border-[#10B981]/20 text-center min-w-[100px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] block">
                    Skill Score
                  </span>
                  <span className="font-mono text-2xl font-bold text-[#10B981]">
                    {candidate.trustScore.overallScore / 10}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-3xl pt-2 border-t border-white/[0.06]">
              {candidate.bio}
            </p>
          </div>

          {/* Section: WHY THIS CANDIDATE? */}
          <div className="bg-gradient-to-br from-[#7C3AED]/15 via-[#0D121A] to-[#0D121A] border border-[#7C3AED]/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-[#F8FAFC] tracking-tight">
                WHY THIS CANDIDATE? (AI EVIDENCE BREAKDOWN)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { title: 'Strong TypeScript + Next.js Match', desc: '4,210 verified commits with zero any-castings in production code paths.' },
                { title: 'Built Similar Production Systems', desc: 'Authored Raft distributed consensus cache and multi-agent AST execution engines.' },
                { title: 'Consistent Engineering Telemetry', desc: '48-day continuous commit streak with 148 merged pull requests and peer reviews.' },
                { title: 'Elite Growth Velocity', desc: '+18.4% skill growth over the last 60 days across systems concurrency.' },
                { title: 'Relevant Backend Experience', desc: 'High-throughput async Rust & Python FastAPI architectures verified by AST audits.' },
                { title: '100% Cryptographic Proof', desc: 'No unverified resume claims; every metric traces directly to a public GitHub codebase.' },
              ].map((reason, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#111722]/80 border border-white/[0.06] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-[#F8FAFC] block">{reason.title}</span>
                    <span className="text-[11px] text-[#94A3B8] leading-relaxed block mt-0.5">{reason.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Skills & Evidence */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="font-semibold text-sm text-[#F8FAFC]">
                Verified Skills & Codebase Backing
              </h3>
              <span className="text-xs text-[#94A3B8]">18 Skills Verified</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(dcc.verifiedSkills || []).map((skill: any, i: number) => (
                <SkillChip
                  key={i}
                  name={skill.name}
                  level={skill.level}
                  growth={skill.growthTrend}
                  verified={true}
                />
              ))}
            </div>
          </div>

          {/* Project Evidence Portfolio */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-[#F8FAFC]">
              Verified Repository Evidence
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DUMMY_REPOSITORIES.slice(0, 4).map((r) => (
                <ProjectCard
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  fullName={r.fullName}
                  description={r.description}
                  htmlUrl={r.htmlUrl}
                  language={r.language}
                  stars={r.stars}
                  forks={r.forks}
                  isAnalyzed={true}
                  aiScore={r.overallScore}
                  healthScore={r.healthScore}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
