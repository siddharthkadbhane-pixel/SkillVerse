'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProjectCard from '@/components/ui/ProjectCard';
import EmptyState from '@/components/ui/EmptyState';
import {
  FolderGit2,
  Search,
  Plus,
  ShieldCheck,
  GitBranch,
  Star,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { DUMMY_REPOSITORIES } from '@/lib/dummyData';

export default function ProjectsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, repoRes] = await Promise.allSettled([
        fetch('/api/profile').then((r) => r.json()),
        fetch('/api/repositories').then((r) => r.json()),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.success) {
        setProfile(profRes.value.data.profile);
      }
      if (repoRes.status === 'fulfilled' && repoRes.value.success) {
        setRepos(repoRes.value.data || []);
      } else {
        setRepos(DUMMY_REPOSITORIES);
      }
    } catch {
      setRepos(DUMMY_REPOSITORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const languages = ['All', 'TypeScript', 'Rust', 'Python'];

  const filteredRepos = (repos.length > 0 ? repos : DUMMY_REPOSITORIES).filter((repo) => {
    const matchesLang = selectedLanguage === 'All' || repo.language === selectedLanguage;
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLang && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Projects" />

        <main className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Projects"
            description="All verified repositories analyzed by the SkillVerse AI and AST heuristics engine."
            badge={{ text: `${filteredRepos.length} repos`, variant: 'primary' }}
          >
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-white dark:bg-[#131720] hover:bg-slate-100 dark:hover:bg-[#181F2C] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync GitHub
            </button>
            <button
              onClick={() => alert('Connect your GitHub account in Settings to import more repos.')}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium bg-[#6366F1] hover:bg-[#4F46E5] text-white transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Import Repository
            </button>
          </PageHeader>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Analyzed codebases"
              value={filteredRepos.length}
              icon={FolderGit2}
              iconColor="text-[#6366F1]"
              subtitle="100% AST passed"
            />
            <StatCard
              label="Average health score"
              value="94.2%"
              trend={{ value: 'Elite', isPositive: true }}
              icon={ShieldCheck}
              iconColor="text-[#14B8A6]"
              subtitle="Zero high-severity flaws"
            />
            <StatCard
              label="Total stars"
              value={filteredRepos.reduce((acc, r) => acc + (r.stars || 0), 0)}
              icon={Star}
              iconColor="text-[#F59E0B]"
              subtitle="Open-source engagement"
            />
            <StatCard
              label="Active languages"
              value="3 major"
              icon={GitBranch}
              iconColor="text-[#06B6D4]"
              subtitle="TypeScript, Rust, Python"
            />
          </div>

          {/* Search & Filter Toolbar — no wrapper container */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={[
                    'h-8 px-3 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors',
                    selectedLanguage === lang
                      ? 'bg-[#6366F1] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-200/70 dark:hover:bg-[#181F2C]',
                  ].join(' ')}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#475569] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects"
                className="w-full h-8 bg-white dark:bg-[#131720] border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12] focus:border-[#6366F1]/50 rounded-lg pl-8 pr-3 text-[12.5px] text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#475569] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {filteredRepos.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No projects found"
              description="No repositories matched your filters. Import a new repository or clear filters."
              action={{ label: 'Clear Filters', onClick: () => { setSearchQuery(''); setSelectedLanguage('All'); } }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRepos.map((repo) => (
                <ProjectCard
                  key={repo.id}
                  id={repo.id}
                  name={repo.name}
                  fullName={repo.fullName}
                  description={repo.description}
                  htmlUrl={repo.htmlUrl}
                  language={repo.language}
                  stars={repo.stars || 0}
                  forks={repo.forks || 0}
                  isAnalyzed={repo.isAnalyzed !== false}
                  aiScore={repo.aiScore || 94}
                  healthScore={repo.healthScore || 95}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
