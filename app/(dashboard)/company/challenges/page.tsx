'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Trophy,
  Plus,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Building2,
  Eye
} from 'lucide-react';
import { ChallengeItem, ChallengeType, ChallengeDifficulty } from '@/types/challenge';

export default function CompanyChallengesManagementPage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('coding');
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>('Intermediate');
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('TypeScript, Redis');
  const [prizePool, setPrizePool] = useState('$2,000 Bounty');
  const [isHiring, setIsHiring] = useState(true);

  async function loadChallenges() {
    try {
      const res = await fetch('/api/challenges').then(r => r.json());
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
    loadChallenges();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const requiredSkills = requiredSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          difficulty,
          requiredSkills,
          prizePool,
          isHiringOpportunity: isHiring,
        }),
      }).then(r => r.json());

      if (res.success && res.challenge) {
        setChallenges(prev => [res.challenge, ...prev]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create challenge:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Company Verification Competitions
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25">
                  Recruiter Workspace
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Evaluate engineering candidates by hosting real technical problem challenges backed by automated AST code verification.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold shadow-lg shadow-[#F59E0B]/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Competition</span>
            </button>
          </div>

          {/* Challenges List */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Hosted Competitions ({challenges.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 dark:text-[#64748B]">
                Loading company competitions...
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ch.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 dark:bg-[#111722] text-[#F59E0B] border border-[#F59E0B]/20 uppercase">
                          {ch.difficulty}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
                          {ch.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#64748B]">
                        <span>Prize: {ch.prizePool || 'None'}</span>
                        <span>•</span>
                        <span>{ch.participantsCount} Participants</span>
                        <span>•</span>
                        <span>{ch.submissionsCount} Submissions Audited</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/challenges/${ch.id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-semibold text-sky-600 dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Leaderboard</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#F59E0B]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Capability Challenge</h3>
                  </div>
                </div>

                <form onSubmit={handleCreateChallenge} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Challenge Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Distributed Consensus Engine"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Problem Statement & Deliverables *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Specify the functional requirements, expected AST performance, and unit test criteria..."
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Challenge Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ChallengeType)}
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="coding">Coding</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="devops">DevOps</option>
                        <option value="ai_ml">AI / ML</option>
                        <option value="full_project">Full Project</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as ChallengeDifficulty)}
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Required Skills (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={requiredSkillsStr}
                      onChange={(e) => setRequiredSkillsStr(e.target.value)}
                      placeholder="e.g. TypeScript, Redis, Docker"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Prize / Bounty Pool
                      </label>
                      <input
                        type="text"
                        value={prizePool}
                        onChange={(e) => setPrizePool(e.target.value)}
                        placeholder="e.g. $2,500 Bounty"
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="hiringCheck"
                        checked={isHiring}
                        onChange={(e) => setIsHiring(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-100 dark:bg-[#111722] border-slate-300 dark:border-white/[0.2] accent-[#F59E0B]"
                      />
                      <label htmlFor="hiringCheck" className="text-[11px] font-semibold text-slate-800 dark:text-white cursor-pointer">
                        Hiring Opportunity
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black text-xs font-bold shadow-lg shadow-[#F59E0B]/25"
                    >
                      {creating ? 'Publishing...' : 'Publish Competition'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
