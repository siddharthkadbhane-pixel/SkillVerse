'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import {
  GitPullRequest,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface PipelineCandidate {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  matchScore: number;
  skillScore: number;
  stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Hired';
  skills: string[];
}

const INITIAL_PIPELINE: PipelineCandidate[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Siddharth Kadbhane',
    title: 'Lead Full-Stack Architect',
    avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
    matchScore: 96,
    skillScore: 94.0,
    stage: 'Interview',
    skills: ['TypeScript', 'Rust', 'Next.js 15'],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Alex Chen',
    title: 'Frontend & Design Systems Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    matchScore: 92,
    skillScore: 82.0,
    stage: 'Shortlisted',
    skills: ['React 19', 'Tailwind CSS', 'TypeScript'],
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Sarah Connor',
    title: 'ML Platform & Backend Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    matchScore: 88,
    skillScore: 76.0,
    stage: 'Screening',
    skills: ['Python', 'FastAPI', 'Redis'],
  },
  {
    id: 'c_004',
    name: 'Elena Rostova',
    title: 'Cloud Infrastructure & DevOps Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    matchScore: 90,
    skillScore: 85.0,
    stage: 'Applied',
    skills: ['Kubernetes', 'Terraform', 'AWS'],
  },
  {
    id: 'c_005',
    name: 'David Vance',
    title: 'Senior Systems Rust Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    matchScore: 94,
    skillScore: 89.0,
    stage: 'Offer',
    skills: ['Rust', 'Tokio', 'Raft Consensus'],
  },
];

export default function HiringPipelinePage() {
  const [profile, setProfile] = useState<any>(null);
  const [candidates, setCandidates] = useState<PipelineCandidate[]>(INITIAL_PIPELINE);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const stages: PipelineCandidate['stage'][] = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Offer',
    'Hired',
  ];

  const moveStage = (id: string, direction: 'forward' | 'backward') => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currIdx = stages.indexOf(c.stage);
        const newIdx = direction === 'forward' ? Math.min(stages.length - 1, currIdx + 1) : Math.max(0, currIdx - 1);
        return { ...c, stage: stages[newIdx] };
      })
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Hiring Pipeline" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          <PageHeader
            title="Kanban Hiring Pipeline"
            description="Manage candidates across all hiring stages with instant access to AST code proof and AI Match scores."
            badge={{ text: `${candidates.length} In Progress`, variant: 'cyan' }}
          />

          {/* Kanban Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter((c) => c.stage === stage);
              return (
                <div
                  key={stage}
                  className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-3.5 flex flex-col min-w-[240px] max-h-[calc(100vh-220px)] shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                      {stage}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#111722] text-[#A78BFA] border border-white/[0.06]">
                      {stageCandidates.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {stageCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="p-3.5 bg-[#111722] hover:bg-[#151B26] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all shadow-sm space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={cand.avatarUrl}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                            />
                            <div>
                              <h4 className="font-semibold text-xs text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors truncate max-w-[110px]">
                                {cand.name}
                              </h4>
                              <p className="text-[10px] text-[#64748B] truncate max-w-[110px]">{cand.title}</p>
                            </div>
                          </div>

                          <span className="font-mono text-[11px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded">
                            {cand.matchScore}%
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {cand.skills.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.04] text-[#94A3B8]">
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Stage Movement Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                          <div className="flex items-center gap-1">
                            {stages.indexOf(cand.stage) > 0 && (
                              <button
                                onClick={() => moveStage(cand.id, 'backward')}
                                className="p-1 rounded bg-[#0D121A] hover:bg-[#1C2433] text-[#64748B] hover:text-white"
                                title="Move back"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {stages.indexOf(cand.stage) < stages.length - 1 && (
                              <button
                                onClick={() => moveStage(cand.id, 'forward')}
                                className="p-1 rounded bg-[#0D121A] hover:bg-[#1C2433] text-[#64748B] hover:text-white"
                                title="Advance candidate"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <Link
                            href={`/company/candidates/${cand.id}`}
                            className="text-[11px] font-semibold text-[#A78BFA] hover:underline"
                          >
                            Evaluate &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
