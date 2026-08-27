'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProjectCard from '@/components/ui/ProjectCard';
import {
  Github,
  GitCommit,
  GitPullRequest,
  GitBranch,
  Star,
  Activity,
  Calendar,
  ExternalLink,
  Code2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { DUMMY_REPOSITORIES } from '@/lib/dummyData';

export default function GitHubPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const languageStats = [
    { name: 'TypeScript', percentage: 54, color: '#3178C6', lines: '142,800 lines' },
    { name: 'Rust', percentage: 26, color: '#DEA584', lines: '68,400 lines' },
    { name: 'Python', percentage: 14, color: '#3572A5', lines: '36,900 lines' },
    { name: 'CSS / Tailwind', percentage: 6, color: '#38BDF8', lines: '15,200 lines' },
  ];

  // 52-week simulated heatmap grid (7 days x 26 columns preview)
  const heatmapWeeks = Array.from({ length: 28 }, (_, wIndex) =>
    Array.from({ length: 7 }, (_, dIndex) => {
      const isRecent = wIndex > 18;
      const count = isRecent ? Math.floor(Math.random() * 8 + 2) : Math.floor(Math.random() * 5);
      return count;
    })
  );

  const getHeatmapColor = (count: number) => {
    if (count >= 6) return 'bg-[#7C3AED]';
    if (count >= 4) return 'bg-[#8B5CF6]/70';
    if (count >= 2) return 'bg-[#7C3AED]/40';
    if (count >= 1) return 'bg-[#7C3AED]/20';
    return 'bg-[#151B26]';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="GitHub Intelligence" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="GitHub Contribution Intelligence"
            description="Verified commit telemetry, PR velocity, and language distribution extracted directly from your GitHub profile."
            badge={{ text: '@siddharthkadbhane-pixel', variant: 'primary' }}
          >
            <a
              href="https://github.com/siddharthkadbhane-pixel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              View on GitHub
            </a>
          </PageHeader>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Annual Contributions"
              value="2,840"
              trend={{ value: '18% YoY', isPositive: true }}
              icon={Activity}
              iconColor="text-[#10B981]"
              subtitle="Top 2% global activity"
            />
            <StatCard
              label="Verified Commits"
              value="3,842"
              icon={GitCommit}
              iconColor="text-[#38BDF8]"
              subtitle="Signed cryptographic commits"
            />
            <StatCard
              label="Pull Requests Merged"
              value="148"
              trend={{ value: '98% Merge Rate', isPositive: true }}
              icon={GitPullRequest}
              iconColor="text-[#7C3AED]"
              subtitle="Peer-reviewed code"
            />
            <StatCard
              label="Repository Stars"
              value="848"
              icon={Star}
              iconColor="text-[#F59E0B]"
              subtitle="Across 6 public codebases"
            />
          </div>

          {/* Contribution Heatmap Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-semibold text-sm text-[#F8FAFC]">
                  Contribution Activity Matrix
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-[#151B26]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]/20" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]/40" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]/70" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1.5 min-w-[640px]">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((count, dIdx) => (
                      <div
                        key={dIdx}
                        className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColor(count)} transition-all hover:scale-125 cursor-pointer`}
                        title={`Activity: ${count} contributions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-[#94A3B8]">
              <span>Continuous streak: <strong className="text-[#10B981] font-mono">48 days</strong></span>
              <span>Longest streak: <strong className="text-[#F8FAFC] font-mono">112 days</strong></span>
            </div>
          </div>

          {/* Languages Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-[#0D121A] border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <Code2 className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="font-semibold text-sm text-[#F8FAFC]">
                  Language Distribution by Lines of Code
                </h3>
              </div>

              {/* Progress Bar Stack */}
              <div className="w-full h-3 bg-[#151B26] rounded-full overflow-hidden flex">
                {languageStats.map((lang, i) => (
                  <div
                    key={i}
                    style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                    title={`${lang.name}: ${lang.percentage}%`}
                  />
                ))}
              </div>

              <div className="space-y-2.5 pt-2">
                {languageStats.map((lang, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                      <span className="font-medium text-[#F8FAFC]">{lang.name}</span>
                      <span className="text-[11px] text-[#64748B]">({lang.lines})</span>
                    </div>
                    <span className="font-mono font-bold text-[#94A3B8]">{lang.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Repositories */}
            <div className="lg:col-span-6 bg-[#0D121A] border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="font-semibold text-sm text-[#F8FAFC]">
                    Top Starred Repositories
                  </h3>
                </div>
                <Link href="/projects" className="text-xs text-[#A78BFA] hover:underline font-semibold">
                  All Projects
                </Link>
              </div>

              <div className="space-y-3">
                {DUMMY_REPOSITORIES.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 bg-[#111722] border border-white/[0.04] rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-xs text-[#F8FAFC] truncate">{r.name}</h4>
                      <p className="text-[11px] text-[#64748B] line-clamp-1">{r.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-xs text-[#F59E0B]">
                      <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                      <span>{r.stars}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
