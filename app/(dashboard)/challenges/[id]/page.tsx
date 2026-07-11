'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Award, Clock, Gift, Users, ShieldCheck, Sparkles, BookOpen, AlertCircle, 
  ArrowLeft, Send, CheckCircle2, Trophy, Loader2, Info
} from 'lucide-react';
import Link from 'next/link';

interface ChallengeDetails {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  technologies: string[];
  timeLimit: string;
  maxParticipants: number;
  reward: string;
}

interface LeaderboardItem {
  rank: number;
  developerName: string;
  username: string;
  score: number;
  date: string;
}

export default function ChallengeDetailsPage({ params }: { params: any }) {
  const unwrappedParams = React.use<{ id: string }>(params);
  const id = unwrappedParams.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Profile
      const profRes = await fetch('/api/profile');
      const profJson = await profRes.json();
      if (profJson.success) {
        setProfile(profJson.data);
      }

      // Load Challenge Details
      const chalRes = await fetch(`/api/challenges/${id}`);
      const chalJson = await chalRes.json();
      if (chalJson.success) {
        setChallenge(chalJson.data);
      } else {
        setError(chalJson.error || 'Failed to load challenge details.');
      }

      // Load Leaderboard
      const leadRes = await fetch(`/api/challenges/${id}/leaderboard`);
      const leadJson = await leadRes.json();
      if (leadJson.success) {
        setLeaderboard(leadJson.data);
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryUrl: repoUrl }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmissionSuccess(json.data);
        
        // Refresh leaderboard to see if developer ranked
        const leadRes = await fetch(`/api/challenges/${id}/leaderboard`);
        const leadJson = await leadRes.json();
        if (leadJson.success) setLeaderboard(leadJson.data);
      } else {
        setError(json.error || 'Submission failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !challenge) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
        <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-zinc-500 text-sm font-semibold tracking-wide">Syncing challenge environment...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Back button */}
            <div className="flex items-center">
              <Link 
                href="/challenges"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Challenges
              </Link>
            </div>

            {/* Title card */}
            <div className="glass-card rounded-xl p-6 flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full uppercase">
                  {challenge.difficulty}
                </span>
                
                <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {challenge.timeLimit} Limit
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{challenge.title}</h1>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1 max-w-3xl">{challenge.description}</p>

              <div className="flex flex-wrap gap-3.5 mt-3 border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-400">
                <span className="text-violet-400 flex items-center gap-1">
                  <Gift className="h-4 w-4" /> Reward: {challenge.reward}
                </span>
                <span>•</span>
                <span>Max Participants: {challenge.maxParticipants}</span>
              </div>
            </div>

            {/* Split layout (Submission Portal + Leaderboard) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Submission Portal */}
              <div className="glass-card rounded-xl p-6 lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-violet-400" />
                  Submission Portal
                </h3>

                {submissionSuccess ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 text-center bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-6">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                    <div>
                      <h4 className="font-extrabold text-white text-base">Evaluation Completed!</h4>
                      <p className="text-zinc-400 text-xs mt-1">AI reviewed your submission successfully.</p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-2xl font-black text-violet-400 mt-2">
                      <span>{submissionSuccess.score}</span>
                      <span className="text-zinc-500 text-xs font-semibold">/100</span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mt-1">
                      Your Skill DNA proficiency levels and Trust Score have been boosted.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-zinc-400 font-semibold">Paste GitHub Repository URL</label>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/username/repo-name"
                        value={repoUrl}
                        onChange={e => setRepoUrl(e.target.value)}
                        className="bg-zinc-900 border border-zinc-805 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-zinc-600 font-medium"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-lg leading-normal">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-97 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          AI Evaluator reviewing code...
                        </>
                      ) : (
                        'Submit Repository for Verification'
                      )}
                    </button>

                    <span className="text-[10px] text-zinc-500 leading-normal flex items-start gap-1">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      Our AI review engine automatically clones the submission repository, calculates complexity, evaluates security practices, and validates architectures.
                    </span>
                  </form>
                )}
              </div>

              {/* Leaderboard */}
              <div className="glass-card rounded-xl p-6 lg:col-span-1 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-violet-400" />
                  Challenge Leaderboard
                </h3>

                <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto">
                  {leaderboard.map((item) => (
                    <div key={item.rank} className="flex items-center justify-between py-2 border-b border-zinc-900/50 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`h-5 w-5 shrink-0 rounded-full font-bold text-[10px] flex items-center justify-center border ${
                          item.rank === 1 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                          item.rank === 2 ? 'bg-zinc-300/10 border-zinc-300/30 text-zinc-300' :
                          'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {item.rank}
                        </span>
                        
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-zinc-200">{item.developerName}</span>
                          <span className="text-[9px] text-zinc-500">@{item.username}</span>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded">
                        {item.score} / 100
                      </span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <span className="text-xs text-zinc-600 pl-0.5">No submissions evaluated yet.</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
