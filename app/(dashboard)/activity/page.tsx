'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import ActivityItem, { ActivityType } from '@/components/ui/ActivityItem';
import EmptyState from '@/components/ui/EmptyState';
import {
  Activity,
  Filter,
  Search,
  RefreshCw,
  GitCommit,
  GitPullRequest,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface ActivityRecord {
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  repoName: string;
  metric?: string;
}

const ALL_ACTIVITIES: ActivityRecord[] = [
  {
    type: 'audit',
    title: 'SkillVerse AST AI Review Completed',
    description: 'Code quality score calculated at 95/100 with zero critical security flaws.',
    timestamp: '2 hours ago',
    repoName: 'siddharthkadbhane-pixel/SkillVerse',
    metric: 'Score: 95/100',
  },
  {
    type: 'commit',
    title: 'Commit: distributed raft state machine implementation',
    description: 'Added zero-alloc buffer pooling and asynchronous node heartbeat channels.',
    timestamp: '5 hours ago',
    repoName: 'hyperion-distributed-cache',
    metric: '+482 / -18 lines',
  },
  {
    type: 'pr',
    title: 'Merged PR #24: LLM Context Pruning Optimization',
    description: 'Reduced multi-agent token payload latency by 42% on streaming responses.',
    timestamp: '1 day ago',
    repoName: 'neural-agent-orchestrator',
    metric: 'Merged',
  },
  {
    type: 'achievement',
    title: 'Elite Developer Level Milestone Achieved',
    description: 'Surpassed 940 overall score with 18 verified engineering skills.',
    timestamp: '2 days ago',
    repoName: 'Skill DNA',
    metric: 'Tier: Elite',
  },
  {
    type: 'review',
    title: 'Peer Code Review Submitted on telemetry-view',
    description: 'Verified React 19 memoization boundaries and dark mode token usage.',
    timestamp: '3 days ago',
    repoName: 'telemetry-view',
    metric: 'Approved',
  },
  {
    type: 'challenge',
    title: 'Completed Algorithmic Challenge: Raft Consensus Optimizer',
    description: 'Ranked 1st place with 100% test pass rate in 18 minutes.',
    timestamp: '4 days ago',
    repoName: 'Global Hackathon',
    metric: '+500 XP',
  },
  {
    type: 'project',
    title: 'Imported New Repository: react-glassmorphic-ui',
    description: 'Initialized automated AST scanning pipeline.',
    timestamp: '6 days ago',
    repoName: 'react-glassmorphic-ui',
  },
  {
    type: 'commit',
    title: 'Commit: Next.js 15 App Router design system overhaul',
    description: 'Refactored navigation components with role-aware switcher and JetBrains Mono typography.',
    timestamp: '1 week ago',
    repoName: 'SkillVerse',
  },
];

export default function ActivityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const filters = [
    { label: 'All', value: 'All' },
    { label: 'Commits', value: 'commit' },
    { label: 'PRs', value: 'pr' },
    { label: 'Audits & Reviews', value: 'audit' },
    { label: 'Achievements', value: 'achievement' },
    { label: 'Projects', value: 'project' },
  ];

  const filteredActivities = ALL_ACTIVITIES.filter((act) => {
    const matchesFilter =
      selectedFilter === 'All' ||
      act.type === selectedFilter ||
      (selectedFilter === 'audit' && (act.type === 'audit' || act.type === 'review'));
    const matchesSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.repoName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Activity Timeline" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <PageHeader
            title="Technical Activity Timeline"
            description="Chronological stream of cryptographic commits, pull request merges, repository audits, and skill milestones."
            badge={{ text: `${ALL_ACTIVITIES.length} Events`, variant: 'cyan' }}
          />

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D121A] border border-white/[0.08] p-3 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedFilter === f.value
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
              />
            </div>
          </div>

          {/* Timeline List Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm">
            {filteredActivities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No activity records found"
                description="Try clearing your search query or selecting 'All' in the filters."
                action={{ label: 'Reset Filters', onClick: () => { setSelectedFilter('All'); setSearchQuery(''); } }}
              />
            ) : (
              <div className="space-y-1 divide-y divide-white/[0.04]">
                {filteredActivities.map((item, idx) => (
                  <ActivityItem
                    key={idx}
                    type={item.type}
                    title={item.title}
                    description={item.description}
                    timestamp={item.timestamp}
                    repoName={item.repoName}
                    metric={item.metric}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
