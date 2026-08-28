'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import DeveloperDiscoveryCard from '@/components/discovery/DeveloperDiscoveryCard';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Search, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users
} from 'lucide-react';
import { DeveloperSearchResult, DeveloperSortOption } from '@/types/discovery';

const QUICK_SKILL_PILLS = [
  'All',
  'TypeScript',
  'React',
  'Next.js',
  'Python',
  'Rust',
  'PostgreSQL',
  'Docker',
  'FastAPI',
  'AI & ML',
];

function DevelopersDiscoveryContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';
  const initialSkill = searchParams?.get('skill') || 'All';

  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [selectedSkill, setSelectedSkill] = useState(initialSkill);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedMinProjects, setSelectedMinProjects] = useState<number>(0);
  const [selectedSort, setSelectedSort] = useState<DeveloperSortOption>('relevance');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<DeveloperSearchResult | null>(null);

  // Load user session profile for navigation header
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  // Update query state if search params change externally
  useEffect(() => {
    if (initialQ && initialQ !== searchQuery) {
      setSearchQuery(initialQ);
      setDebouncedQuery(initialQ);
    }
    if (initialSkill && initialSkill !== selectedSkill) {
      setSelectedSkill(initialSkill);
    }
  }, [initialQ, initialSkill]);

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Execute Search API call
  const fetchDevelopers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
      if (selectedSkill !== 'All') params.set('skill', selectedSkill);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedLevel !== 'all') params.set('level', selectedLevel);
      if (selectedMinProjects > 0) params.set('minProjects', selectedMinProjects.toString());
      if (selectedSort !== 'relevance') params.set('sort', selectedSort);
      params.set('page', currentPage.toString());
      params.set('limit', '12');

      const response = await fetch(`/api/developers/search?${params.toString()}`);
      const json = await response.json();

      if (json.success) {
        setSearchData(json.data);
      } else {
        setError(json.error || 'Failed to search developers.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while contacting the discovery engine.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedSkill, selectedStatus, selectedLevel, selectedMinProjects, selectedSort, currentPage]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedSkill('All');
    setSelectedStatus('all');
    setSelectedLevel('all');
    setSelectedMinProjects(0);
    setSelectedSort('relevance');
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    searchQuery.trim().length > 0 ||
    selectedSkill !== 'All' ||
    selectedStatus !== 'all' ||
    selectedLevel !== 'all' ||
    selectedMinProjects > 0 ||
    selectedSort !== 'relevance';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Discover Developers" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#0D121A] to-[#111722] border border-white/[0.08] p-6 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="space-y-1.5 z-10">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#C4B5FD] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                Proof-of-Skill Discovery Engine
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
                Discover Verified Developers
              </h1>
              <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
                Find developers through verified Developer Capability Cards (DCCs), AST codebase review benchmarks, and verifiable git audit trails—not unverified resume keywords.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 z-10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-mono text-[#64748B]">VERIFICATION PIPELINE</div>
                <div className="text-xs font-bold text-[#10B981] flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-4 h-4" /> 100% Cryptographic Proof
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-0 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Search & Quick Skill Filter Bar */}
          <div className="space-y-3">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by skill, developer name, username, or technology (e.g. React, TypeScript, Rust)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D121A] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#7C3AED]/60 rounded-xl pl-10 pr-10 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white p-1 rounded-md transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Skill Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_SKILL_PILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    setSelectedSkill(skill);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedSkill === skill
                      ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30'
                      : 'bg-[#0D121A] text-[#94A3B8] hover:text-white hover:bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D121A] border border-white/[0.08] p-3.5 rounded-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Verification Tier */}
              <div className="flex items-center gap-1 bg-[#111722] border border-white/[0.08] rounded-lg px-2.5 py-1">
                <span className="text-[11px] text-[#64748B] font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-[#F8FAFC] outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#111722] text-[#F8FAFC]">All Statuses</option>
                  <option value="verified" className="bg-[#111722] text-[#F8FAFC]">Verified Only</option>
                  <option value="supported" className="bg-[#111722] text-[#F8FAFC]">Supported</option>
                  <option value="detected" className="bg-[#111722] text-[#F8FAFC]">Detected</option>
                </select>
              </div>

              {/* Capability Level */}
              <div className="flex items-center gap-1 bg-[#111722] border border-white/[0.08] rounded-lg px-2.5 py-1">
                <span className="text-[11px] text-[#64748B] font-medium">Level:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-[#F8FAFC] outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#111722] text-[#F8FAFC]">All Levels</option>
                  <option value="Elite" className="bg-[#111722] text-[#F8FAFC]">Elite (920+)</option>
                  <option value="Expert" className="bg-[#111722] text-[#F8FAFC]">Expert (800+)</option>
                  <option value="Advanced" className="bg-[#111722] text-[#F8FAFC]">Advanced (650+)</option>
                  <option value="Professional" className="bg-[#111722] text-[#F8FAFC]">Professional (500+)</option>
                  <option value="Creator" className="bg-[#111722] text-[#F8FAFC]">Creator (300+)</option>
                  <option value="Builder" className="bg-[#111722] text-[#F8FAFC]">Builder (150+)</option>
                </select>
              </div>

              {/* Min Projects */}
              <div className="flex items-center gap-1 bg-[#111722] border border-white/[0.08] rounded-lg px-2.5 py-1">
                <span className="text-[11px] text-[#64748B] font-medium">Projects:</span>
                <select
                  value={selectedMinProjects}
                  onChange={(e) => {
                    setSelectedMinProjects(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-[#F8FAFC] outline-none cursor-pointer pr-1"
                >
                  <option value={0} className="bg-[#111722] text-[#F8FAFC]">Any Count</option>
                  <option value={1} className="bg-[#111722] text-[#F8FAFC]">1+ Analyzed</option>
                  <option value={3} className="bg-[#111722] text-[#F8FAFC]">3+ Analyzed</option>
                  <option value={5} className="bg-[#111722] text-[#F8FAFC]">5+ Analyzed</option>
                </select>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[11px] text-[#64748B] font-medium">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as DeveloperSortOption)}
                className="bg-[#111722] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] outline-none cursor-pointer"
              >
                <option value="relevance" className="bg-[#111722] text-[#F8FAFC]">Relevance</option>
                <option value="verified_skills" className="bg-[#111722] text-[#F8FAFC]">Most Verified Skills</option>
                <option value="score" className="bg-[#111722] text-[#F8FAFC]">Capability Score</option>
                <option value="projects" className="bg-[#111722] text-[#F8FAFC]">Analyzed Projects</option>
                <option value="recent" className="bg-[#111722] text-[#F8FAFC]">Recently Active</option>
              </select>
            </div>
          </div>

          {/* Results Count & Telemetry Benchmark */}
          <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
            <div>
              {loading ? (
                <span>Searching verified developers...</span>
              ) : (
                <span>
                  Found <strong className="text-white">{searchData?.pagination.totalCount || 0}</strong> verified {searchData?.pagination.totalCount === 1 ? 'developer' : 'developers'}
                  {searchData?.meta?.tookMs !== undefined && (
                    <span className="text-[#64748B] ml-1.5 font-mono">({searchData.meta.tookMs}ms)</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#0D121A] border border-white/[0.06] rounded-2xl p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/[0.05]" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-4 bg-white/[0.08] rounded" />
                        <div className="w-20 h-3 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                    <div className="w-16 h-5 bg-white/[0.06] rounded-full" />
                  </div>
                  <div className="w-full h-10 bg-white/[0.04] rounded" />
                  <div className="flex gap-2">
                    <div className="w-20 h-6 bg-white/[0.06] rounded" />
                    <div className="w-20 h-6 bg-white/[0.06] rounded" />
                  </div>
                  <div className="w-full h-8 bg-white/[0.04] rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-[#0D121A] border border-[#EF4444]/20 rounded-2xl space-y-3">
              <p className="text-sm text-[#EF4444] font-medium">{error}</p>
              <button
                onClick={fetchDevelopers}
                className="px-4 py-2 bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] rounded-lg text-xs font-semibold text-white transition-colors"
              >
                Retry Search
              </button>
            </div>
          ) : searchData?.developers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No developers found matching this capability"
              description="Try broadening your search query or removing filter constraints."
              action={{ label: 'Clear Filters', onClick: handleResetFilters }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchData?.developers.map((dev) => (
                <DeveloperDiscoveryCard key={dev.id} developer={dev} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {searchData && searchData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <span className="text-xs text-[#64748B] font-mono">
                Page {searchData.pagination.page} of {searchData.pagination.totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(searchData.pagination.totalPages, prev + 1))}
                  disabled={currentPage >= searchData.pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function DevelopersDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center">
          <div className="text-xs text-[#94A3B8] font-mono animate-pulse">
            Loading Developer Discovery Engine...
          </div>
        </div>
      }
    >
      <DevelopersDiscoveryContent />
    </Suspense>
  );
}
