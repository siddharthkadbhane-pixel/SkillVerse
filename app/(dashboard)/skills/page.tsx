'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import EmptyState from '@/components/ui/EmptyState';
import {
  Code2,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  FolderGit2,
  GitCommit,
  Layers,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

interface SkillItem {
  name: string;
  category: string;
  score: number;
  level: string;
  growth: number;
  projectsCount: number;
  commitsCount: number;
  contributionsCount: number;
  evidence: string;
  relatedSkills: string[];
}

const ALL_SKILLS: SkillItem[] = [
  {
    name: 'React',
    category: 'Frontend',
    score: 95,
    level: 'Elite',
    growth: 18,
    projectsCount: 12,
    commitsCount: 3842,
    contributionsCount: 27,
    evidence: 'Component tree modularity, React 19 Server Components, memoization and zero unnecessary re-renders.',
    relatedSkills: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Zustand'],
  },
  {
    name: 'TypeScript',
    category: 'Languages',
    score: 98,
    level: 'Elite',
    growth: 14,
    projectsCount: 14,
    commitsCount: 4210,
    contributionsCount: 32,
    evidence: 'Strict type safety, generic constraints, zero any castings in production code paths.',
    relatedSkills: ['React', 'Node.js', 'Next.js 15', 'Zod'],
  },
  {
    name: 'Next.js 15',
    category: 'Frontend',
    score: 96,
    level: 'Elite',
    growth: 22,
    projectsCount: 8,
    commitsCount: 2180,
    contributionsCount: 19,
    evidence: 'App Router conventions, Server Actions, dynamic caching headers, and streaming SSR.',
    relatedSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Vercel'],
  },
  {
    name: 'Rust',
    category: 'Languages',
    score: 94,
    level: 'Elite',
    growth: 34,
    projectsCount: 4,
    commitsCount: 1480,
    contributionsCount: 12,
    evidence: 'Zero-alloc buffer pools, raft consensus state machine, strict lifetime management.',
    relatedSkills: ['Tokio', 'Actix Web', 'Systems Programming', 'PostgreSQL'],
  },
  {
    name: 'Python',
    category: 'Languages',
    score: 90,
    level: 'Advanced',
    growth: 25,
    projectsCount: 6,
    commitsCount: 1920,
    contributionsCount: 15,
    evidence: 'FastAPI async microservices, PyTorch tensor manipulation, structured LLM extraction.',
    relatedSkills: ['FastAPI', 'PyTorch', 'LangChain', 'Docker'],
  },
  {
    name: 'PostgreSQL',
    category: 'Database',
    score: 92,
    level: 'Elite',
    growth: 12,
    projectsCount: 9,
    commitsCount: 2410,
    contributionsCount: 22,
    evidence: 'Schema normalization, indexed foreign keys, transaction isolation and pooling.',
    relatedSkills: ['Drizzle ORM', 'Redis', 'Node.js', 'SQL'],
  },
  {
    name: 'Redis',
    category: 'Database',
    score: 89,
    level: 'Advanced',
    growth: 16,
    projectsCount: 6,
    commitsCount: 1120,
    contributionsCount: 8,
    evidence: 'In-memory pub/sub, token bucket rate limiting, LRU cache eviction policies.',
    relatedSkills: ['PostgreSQL', 'Node.js', 'Caching', 'FastAPI'],
  },
  {
    name: 'Docker',
    category: 'DevOps',
    score: 88,
    level: 'Advanced',
    growth: 15,
    projectsCount: 10,
    commitsCount: 1840,
    contributionsCount: 14,
    evidence: 'Multi-stage Dockerfiles, minimal Alpine base layers, non-root user permissions.',
    relatedSkills: ['Kubernetes', 'GitHub Actions', 'AWS', 'Linux'],
  },
  {
    name: 'FastAPI',
    category: 'Backend',
    score: 91,
    level: 'Elite',
    growth: 20,
    projectsCount: 5,
    commitsCount: 1350,
    contributionsCount: 11,
    evidence: 'Pydantic v2 schemas, asynchronous dependency injection, OpenAPI documentation.',
    relatedSkills: ['Python', 'Docker', 'PostgreSQL', 'Redis'],
  },
  {
    name: 'Tailwind CSS',
    category: 'Frontend',
    score: 96,
    level: 'Elite',
    growth: 10,
    projectsCount: 12,
    commitsCount: 2900,
    contributionsCount: 25,
    evidence: 'HSL design token architectures, dark mode accessibility, responsive utilities.',
    relatedSkills: ['React', 'Next.js 15', 'Design Systems', 'CSS'],
  },
];

export default function SkillsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const categories = ['All', 'Languages', 'Frontend', 'Backend', 'Database', 'DevOps'];

  const filteredSkills = ALL_SKILLS.filter((skill) => {
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Skills" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Verified Technical Skills"
            description="Detailed exploration of technical skills backed by repository code AST analysis, commit volumes, and peer reviews."
            badge={{ text: `${ALL_SKILLS.length} Tracked Skills`, variant: 'primary' }}
          />

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Primary Language"
              value="TypeScript"
              trend={{ value: '98/100', isPositive: true }}
              icon={Code2}
              iconColor="text-[#3B82F6]"
              subtitle="4,210 verified commits"
            />
            <StatCard
              label="Average Skill Score"
              value="93.2"
              trend={{ value: '+16.5%', isPositive: true, label: 'Growth' }}
              icon={ShieldCheck}
              iconColor="text-[#14B8A6]"
              subtitle="Elite proficiency band"
            />
            <StatCard
              label="Analyzed Projects"
              value="14"
              icon={FolderGit2}
              iconColor="text-[#6366F1]"
              subtitle="Covering 10 tech stacks"
            />
            <StatCard
              label="Fastest Growing"
              value="Rust (+34%)"
              icon={TrendingUp}
              iconColor="text-[#06B6D4]"
              subtitle="Systems concurrency"
            />
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-3 rounded-2xl shadow-xs">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#6366F1] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] focus:border-[#6366F1]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] outline-none transition-all"
              />
            </div>
          </div>

          {/* Skills Grid */}
          {filteredSkills.length === 0 ? (
            <EmptyState
              icon={Code2}
              title="No matching skills found"
              description="Try adjusting your search query or switching the category filter."
              action={{ label: 'Clear Filters', onClick: () => { setSearchQuery(''); setSelectedCategory('All'); } }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.name}
                  onClick={() => setSelectedSkill(skill)}
                  className="bg-white dark:bg-[#0D121A] hover:bg-slate-50/80 dark:hover:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-white/[0.14] rounded-2xl p-5 transition-all duration-150 shadow-xs cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                            {skill.name}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-[#64748B] uppercase tracking-wider">
                          {skill.category}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="font-mono text-base font-bold text-[#0D9488] dark:text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/25">
                          {skill.score}
                          <span className="text-[10px] text-slate-500 dark:text-[#64748B] font-normal">/100</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#0D9488] dark:text-[#14B8A6] font-semibold mt-0.5">
                          ↑{skill.growth}% (60d)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-[#151B26] rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#3B82F6]"
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>

                    {/* Evidence Metrics */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] rounded-xl mb-3 text-center">
                      <div>
                        <span className="block font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {skill.projectsCount}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-[#64748B] uppercase">Projects</span>
                      </div>
                      <div>
                        <span className="block font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {skill.commitsCount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-[#64748B] uppercase">Commits</span>
                      </div>
                      <div>
                        <span className="block font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {skill.contributionsCount}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-[#64748B] uppercase">PRs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs">
                    <span className="text-[11px] text-[#6366F1] font-medium group-hover:underline">
                      View AST Evidence &rarr;
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-[#94A3B8]">
                      {skill.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skill Detail Modal */}
          {selectedSkill && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.12] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#6366F1]">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">{selectedSkill.name}</h2>
                      <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-[#94A3B8]">{selectedSkill.category} &bull; {selectedSkill.level}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[10px] uppercase text-slate-500 dark:text-[#64748B] block">Score</span>
                    <span className="font-mono text-lg font-bold text-[#0D9488] dark:text-[#14B8A6]">{selectedSkill.score}/100</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[10px] uppercase text-slate-500 dark:text-[#64748B] block">Verified Commits</span>
                    <span className="font-mono text-lg font-bold text-[#3B82F6]">{selectedSkill.commitsCount.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[10px] uppercase text-slate-500 dark:text-[#64748B] block">Growth</span>
                    <span className="font-mono text-lg font-bold text-[#6366F1]">↑{selectedSkill.growth}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block mb-2">
                    AST Code Quality Evidence
                  </span>
                  <p className="text-xs text-slate-700 dark:text-[#94A3B8] p-3 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] leading-relaxed">
                    {selectedSkill.evidence}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B] block mb-2">
                    Related Skills in Co-Occurrence Graph
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkill.relatedSkills.map((rs, i) => (
                      <SkillChip key={i} name={rs} size="sm" verified={false} />
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#151B26] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href={`/projects`}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366F1] hover:bg-[#4F46E5] text-white transition-colors shadow-sm"
                  >
                    View Backing Repositories
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
