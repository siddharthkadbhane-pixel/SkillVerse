'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import CandidateCard from '@/components/ui/CandidateCard';
import EmptyState from '@/components/ui/EmptyState';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { DUMMY_USERS } from '@/lib/dummyData';

export default function FindDevelopersPage() {
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [minScore, setMinScore] = useState(70);
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

  const skillFilters = ['All', 'TypeScript', 'React', 'Rust', 'Python', 'Next.js', 'PostgreSQL'];
  const levelFilters = ['All', 'Elite (900+)', 'Expert (800+)', 'Advanced (700+)'];

  const candidatePool = [
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
      level: 'Elite (900+)',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Alex Chen',
      title: 'Principal Frontend & Design Systems Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      matchScore: 92,
      skillScore: 82.0,
      topSkills: [
        { name: 'React', level: 95 },
        { name: 'Tailwind CSS', level: 96 },
        { name: 'WebGL', level: 88 },
        { name: 'TypeScript', level: 90 },
      ],
      projectCount: 9,
      commitCount: '2.1k',
      prCount: 94,
      growth: 15.2,
      level: 'Expert (800+)',
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
      level: 'Advanced (700+)',
    },
  ];

  const filteredCandidates = candidatePool.filter((c) => {
    const matchesSkill =
      selectedSkill === 'All' || c.topSkills.some((s) => s.name.toLowerCase().includes(selectedSkill.toLowerCase()));
    const matchesLevel = selectedLevel === 'All' || c.level === selectedLevel;
    const matchesScore = c.skillScore >= minScore;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSkill && matchesLevel && matchesScore && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Find Developers" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Find Verified Developers"
            description="Discover elite engineers with cryptographic proof of skills, AST audit scores, and project telemetry."
            badge={{ text: `${filteredCandidates.length} Matches`, variant: 'cyan' }}
          />

          {/* Search & Faceted Filter Panel */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates by name, job title, keywords (e.g. Lead Architect, Distributed Systems)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
              />
            </div>

            {/* Faceted Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.06]">
              {/* Skill Filter */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                  Required Skill
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skillFilters.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSkill(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedSkill === s
                          ? 'bg-[#7C3AED] text-white'
                          : 'bg-[#111722] border border-white/[0.06] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Developer Tier Filter */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                  Developer Tier
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {levelFilters.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedLevel === lvl
                          ? 'bg-[#38BDF8] text-[#070A0F]'
                          : 'bg-[#111722] border border-white/[0.06] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Skill Score Range */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  <span>Min Skill Score</span>
                  <span className="font-mono text-xs text-[#10B981]">{minScore}+</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {filteredCandidates.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No candidates match your filters"
              description="Try broadening your skill requirements or lowering the minimum score threshold."
              action={{
                label: 'Reset All Filters',
                onClick: () => {
                  setSearchQuery('');
                  setSelectedSkill('All');
                  setSelectedLevel('All');
                  setMinScore(70);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((candidate) => (
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
          )}
        </main>
      </div>
    </div>
  );
}
