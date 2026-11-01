'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import {
  Building2,
  Users,
  Search,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Code2,
  FileText,
  ArrowLeftRight
} from 'lucide-react';
import { CompanyProfile, SavedDeveloperItem, RecentlyViewedDeveloperItem } from '@/types/company';

export default function CompanyOverviewPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [savedDevelopers, setSavedDevelopers] = useState<SavedDeveloperItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedDeveloperItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const [compRes, savedRes, recentRes] = await Promise.all([
          fetch('/api/company').then(r => r.json()),
          fetch('/api/company/saved').then(r => r.json()),
          fetch('/api/company/recent').then(r => r.json()),
        ]);

        if (compRes.success && compRes.data?.profile) {
          setProfile(compRes.data.profile);
        }
        if (savedRes.success && Array.isArray(savedRes.data)) {
          setSavedDevelopers(savedRes.data);
        }
        if (recentRes.success && Array.isArray(recentRes.data)) {
          setRecentlyViewed(recentRes.data);
        }
      } catch (err) {
        console.error('Failed to load company workspace:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 max-w-[1400px] w-full mx-auto">
          {/* Workspace Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 dark:from-[#7C3AED]/20 dark:to-[#38BDF8]/20 border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-sky-600 dark:text-[#38BDF8]">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {profile?.name || 'Acme Engineering Labs'}
                  </h1>
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Workspace
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 line-clamp-1 max-w-xl">
                  {profile?.description || 'Building high-performance distributed systems and developer tools.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/company/developers"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Verified Talent</span>
              </Link>
            </div>
          </div>

          {/* Key Workspace Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Saved Talent"
              value={savedDevelopers.length.toString()}
              subtitle="Shortlisted candidates"
              icon={Bookmark}
              iconColor="text-[#7C3AED]"
              trend={{ value: 'Active', isPositive: true }}
            />
            <StatCard
              label="Recently Evaluated"
              value={recentlyViewed.length.toString()}
              subtitle="Profiles reviewed"
              icon={Clock}
              iconColor="text-[#38BDF8]"
            />
            <StatCard
              label="Team Recruiters"
              value="2"
              subtitle="Active members"
              icon={Users}
              iconColor="text-[#10B981]"
              trend={{ value: 'Online', isPositive: true }}
            />
            <StatCard
              label="Verification Status"
              value="Verified"
              subtitle="Enterprise tier"
              icon={ShieldCheck}
              iconColor="text-[#10B981]"
              trend={{ value: 'Active', isPositive: true }}
            />
          </div>

          {/* Quick Talent Search & Discovery Gateway */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Discover Candidates via Verified DCCs
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Search public developers by verified engineering skills, capability tiers, and AST codebase audits.
                </p>
              </div>
              <Link
                href="/company/developers"
                className="text-xs font-semibold text-sky-600 dark:text-[#38BDF8] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Advanced Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/company/developers?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                placeholder="Search by skill (e.g. TypeScript, Rust, Next.js) or capability (e.g. Backend Engineering)..."
                className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-11 pr-28 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-indigo-500 dark:focus:border-[#7C3AED] transition-colors"
              />
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.location.href = `/company/developers?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Two-Column Grid: Saved Candidates & Recently Viewed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Saved Developers */}
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-600 dark:text-[#7C3AED]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Shortlisted Talent ({savedDevelopers.length})
                  </h3>
                </div>
                <Link
                  href="/company/saved"
                  className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  View All
                </Link>
              </div>

              {savedDevelopers.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 dark:text-[#64748B] border border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl">
                  No saved developers yet. Search and shortlist developers to track them here.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDevelopers.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] p-4 rounded-xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.developer?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={item.developer?.name || item.developer?.username}
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/[0.1] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.developer?.name || item.developer?.username}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-[#7C3AED]/20 text-indigo-700 dark:text-[#C4B5FD]">
                              {item.developer?.dccLevel || 'Expert'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-[#64748B] truncate">
                            {item.developer?.topVerifiedSkills?.slice(0, 3).map(s => s.name).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/developer/${item.developer?.username}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-sky-600 dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.06] transition-colors"
                          title="View Verified DCC"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Recently Viewed */}
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600 dark:text-[#38BDF8]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recently Evaluated
                  </h3>
                </div>
                <Link
                  href="/company/developers"
                  className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Explore More
                </Link>
              </div>

              {recentlyViewed.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 dark:text-[#64748B] border border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl">
                  No recently viewed profiles.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentlyViewed.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] p-4 rounded-xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.developer?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={item.developer?.name || item.developer?.username}
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/[0.1] shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.developer?.name || item.developer?.username}
                          </h4>
                          <span className="text-[10px] font-mono text-[#10B981]">
                            ✓ {item.developer?.dccLevel || 'Expert'} • {item.developer?.topVerifiedSkills?.length || 4} verified skills
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/developer/${item.developer?.username}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.06] transition-colors"
                        >
                          View DCC
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/company/compare"
              className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-[#7C3AED]/50 flex items-center gap-3 transition-all shadow-sm"
            >
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-[#7C3AED]/10 text-indigo-600 dark:text-[#7C3AED]">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Compare Candidates</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Side-by-side DCC 2.0 evaluation</p>
              </div>
            </Link>

            <Link
              href="/company/members"
              className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-sky-400 dark:hover:border-[#38BDF8]/50 flex items-center gap-3 transition-all shadow-sm"
            >
              <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-[#38BDF8]/10 text-sky-600 dark:text-[#38BDF8]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Manage Recruiters</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Invite team members</p>
              </div>
            </Link>

            <Link
              href="/company/profile"
              className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-400 dark:hover:border-[#10B981]/50 flex items-center gap-3 transition-all shadow-sm"
            >
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Company Profile</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Workspace verification status</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
