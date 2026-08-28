'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Trophy,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Github,
  Send,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Code2,
  Layers,
  Award,
  AlertCircle
} from 'lucide-react';
import { ChallengeItem, ChallengeLeaderboardEntry } from '@/types/challenge';

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [challenge, setChallenge] = useState<ChallengeItem | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  async function loadData() {
    try {
      const [chRes, lbRes] = await Promise.all([
        fetch(`/api/challenges/${id}`).then(r => r.json()),
        fetch(`/api/challenges/${id}/leaderboard`).then(r => r.json()),
      ]);

      if (chRes.success && chRes.data) setChallenge(chRes.data);
      if (lbRes.success && Array.isArray(lbRes.data)) setLeaderboard(lbRes.data);
    } catch (err) {
      console.error('Failed to load challenge details:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleJoin = async () => {
    if (!challenge) return;
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/join`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setChallenge(prev => prev ? { ...prev, hasJoined: true, participantsCount: prev.participantsCount + 1 } : null);
        setFeedback({ success: true, message: 'You have registered for the challenge!' });
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to register for challenge.' });
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryUrl: repoUrl,
          liveDemoUrl: demoUrl,
          description: notes,
        }),
      }).then(r => r.json());

      if (res.success && res.data) {
        setChallenge(prev => prev ? { ...prev, userSubmission: res.data } : null);
        setFeedback({ success: true, message: res.message });
        // Refresh leaderboard
        fetch(`/api/challenges/${id}/leaderboard`).then(r => r.json()).then(json => {
          if (json.success) setLeaderboard(json.data);
        });
      } else {
        setFeedback({ success: false, message: res.error || 'Submission failed.' });
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Network error submitting solution.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-[#64748B]">
          Loading competition specifications...
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <h3 className="text-sm font-bold text-white">Challenge Not Found</h3>
          <Link href="/challenges" className="text-xs text-[#F59E0B] underline">
            Return to Challenges
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1300px] w-full mx-auto">
          <div>
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Challenges</span>
            </Link>
          </div>

          {/* Banner Header */}
          <div className="bg-[#0D121A] border border-white/[0.08] p-6 sm:p-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={challenge.organizer.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                alt={challenge.organizer.name}
                className="w-14 h-14 rounded-2xl border border-white/[0.1] object-cover shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {challenge.title}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25 uppercase">
                    {challenge.difficulty}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
                    {challenge.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8]">
                  <span className="font-semibold text-white">{challenge.organizer.name}</span>
                  <span>•</span>
                  <span>{challenge.participantsCount} Participants</span>
                  {challenge.prizePool && (
                    <>
                      <span>•</span>
                      <span className="text-[#10B981] font-mono font-bold">{challenge.prizePool}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {!challenge.hasJoined ? (
                <button
                  onClick={handleJoin}
                  className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold transition-all shadow-lg shadow-[#F59E0B]/25"
                >
                  Join Challenge
                </button>
              ) : (
                <span className="text-xs font-mono font-bold text-[#10B981] px-3.5 py-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Registered Participant
                </span>
              )}
            </div>
          </div>

          {feedback && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.success
                ? 'bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981]'
                : 'bg-red-500/10 border border-red-500/25 text-red-400'
            }`}>
              <Sparkles className="w-4 h-4" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Grid Layout: Challenge Specs vs Submission & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Requirements & Evaluation Weights (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Problem Description */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Challenge Overview & Objectives
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
                  {challenge.description}
                </p>
              </div>

              {/* Evaluation Weights Matrix */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Configured AST Evaluation Criteria
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Submissions are graded deterministically by analyzing repository code structure, architectural modularity, test fixtures, and documentation completeness.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase">Functionality</span>
                    <h4 className="text-base font-bold text-white">{challenge.criteriaWeights.functionality}%</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase">Code Quality</span>
                    <h4 className="text-base font-bold text-white">{challenge.criteriaWeights.codeQuality}%</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase">Architecture</span>
                    <h4 className="text-base font-bold text-white">{challenge.criteriaWeights.architecture}%</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase">Automated Tests</span>
                    <h4 className="text-base font-bold text-white">{challenge.criteriaWeights.testing}%</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase">Documentation</span>
                    <h4 className="text-base font-bold text-white">{challenge.criteriaWeights.documentation}%</h4>
                  </div>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Verified Competition Leaderboard
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Deterministic AST Ranking
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {leaderboard.map((entry) => (
                    <div key={entry.userId} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-center text-xs font-mono font-bold ${
                          entry.rank === 1 ? 'text-[#F59E0B]' : entry.rank === 2 ? 'text-[#94A3B8]' : 'text-[#78716C]'
                        }`}>
                          #{entry.rank}
                        </span>

                        <img
                          src={entry.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={entry.developerName}
                          className="w-9 h-9 rounded-full border border-white/[0.1]"
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{entry.developerName}</span>
                            {entry.teamName && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-[#38BDF8]">
                                {entry.teamName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            @{entry.username}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-[#10B981] block">
                          {entry.score} / 100
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          {entry.astQualityTier}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Submission Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <span>Submit Solution Repository</span>
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Submit your public GitHub repository. Our AST Analyzer will verify code structure and calculate your composite score in real-time.
                </p>

                <form onSubmit={handleSubmitSolution} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">
                      GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/project"
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">
                      Live Demo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder="https://project.vercel.app"
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">
                      Architecture & Implementation Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Brief notes on architectural decisions, performance tradeoffs, and testing strategy..."
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black text-xs font-bold transition-all shadow-md shadow-[#F59E0B]/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Auditing & Scoring...' : 'Submit & Trigger AST Audit'}</span>
                  </button>
                </form>

                {challenge.userSubmission?.evaluation && (
                  <div className="pt-4 border-t border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                      Your Latest Evaluation Result:
                    </span>
                    <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {challenge.userSubmission.evaluation.astQualityTier}
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          {challenge.userSubmission.evaluation.feedbackNotes}
                        </span>
                      </div>
                      <span className="text-lg font-mono font-bold text-[#10B981]">
                        {challenge.userSubmission.evaluation.compositeScore}/100
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
