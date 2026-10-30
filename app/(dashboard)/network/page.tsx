'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import DeveloperCard from '@/components/ui/DeveloperCard';
import EmptyState from '@/components/ui/EmptyState';
import {
  UserCheck,
  Search,
  Users,
  ShieldCheck,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { DUMMY_USERS } from '@/lib/dummyData';

export default function NetworkPage() {
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const roles = ['All', 'Full-Stack', 'Frontend', 'Backend', 'AI & ML'];

  const filteredUsers = DUMMY_USERS.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Developer Network" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Verified Developer Network"
            description="Discover peers, architects, and collaborators based on verified technical evidence, mutual skills, and code quality benchmarks."
            badge={{ text: 'Evidence-First Connections', variant: 'cyan' }}
          />

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Verified Connections"
              value="342"
              icon={UserCheck}
              iconColor="text-[#10B981]"
              subtitle="Peers with 800+ trust scores"
            />
            <StatCard
              label="Mutual Skill Matches"
              value="86 Peers"
              icon={Sparkles}
              iconColor="text-[#7C3AED]"
              subtitle="Matching TypeScript, Rust, Next.js"
            />
            <StatCard
              label="Open Source Collaborations"
              value="18"
              icon={GitBranch}
              iconColor="text-[#38BDF8]"
              subtitle="Active co-authored PRs"
            />
            <StatCard
              label="Global Ranking"
              value="Top 0.8%"
              icon={ShieldCheck}
              iconColor="text-[#FBBF24]"
              subtitle="Based on verified repository audits"
            />
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedRole === role
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search peers by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] outline-none transition-all"
              />
            </div>
          </div>

          {/* Developers Grid */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No developers found"
              description="Try adjusting your search criteria."
              action={{ label: 'Clear Search', onClick: () => setSearchQuery('') }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((dev) => (
                <DeveloperCard
                  key={dev.id}
                  username={dev.username}
                  name={dev.name}
                  avatarUrl={dev.avatarUrl}
                  role={dev.role === 'recruiter' ? 'Technical Talent Partner' : 'Full-Stack Architect'}
                  location={dev.location}
                  trustScore={dev.trustScore.overallScore}
                  dccLevel={dev.dccLevel}
                  skills={['TypeScript', 'Next.js 15', 'Rust', 'PostgreSQL']}
                  bio={dev.bio}
                  mutualSkillsCount={3}
                  isAvailable={true}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
