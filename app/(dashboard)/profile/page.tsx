'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import SkillChip from '@/components/ui/SkillChip';
import ProjectCard from '@/components/ui/ProjectCard';
import ActivityItem from '@/components/ui/ActivityItem';
import {
  User,
  ShieldCheck,
  MapPin,
  Globe,
  Github,
  Award,
  Dna,
  Share2,
  ExternalLink,
  Code2,
  FolderGit2,
  Sparkles,
  Check,
} from 'lucide-react';
import { DUMMY_REPOSITORIES, getDummyDCCData } from '@/lib/dummyData';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setProfile(json.data.profile);
          setTrustScore(json.data.trustScore);
        }
      })
      .catch(() => {});
  }, []);

  const dcc = getDummyDCCData('00000000-0000-0000-0000-000000000001');

  const copyPassport = () => {
    const url = `${window.location.origin}/passport/${profile?.username || 'siddharthkadbhane-pixel'}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Developer Profile" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Identity Header Card (WHO I AM) */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#7C3AED]/10 via-[#06B6D4]/5 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <img
                  src={profile?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                  alt=""
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-white/10 shadow-lg"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {profile?.name || 'Siddharth Kadbhane'}
                    </h1>
                    <span title="Verified Developer">
                      <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD] border border-[#7C3AED]/40">
                      Elite Developer
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-600 dark:text-[#94A3B8]">
                    @{profile?.username || 'siddharthkadbhane-pixel'} &bull; Lead Full-Stack Architect
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-[#64748B] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile?.location || 'Mumbai, India'}
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

              {/* Trust Score Badge & Actions */}
              <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block tracking-wider">
                    Trust Score
                  </span>
                  <span className="font-mono text-3xl font-bold text-[#10B981]">
                    {trustScore?.overallScore || 940}
                    <span className="text-xs text-[#64748B] font-normal">/1000</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPassport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Share Passport'}
                  </button>
                  <Link
                    href={`/passport/${profile?.username || 'siddharthkadbhane-pixel'}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                  >
                    Public Passport
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-3xl">
              {profile?.bio ||
                'Full-Stack Architect specializing in high-throughput distributed systems, Next.js 15 App Router design architectures, and autonomous AI agents. Focused on zero-alloc memory safety in Rust and strict TypeScript engineering.'}
            </div>
          </div>

          {/* WHAT I'M GOOD AT (Skill DNA & Verified Skills) */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  Verified Skills & Capabilities
                </h3>
              </div>
              <Link href="/skill-dna" className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline">
                Full DNA Breakdown &rarr;
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {(dcc.verifiedSkills || []).slice(0, 10).map((skill: any, i: number) => (
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

          {/* WHAT I BUILD (Featured Projects) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  Featured Codebases
                </h3>
              </div>
              <Link href="/projects" className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline">
                All Projects &rarr;
              </Link>
            </div>

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

          {/* WHAT I'VE PROVEN (Achievements & Proof Evidence) */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <Award className="w-4 h-4 text-amber-500 dark:text-[#FBBF24]" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Verified Technical Proofs & Evidence
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] space-y-1.5">
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-[#10B981]">100% AST Audited</span>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B]">All 6 repositories verified with 0 critical security flaws.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] space-y-1.5">
                <span className="font-mono text-sm font-bold text-cyan-600 dark:text-[#38BDF8]">3,842 Commits</span>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Continuous commit telemetry across multi-repo workspaces.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] space-y-1.5">
                <span className="font-mono text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA]">Global Fast-Track</span>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Qualified for direct recruiter shortlist and referral badges.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
