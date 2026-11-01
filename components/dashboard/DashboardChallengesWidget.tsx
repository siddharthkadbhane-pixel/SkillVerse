'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ChallengeItem, ChallengeDifficulty } from '@/types/challenge';

export default function DashboardChallengesWidget() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/challenges')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load challenges');
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setChallenges(json.data);
          } else {
            setChallenges([]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to connect to challenges service');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getDifficultyBadge = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30';
      case 'Intermediate':
        return 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30';
      case 'Advanced':
        return 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/30';
      case 'Expert':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
      default:
        return 'text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-white/[0.05] dark:border-white/[0.08]';
    }
  };

  const activeChallenges = challenges.slice(0, 2);

  return (
    <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] rounded-xl p-4 sm:p-5 shadow-sm transition-all flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                Active Challenges & Competitions
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#64748B]">
                AST-verified problem solving
              </p>
            </div>
          </div>

          <Link
            href="/challenges"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
          >
            <span>All Challenges ({challenges.length})</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Content body */}
        <div className="mt-3.5 space-y-2.5">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-[#64748B] space-y-2">
              <div className="w-5 h-5 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading active engineering challenges...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-[#64748B] border border-dashed border-slate-200 dark:border-white/[0.06] rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p>{error}</p>
              <Link href="/challenges" className="text-[11px] text-[#6366F1] underline mt-1 inline-block">
                View challenge hub
              </Link>
            </div>
          ) : activeChallenges.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-[#64748B] border border-dashed border-slate-200 dark:border-white/[0.06] rounded-lg">
              <p>No active competitions at this moment.</p>
              <Link href="/challenges" className="text-[11px] text-[#6366F1] font-semibold underline mt-1 inline-block">
                Browse past challenges →
              </Link>
            </div>
          ) : (
            activeChallenges.map((ch) => (
              <Link
                key={ch.id}
                href={`/challenges/${ch.id}`}
                className="block p-3 rounded-lg bg-slate-50 dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-[#151D2A] border border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.10] transition-all group"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${getDifficultyBadge(ch.difficulty)}`}>
                        {ch.difficulty}
                      </span>
                      {ch.prizePool && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-emerald-800/40">
                          {ch.prizePool}
                        </span>
                      )}
                      {ch.isHiringOpportunity && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-800/40">
                          Hiring
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#6366F1] dark:group-hover:text-[#93C5FD] transition-colors truncate">
                      {ch.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#64748B] line-clamp-1 mt-0.5">
                      {ch.description}
                    </p>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#6366F1] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-[#64748B] mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.04] font-mono">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{ch.participantsCount} participants</span>
                  </span>
                  {ch.submissionDeadline && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Clock className="w-3 h-3" />
                      <span>Due {new Date(ch.submissionDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer link */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.04]">
        <Link
          href="/challenges"
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all"
        >
          <span>Explore All Verification Challenges</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
