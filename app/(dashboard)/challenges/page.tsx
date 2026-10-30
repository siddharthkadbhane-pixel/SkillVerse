'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
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
  Filter,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { ChallengeItem, ChallengeType, ChallengeDifficulty } from '@/types/challenge';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  async function fetchChallenges() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (diffFilter !== 'all') params.set('difficulty', diffFilter);

      const res = await fetch(`/api/challenges?${params.toString()}`).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setChallenges(res.data);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChallenges();
  }, [typeFilter, diffFilter]);

  const typeOptions = [
    { label: 'All Challenges', value: 'all' },
    { label: 'Frontend', value: 'frontend' },
    { label: 'Backend', value: 'backend' },
    { label: 'DevOps', value: 'devops' },
    { label: 'AI / ML', value: 'ai_ml' },
    { label: 'Coding', value: 'coding' },
  ];

  const diffOptions = ['all', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'expert':
        return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25';
      case 'advanced':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25';
      case 'intermediate':
        return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25';
      default:
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Verification Challenges & Competitions
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-[#F59E0B]/10 text-amber-700 dark:text-[#F59E0B] border border-amber-200 dark:border-[#F59E0B]/25">
                  AST Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Demonstrate verified capability by solving real architectural problems. Submissions are audited by our AST Code Engine.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#64748B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchChallenges(); }}
                  placeholder="Search challenges by title, technology, or problem statement..."
                  className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>

              <button
                onClick={fetchChallenges}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold transition-all shadow-md shadow-[#F59E0B]/20"
              >
                Search Challenges
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors shrink-0 ${
                      typeFilter === opt.value
                        ? 'bg-[#F59E0B] text-black font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 dark:text-[#64748B]">Difficulty:</span>
                <select
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white text-[11px] font-mono rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors"
                >
                  {diffOptions.map(d => (
                    <option key={d} value={d}>{d === 'all' ? 'All Difficulties' : d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Challenges Grid */}
          {loading ? (
            <div className="text-center py-20 text-xs text-slate-500 dark:text-[#64748B]">
              Loading verified capability challenges...
            </div>
          ) : challenges.length === 0 ? (
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <Trophy className="w-8 h-8 text-slate-400 dark:text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No challenges match your criteria</h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Try selecting a different category or clearing your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map((ch) => (
                <div
                  key={ch.id}
                  className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-6 transition-all flex flex-col justify-between space-y-5 shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Top Organizer & Difficulty */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ch.organizer.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                          alt={ch.organizer.name}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/[0.1] object-cover"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-tight">
                            {ch.organizer.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B]">
                            Verified Organizer
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyColor(ch.difficulty)}`}>
                          {ch.difficulty}
                        </span>
                        {ch.prizePool && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#10B981]/15 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-[#10B981]/25">
                            {ch.prizePool}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {ch.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                        {ch.description}
                      </p>
                    </div>

                    {/* Criteria Weights Snippet */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/80 dark:border-white/[0.04] space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
                        AST Evaluation Weights:
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-600 dark:text-[#94A3B8]">
                        <span>Func: <strong className="text-slate-900 dark:text-white">{ch.criteriaWeights.functionality}%</strong></span>
                        <span>•</span>
                        <span>Code: <strong className="text-slate-900 dark:text-white">{ch.criteriaWeights.codeQuality}%</strong></span>
                        <span>•</span>
                        <span>Arch: <strong className="text-slate-900 dark:text-white">{ch.criteriaWeights.architecture}%</strong></span>
                        <span>•</span>
                        <span>Tests: <strong className="text-slate-900 dark:text-white">{ch.criteriaWeights.testing}%</strong></span>
                      </div>
                    </div>

                    {/* Required Skills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ch.requiredSkills.map(sk => (
                        <span
                          key={sk}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#070A0F] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-[#E2E8F0]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ch.participantsCount} Joined</span>
                      </span>
                      <span>•</span>
                      <span>{ch.submissionsCount} Submissions</span>
                    </div>

                    <Link
                      href={`/challenges/${ch.id}`}
                      className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#F59E0B]/20"
                    >
                      <span>Enter Challenge</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
