'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import CandidateCard from '@/components/ui/CandidateCard';
import {
  Building2,
  Users,
  Briefcase,
  GitPullRequest,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Plus,
  Filter,
} from 'lucide-react';
import { DUMMY_USERS, DUMMY_JOBS } from '@/lib/dummyData';

export default function CompanyOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set(['00000000-0000-0000-0000-000000000001']));

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const handleToggleShortlist = (id: string) => {
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pipelineStages = [
    { label: 'Applied', count: 48, color: '#38BDF8' },
    { label: 'Screening', count: 18, color: '#7C3AED' },
    { label: 'Shortlisted', count: 8, color: '#A78BFA' },
    { label: 'Interview', count: 4, color: '#F59E0B' },
    { label: 'Offer', count: 2, color: '#06B6D4' },
    { label: 'Hired', count: 3, color: '#10B981' },
  ];

  // Candidates for Recommendation
  const recommendedCandidates = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Siddharth Kadbhane',
      title: 'Lead Full-Stack Architect',
      avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
      matchScore: 96,
      skillScore: 94.0,
      topSkills: [
        { name: 'TypeScript', level: 98 },
        { name: 'Next.js 15', level: 96 },
        { name: 'Rust', level: 94 },
        { name: 'PostgreSQL', level: 92 },
      ],
      projectCount: 14,
      commitCount: '3.8k',
      prCount: 148,
      growth: 18.4,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Alex Chen',
      title: 'Principal Frontend & Design Systems Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      matchScore: 92,
      skillScore: 82.0,
      topSkills: [
        { name: 'React 19', level: 95 },
        { name: 'Tailwind CSS', level: 96 },
        { name: 'WebGL', level: 88 },
        { name: 'TypeScript', level: 90 },
      ],
      projectCount: 9,
      commitCount: '2.1k',
      prCount: 94,
      growth: 15.2,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Sarah Connor',
      title: 'Distributed Systems & ML Platform Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      matchScore: 88,
      skillScore: 76.0,
      topSkills: [
        { name: 'Python', level: 94 },
        { name: 'FastAPI', level: 91 },
        { name: 'PyTorch', level: 88 },
        { name: 'Redis', level: 89 },
      ],
      projectCount: 8,
      commitCount: '1.8k',
      prCount: 62,
      growth: 22.0,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Hiring Command Center" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Hiring Command Center"
            description="Discover, verify, and match top-tier engineering talent with cryptographic AST evidence. Proof over claims."
            badge={{ text: 'Hyperion AI &bull; Enterprise', variant: 'cyan' }}
          >
            <Link
              href="/company/jobs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Manage Jobs
            </Link>
            <Link
              href="/company/developers"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Find Developers
            </Link>
          </PageHeader>

          {/* Hiring KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <StatCard label="Active Positions" value="5 Jobs" icon={Briefcase} iconColor="text-[#38BDF8]" />
            <StatCard label="Total Candidates" value="48" icon={Users} iconColor="text-[#7C3AED]" />
            <StatCard label="Shortlisted" value={shortlistedIds.size} icon={Sparkles} iconColor="text-[#A78BFA]" />
            <StatCard label="Interviews" value="4" icon={GitPullRequest} iconColor="text-[#F59E0B]" />
            <StatCard label="Offers Out" value="2" icon={CheckCircle2} iconColor="text-[#06B6D4]" />
            <StatCard label="Total Hires" value="3" icon={CheckCircle2} iconColor="text-[#10B981]" subtitle="Avg match: 94%" />
          </div>

          {/* Hiring Pipeline Funnel Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-semibold text-sm text-[#F8FAFC]">
                  Hiring Pipeline Overview
                </h3>
              </div>
              <Link
                href="/company/pipeline"
                className="text-xs font-semibold text-[#A78BFA] hover:underline"
              >
                Open Kanban Pipeline &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {pipelineStages.map((st, i) => (
                <div key={i} className="p-3.5 bg-[#111722] border border-white/[0.04] rounded-lg">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                    {st.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xl font-bold text-[#F8FAFC]">
                      {st.count}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">candidates</span>
                  </div>
                  <div className="w-full h-1 bg-[#151B26] rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, st.count * 15)}%`, backgroundColor: st.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Developers for Active Positions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">
                  AI Recommended Developers for Open Roles
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Ranked by AST compatibility against your active Principal Full-Stack and Backend vacancies.
                </p>
              </div>
              <Link
                href="/company/developers"
                className="text-xs font-semibold text-[#A78BFA] hover:underline"
              >
                Explore All 340+ Candidates &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  id={candidate.id}
                  name={candidate.name}
                  title={candidate.title}
                  avatarUrl={candidate.avatarUrl}
                  matchScore={candidate.matchScore}
                  skillScore={candidate.skillScore}
                  topSkills={candidate.topSkills}
                  projectCount={candidate.projectCount}
                  commitCount={candidate.commitCount}
                  prCount={candidate.prCount}
                  growth={candidate.growth}
                  verified={true}
                  onShortlist={handleToggleShortlist}
                  isShortlisted={shortlistedIds.has(candidate.id)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
