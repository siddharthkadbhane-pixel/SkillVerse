'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Filter,
  Building2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowRight,
  Code2,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { OpportunityItem, OpportunityType, WorkplaceType } from '@/types/opportunity';

export default function OpportunityDiscoveryPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [workplaceFilter, setWorkplaceFilter] = useState<string>('all');
  const [capabilityFilter, setCapabilityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (workplaceFilter !== 'all') params.set('workplaceType', workplaceFilter);
      if (capabilityFilter !== 'all') params.set('capability', capabilityFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setOpportunities(res.data);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpportunities();
  }, [typeFilter, workplaceFilter, capabilityFilter]);

  const handleToggleSave = async (e: React.MouseEvent, opp: OpportunityItem) => {
    e.preventDefault();
    e.stopPropagation();

    const isSaved = opp.isSaved;
    setOpportunities(prev =>
      prev.map(o => o.id === opp.id ? { ...o, isSaved: !isSaved } : o)
    );

    if (isSaved) {
      await fetch(`/api/jobs/${opp.id}/save`, { method: 'DELETE' });
    } else {
      await fetch(`/api/jobs/${opp.id}/save`, { method: 'POST' });
    }
  };

  const typeOptions = [
    { label: 'All Opportunities', value: 'all' },
    { label: 'Full-time', value: 'full_time' },
    { label: 'Internship', value: 'internship' },
    { label: 'Contract', value: 'contract' },
    { label: 'Freelance', value: 'freelance' },
    { label: 'Project', value: 'project' },
  ];

  const capabilityOptions = [
    'All Capabilities',
    'Frontend Engineering',
    'Backend Engineering',
    'Full-Stack Development',
    'Database Engineering',
    'DevOps & Infrastructure',
  ];

  return (
    <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#38BDF8]" />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Verified Engineering Opportunities
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25">
                  DCC 2.0 Matched
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Opportunities matched transparently against your verified AST code reviews, capability areas, and project proofs.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#0D121A] border border-white/[0.08] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchOpportunities();
                  }}
                  placeholder="Search by title, required technology, or company name..."
                  className="w-full bg-[#111722] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] transition-colors"
                />
              </div>

              <button
                onClick={fetchOpportunities}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-black text-xs font-bold transition-all shadow-md shadow-[#38BDF8]/20"
              >
                Find Roles
              </button>
            </div>

            {/* Type & Capability Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors shrink-0 ${
                      typeFilter === opt.value
                        ? 'bg-[#38BDF8] text-black font-bold'
                        : 'bg-[#111722] text-[#94A3B8] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={capabilityFilter}
                  onChange={(e) => setCapabilityFilter(e.target.value === 'All Capabilities' ? 'all' : e.target.value)}
                  className="bg-[#111722] border border-white/[0.08] text-white text-[11px] font-mono rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {capabilityOptions.map(cap => (
                    <option key={cap} value={cap}>{cap}</option>
                  ))}
                </select>

                <select
                  value={workplaceFilter}
                  onChange={(e) => setWorkplaceFilter(e.target.value)}
                  className="bg-[#111722] border border-white/[0.08] text-white text-[11px] font-mono rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">All Locations</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opportunities List */}
          {loading ? (
            <div className="text-center py-20 text-xs text-[#64748B]">
              Matching opportunities against your Developer Capability Card...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
              <Briefcase className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-white">No opportunities matched your criteria</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Try expanding your search filters or exploring all opportunity types.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => {
                const match = opp.matchEvaluation;
                const matchBadgeColor =
                  match?.matchTier === 'Strong Match'
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : match?.matchTier === 'Good Match'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                    : match?.matchTier === 'Moderate Match'
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                    : 'bg-[#64748B]/15 text-[#94A3B8] border-[#64748B]/30';

                return (
                  <div
                    key={opp.id}
                    className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-6 transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left Company & Title */}
                      <div className="flex items-start gap-4">
                        <img
                          src={opp.company.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                          alt={opp.company.name}
                          className="w-12 h-12 rounded-xl border border-white/[0.1] shrink-0 object-cover"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-white leading-snug">
                              {opp.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#94A3B8] border border-white/[0.06] uppercase">
                              {opp.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#38BDF8] border border-[#38BDF8]/20">
                              {opp.workplaceType}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8]">
                            <span className="font-semibold text-[#F8FAFC]">{opp.company.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {opp.location}
                            </span>
                            {opp.salaryRange && (
                              <>
                                <span>•</span>
                                <span className="text-[#34D399] font-mono font-semibold">
                                  {opp.salaryRange}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Match Badge & Save */}
                      <div className="flex items-center md:flex-col md:items-end gap-2 shrink-0">
                        {match && (
                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${matchBadgeColor}`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{match.matchTier} ({match.matchPercentage}%)</span>
                          </div>
                        )}

                        <button
                          onClick={(e) => handleToggleSave(e, opp)}
                          className="p-2 rounded-xl bg-[#111722] border border-white/[0.08] hover:border-white/[0.15] text-[#94A3B8] hover:text-white transition-colors"
                          title={opp.isSaved ? 'Remove from saved' : 'Save opportunity'}
                        >
                          {opp.isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-[#38BDF8]" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                      {opp.description}
                    </p>

                    {/* Transparent Match Reason Callout */}
                    {match && (
                      <div className="bg-[#111722] border border-white/[0.06] p-3 rounded-xl flex items-start gap-2 text-[11px] text-[#94A3B8]">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <strong className="text-white">DCC Match Analysis: </strong>
                          {match.whyExplanation}
                        </div>
                      </div>
                    )}

                    {/* Bottom Requirements & Action */}
                    <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mr-1">
                          Required:
                        </span>
                        {opp.requiredSkills.map(sk => (
                          <span
                            key={sk}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#070A0F] border border-white/[0.06] text-[#E2E8F0]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opp.hasApplied ? (
                          <span className="text-xs font-mono font-bold text-[#10B981] px-3 py-1.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25">
                            ✓ Applied ({opp.userApplicationStatus || 'applied'})
                          </span>
                        ) : null}

                        <Link
                          href={`/jobs/${opp.id}`}
                          className="px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-[#38BDF8]/20"
                        >
                          <span>View Details & Apply</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
