'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import EmptyState from '@/components/ui/EmptyState';
import {
  Trophy,
  Search,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  Code2,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DUMMY_CHALLENGES } from '@/lib/dummyData';

export default function ChallengesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const categories = [
    'All',
    'Distributed Systems',
    'Frontend Architecture',
    'Zero-Knowledge',
    'AI Multi-Agent',
  ];

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'expert':
      case 'hard':
        return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25';
      case 'medium':
      case 'advanced':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25';
      default:
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25';
    }
  };

  const filteredChallenges = DUMMY_CHALLENGES.filter((ch) => {
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Challenges & Hackathons" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Practical Engineering Challenges"
            description="Prove real-world engineering capabilities across distributed systems, algorithmic efficiency, and architectural design."
            badge={{ text: 'Verifiable Proof', variant: 'cyan' }}
          />

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Completed Challenges"
              value="8 / 12"
              trend={{ value: 'Top 1%', isPositive: true }}
              icon={Trophy}
              iconColor="text-[#FBBF24]"
              subtitle="Score multiplier: 1.25x"
            />
            <StatCard
              label="Verified XP Earned"
              value="4,850 XP"
              icon={Zap}
              iconColor="text-[#7C3AED]"
              subtitle="Tier: Elite Challenger"
            />
            <StatCard
              label="Active Hackathons"
              value="4 Live"
              icon={Users}
              iconColor="text-[#38BDF8]"
              subtitle="$47,000 Total Prize Pools"
            />
            <StatCard
              label="Fast-Track Referrals"
              value="3 Unlocked"
              icon={ShieldCheck}
              iconColor="text-[#10B981]"
              subtitle="Hyperion AI, Vanguard Tech"
            />
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D121A] border border-white/[0.08] p-3 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
              />
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 transition-all duration-150 shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#111722] border border-white/[0.06] text-[#A78BFA]">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors">
                        {challenge.title}
                      </h3>
                    </div>

                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getDifficultyColor(
                        challenge.difficulty
                      )}`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8] line-clamp-2 mb-4 leading-relaxed">
                    {challenge.description}
                  </p>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {challenge.technologies.map((tech, i) => (
                      <SkillChip key={i} name={tech} size="sm" verified={false} />
                    ))}
                  </div>
                </div>

                {/* Footer Metrics & Action */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#94A3B8]">
                    <span className="font-mono text-[#FBBF24] font-bold flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      {challenge.prizePool}
                    </span>
                    <span className="font-mono text-[11px] text-[#64748B] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {challenge.timeLimit}
                    </span>
                  </div>

                  <button
                    onClick={() => alert(`Starting Challenge: ${challenge.title}. Sandbox container initialized.`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                  >
                    Start Challenge
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
