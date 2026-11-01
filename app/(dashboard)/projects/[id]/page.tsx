'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import ActivityItem from '@/components/ui/ActivityItem';
import {
  FolderGit2,
  ShieldCheck,
  Star,
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Github,
  ExternalLink,
  Code2,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { DUMMY_REPOSITORIES, DUMMY_REVIEWS } from '@/lib/dummyData';

export default function ProjectDetailPage() {
  const params = useParams();
  const rawId = (params.id as string) || '1';

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const project = DUMMY_REPOSITORIES.find((r) => r.id === rawId || r.name === rawId) || DUMMY_REPOSITORIES[0];
  const review = DUMMY_REVIEWS.find((rev) => rev.repositoryId === project.id) || DUMMY_REVIEWS[0];

  const technologies = [
    'TypeScript',
    'Next.js 15',
    'React 19',
    'Tailwind CSS',
    'PostgreSQL',
    'Drizzle ORM',
    'Zod',
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-primary">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb={`Projects / ${project.name}`} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Projects Portfolio
            </Link>

            <div className="flex items-center gap-2">
              <a
                href={project.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111722] hover:bg-slate-50 dark:hover:bg-[#151B26] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] shadow-sm transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                View on GitHub
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Project Hero Header Card */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-[#7C3AED]/15 border border-indigo-500/20 dark:border-[#7C3AED]/30 text-indigo-600 dark:text-[#A78BFA]">
                  <FolderGit2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {project.name}
                    </h1>
                    <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] dark:text-[#34D399] border border-[#10B981]/30">
                      AST Audited
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] mt-1">
                    {project.fullName} &bull; Main branch: production
                  </p>
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] block tracking-wider">
                    Project AI Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl sm:text-4xl font-black text-[#10B981]">
                      {project.overallScore}
                    </span>
                    <span className="font-mono text-sm text-slate-500 dark:text-[#64748B]">/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              {project.description}
            </p>
          </div>

          {/* Project Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Codebase Health"
              value={`${project.healthScore}%`}
              trend={{ value: 'Elite', isPositive: true }}
              icon={ShieldCheck}
              iconColor="text-[#10B981]"
              subtitle="Zero high-severity flaws"
            />
            <StatCard
              label="GitHub Stars"
              value={project.stars}
              icon={Star}
              iconColor="text-[#F59E0B]"
              subtitle="Community recognition"
            />
            <StatCard
              label="Forks & Clones"
              value={project.forks}
              icon={GitBranch}
              iconColor="text-[#38BDF8]"
              subtitle="Active distribution"
            />
            <StatCard
              label="Total Commits"
              value="842"
              trend={{ value: '+42 this month', isPositive: true }}
              icon={GitCommit}
              iconColor="text-[#7C3AED]"
              subtitle="Signed verification keys"
            />
          </div>

          {/* AST Review Breakdown */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  AI & AST Code Quality Analysis
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">Audit Engine v2.4</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] block">
                  Architecture & Modularity
                </span>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {review.architecture}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-[#38BDF8] block">
                  Code Quality & Types
                </span>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {review.codeQuality}
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Strengths
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                  {review.strengths.map((st, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#10B981] font-bold">&bull;</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Opportunities for Improvement
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                  {review.weaknesses.map((wk, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#F59E0B] font-bold">&bull;</span>
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Technologies Used */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
              Verified Technologies & Dependencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, i) => (
                <SkillChip key={i} name={tech} verified={true} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
