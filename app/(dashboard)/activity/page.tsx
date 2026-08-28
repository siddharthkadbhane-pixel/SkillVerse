'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import ActivityItem, { ActivityType } from '@/components/ui/ActivityItem';
import EmptyState from '@/components/ui/EmptyState';
import {
  Activity,
  Search,
  RefreshCw,
  GitCommit,
  GitPullRequest,
  FolderGit2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { ContributionIntelligenceSummary, MonthlyContributionBucket, ContributionActivityItem } from '@/types/activity';

export default function ActivityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<ContributionIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivityData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/activity');
      const json = await res.json();
      if (json.success && json.data) {
        setIntelligence(json.data);
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});

    fetchActivityData();
  }, [fetchActivityData]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await fetch('/api/activity/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setSyncMessage(json.data.message || 'Activity synchronized successfully.');
        await fetchActivityData();
      }
    } catch {
      setSyncMessage('Failed to synchronize activity with GitHub.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const filters = [
    { label: 'All', value: 'All' },
    { label: 'Commits', value: 'commit' },
    { label: 'PRs', value: 'pull_request' },
    { label: 'Audits & Reviews', value: 'audit' },
    { label: 'Milestones', value: 'achievement' },
  ];

  const activities = intelligence?.recentActivities || [];

  const filteredActivities = activities.filter((act) => {
    const matchesFilter =
      selectedFilter === 'All' ||
      act.activityType === selectedFilter ||
      (selectedFilter === 'audit' && (act.activityType === 'audit' || act.activityType === 'code_review'));
    const matchesSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.repositoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const maxMonthCount = Math.max(...(intelligence?.monthlyTimeline || []).map(m => m.count), 1);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Activity Timeline" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title="Technical Activity & Contribution Intelligence"
              description="Real GitHub engineering telemetry, commit cadences, and pull request audits acting as contextual evidence."
              badge={{ text: `${intelligence?.totalRecentContributions || 0} Recent Events`, variant: 'cyan' }}
            />

            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-xs font-semibold text-white transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing GitHub...' : 'Sync Activity'}</span>
            </button>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Contextual Metrics Cards */}
          {intelligence && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
                  Active Repositories
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-white">{intelligence.activeRepositoriesCount}</span>
                  <span className="text-xs text-[#94A3B8]">repos</span>
                </div>
                <p className="text-[11px] text-[#64748B]">With verified commit history</p>
              </div>

              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
                  Analyzed Codebases
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-[#10B981]">{intelligence.analyzedRepositoriesCount}</span>
                  <span className="text-xs text-[#94A3B8]">audited</span>
                </div>
                <p className="text-[11px] text-[#64748B]">Deep AST reviews completed</p>
              </div>

              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
                  90-Day Contributions
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-[#38BDF8]">{intelligence.totalRecentContributions}</span>
                  <span className="text-xs text-[#94A3B8]">events</span>
                </div>
                <p className="text-[11px] text-[#64748B]">Commits and merged PRs</p>
              </div>

              <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block">
                  Contribution Cadence
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-[#A78BFA]">{intelligence.frequency}</span>
                </div>
                <p className="text-[11px] text-[#64748B]">Consistency index</p>
              </div>
            </div>
          )}

          {/* Contextual Narrative Alert */}
          {intelligence?.contextualSummary && (
            <div className="p-3.5 rounded-xl bg-[#0D121A] border border-white/[0.08] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div className="text-xs text-[#94A3B8] leading-relaxed">
                <strong className="text-[#F8FAFC]">Contextual Evidence: </strong>
                {intelligence.contextualSummary}
              </div>
            </div>
          )}

          {/* Monthly Contribution Timeline Chart */}
          {intelligence && intelligence.monthlyTimeline.length > 0 && (
            <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Contribution Activity Density (Last 6 Months)
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#38BDF8]/60" />
                  <span>Activity Frequency</span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 bg-[#111722] border border-white/[0.04] p-4 rounded-xl">
                {intelligence.monthlyTimeline.map((bucket, idx) => {
                  const heightPercent = Math.max(20, Math.round((bucket.count / maxMonthCount) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className="w-full h-24 bg-[#070A0F]/60 rounded-lg flex items-end justify-center p-1.5 border border-white/[0.03] group relative">
                        <div 
                          className="w-full max-w-[28px] bg-gradient-to-t from-[#38BDF8]/40 to-[#38BDF8] rounded-md transition-all duration-300 group-hover:brightness-125"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <div className="absolute -top-10 bg-[#070A0F] border border-white/[0.12] px-2 py-1 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                          {bucket.count} events ({bucket.commitCount}c / {bucket.prCount}pr)
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#94A3B8] text-center">{bucket.label.split(' ')[0]}</span>
                      <span className="text-[9px] font-mono text-[#64748B] -mt-1.5">{bucket.count} events</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/[0.03] rounded-xl" />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No activity records found"
                description="GitHub activity will appear as SkillVerse analyzes your public engineering work."
                action={{ label: 'Reset Filters', onClick: () => { setSelectedFilter('All'); setSearchQuery(''); } }}
              />
            ) : (
              <div className="space-y-1 divide-y divide-white/[0.04]">
                {filteredActivities.map((item, idx) => {
                  const actType: ActivityType = 
                    item.activityType === 'commit' ? 'commit' :
                    item.activityType === 'pull_request' ? 'pr' :
                    item.activityType === 'audit' ? 'audit' : 'achievement';

                  return (
                    <ActivityItem
                      key={idx}
                      type={actType}
                      title={item.title}
                      description={item.description}
                      timestamp={new Date(item.activityDate).toLocaleDateString()}
                      repoName={item.repositoryName}
                      metric={item.metadata?.language ? `Stack: ${item.metadata.language}` : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
