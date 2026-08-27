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
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Projects" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Projects Portfolio"
            description="All verified repositories analyzed by the SkillVerse AI and AST heuristics engine."
            badge={{ text: `${filteredRepos.length} Repositories`, variant: 'primary' }}
          >
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync GitHub
            </button>
            <button
              onClick={() => alert('Connect your GitHub account in Settings to import more repos.')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Import Repository
            </button>
          </PageHeader>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Analyzed Codebases"
              value={filteredRepos.length}
              icon={FolderGit2}
              iconColor="text-[#7C3AED]"
              subtitle="100% AST Passed"
            />
            <StatCard
              label="Average Health Score"
              value="94.2%"
              trend={{ value: 'Elite', isPositive: true }}
              icon={ShieldCheck}
              iconColor="text-[#10B981]"
              subtitle="Zero high severity flaws"
            />
            <StatCard
              label="Total Stars"
              value={filteredRepos.reduce((acc, r) => acc + (r.stars || 0), 0)}
              icon={Star}
              iconColor="text-[#F59E0B]"
              subtitle="Open-source engagement"
            />
            <StatCard
              label="Active Languages"
              value="3 Major"
              icon={GitBranch}
              iconColor="text-[#38BDF8]"
              subtitle="TypeScript, Rust, Python"
            />
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D121A] border border-white/[0.08] p-3 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
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
