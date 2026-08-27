'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  TrendingUp,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { DUMMY_USERS, DUMMY_REPOSITORIES } from '@/lib/dummyData';

export default function AIMatchPage() {
  const params = useParams();
  const candidateId = (params.candidateId as string) || '00000000-0000-0000-0000-000000000001';
  const jobId = (params.jobId as string) || 'job_1';

  const [profile, setProfile] = useState<any>(null);
  const candidate = DUMMY_USERS.find((u) => u.id === candidateId) || DUMMY_USERS[0];

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const requirements = [
    {
      skill: 'React 19 / Next.js',
      required: 'Advanced (85+)',
      candidateLevel: '95 / 100',
      matchPct: 98,
      evidence: '12 production projects, 3,842 commits, 8 code reviews, zero hydration mismatches.',
      status: 'Exceeds',
    },
    {
      skill: 'TypeScript',
      required: 'Advanced (85+)',
      candidateLevel: '98 / 100',
      matchPct: 100,
      evidence: '4,210 commits, strict compiler flags, generic AST transformers.',
      status: 'Exceeds',
    },
    {
      skill: 'Distributed Systems & Rust',
      required: 'Proficient (75+)',
      candidateLevel: '94 / 100',
      matchPct: 96,
      evidence: 'Authored hyperion-distributed-cache, raft consensus state machines.',
      status: 'Exceeds',
    },
    {
      skill: 'PostgreSQL & Database Optimization',
      required: 'Proficient (75+)',
      candidateLevel: '92 / 100',
      matchPct: 92,
      evidence: 'Complex normalized schemas, connection pooling, Drizzle ORM migrations.',
      status: 'Meets',
    },
    {
      skill: 'End-to-End Testing & CI/CD',
      required: 'Proficient (75+)',
      candidateLevel: '86 / 100',
      matchPct: 88,
      evidence: 'Vitest unit suites and GitHub Actions automated build testing.',
      status: 'Meets',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="AI Match Intelligence" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href={`/company/candidates/${candidate.id}`}
              className="text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
            >
              &larr; Back to Candidate Profile
            </Link>
            <span className="text-[11px] font-mono text-[#64748B]">
              Job: Principal Full-Stack Architect
            </span>
          </div>

          <PageHeader
            title="AI Match Decision Intelligence"
            description="Algorithmic compatibility breakdown matching vacancy requirements against verified candidate codebases."
            badge={{ text: '94/100 Excellent Match', variant: 'cyan' }}
          />

          {/* Central AI Match Hero Card */}
          <div className="bg-gradient-to-br from-[#7C3AED]/20 via-[#0D121A] to-[#0D121A] border border-[#7C3AED]/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <img
                  src={candidate.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#F8FAFC]">{candidate.name}</h2>
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    @{candidate.username} &bull; Matched for <strong className="text-white">Principal Architect</strong>
                  </p>
                </div>
              </div>

              {/* Large Score */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] block">
                    Composite Match Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-black text-[#F8FAFC]">94</span>
                    <span className="font-mono text-base text-[#64748B]">/100</span>
                  </div>
                  <span className="text-xs font-semibold text-[#10B981]">Top 0.5% Match Tier</span>
                </div>
              </div>
            </div>

            {/* Match Compatibility Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Skill Compatibility', score: 98, color: '#10B981' },
                { label: 'Project Relevance', score: 95, color: '#38BDF8' },
                { label: 'Experience Level', score: 92, color: '#7C3AED' },
                { label: 'Recent Activity', score: 96, color: '#06B6D4' },
                { label: 'Growth Trajectory', score: 91, color: '#F59E0B' },
              ].map((dim, i) => (
                <div key={i} className="p-3 bg-[#111722] border border-white/[0.04] rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    {dim.label}
                  </span>
                  <span className="font-mono text-lg font-bold text-[#F8FAFC] block">
                    {dim.score}%
                  </span>
                  <div className="w-full h-1 bg-[#151B26] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${dim.score}%`, backgroundColor: dim.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Central Philosophy Banner */}
          <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.08] flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <span>
                <strong className="text-white">AI recommends. Evidence explains. Company decides.</strong> Every match score is substantiated by AST code analysis.
              </span>
            </div>
          </div>

          {/* Requirement Match Table */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm text-[#F8FAFC]">
                Requirement vs Candidate Evidence Match
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#111722] text-[#64748B] font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">Requirement</th>
                    <th className="py-3 px-4">Required</th>
                    <th className="py-3 px-4">Candidate Level</th>
                    <th className="py-3 px-4">Match %</th>
                    <th className="py-3 px-4">AST Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {requirements.map((req, i) => (
                    <tr key={i} className="hover:bg-[#111722]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#F8FAFC]">
                        {req.skill}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#94A3B8]">
                        {req.required}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#10B981] font-bold">
                        {req.candidateLevel}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#38BDF8]">
                        {req.matchPct}%
                      </td>
                      <td className="py-3.5 px-4 text-[#94A3B8] max-w-sm leading-relaxed">
                        {req.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Decision Footer */}
          <div className="p-6 rounded-xl bg-[#0D121A] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-[#F8FAFC]">Ready to Proceed with Candidate?</h4>
              <p className="text-xs text-[#94A3B8]">Advance Siddharth Kadbhane to the Technical Architecture Interview stage.</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/company/pipeline"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
              >
                Schedule Technical Interview &rarr;
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
