'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  ArrowLeftRight,
  ShieldCheck,
  Code2,
  FolderGit2,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  Layers,
  Award
} from 'lucide-react';
import { DeveloperComparisonSummary } from '@/types/company';

export default function CandidateComparePage() {
  const [candidateUsernames, setCandidateUsernames] = useState<string[]>([
    'siddharthkadbhane-pixel',
    'alex-developer',
  ]);
  const [comparison, setComparison] = useState<DeveloperComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [addUsernameInput, setAddUsernameInput] = useState('');

  async function fetchComparison(usernames: string[]) {
    setLoading(true);
    try {
      const res = await fetch('/api/company/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames }),
      }).then(r => r.json());

      if (res.success && res.data) {
        setComparison(res.data);
      }
    } catch (err) {
      console.error('Failed to compare developers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComparison(candidateUsernames);
  }, []);

  const handleAddCandidate = () => {
    if (!addUsernameInput.trim()) return;
    const clean = addUsernameInput.trim().toLowerCase().replace('@', '');
    if (!candidateUsernames.includes(clean)) {
      const updated = [...candidateUsernames, clean].slice(0, 3);
      setCandidateUsernames(updated);
      fetchComparison(updated);
      setAddUsernameInput('');
    }
  };

  const handleRemoveCandidate = (username: string) => {
    const updated = candidateUsernames.filter(u => u !== username);
    setCandidateUsernames(updated);
    if (updated.length > 0) {
      fetchComparison(updated);
    } else {
      setComparison(null);
    }
  };

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
                <ArrowLeftRight className="w-5 h-5 text-[#38BDF8]" />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Side-by-Side Candidate Evaluation
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#38BDF8] border border-[#38BDF8]/20">
                  DCC 2.0 Benchmarks
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Objective comparison of candidate engineering capabilities, verified skills, and audited repositories.
              </p>
            </div>

            {/* Add Candidate Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={addUsernameInput}
                onChange={(e) => setAddUsernameInput(e.target.value)}
                placeholder="Enter GitHub username..."
                className="bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                onClick={handleAddCandidate}
                disabled={candidateUsernames.length >= 3}
                className="px-3.5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] disabled:opacity-50 text-black text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add ({candidateUsernames.length}/3)</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-xs text-[#64748B]">
              Compiling candidate comparison matrix...
            </div>
          ) : !comparison || comparison.candidates.length === 0 ? (
            <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
              <ArrowLeftRight className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-white">No candidates selected</h3>
              <p className="text-xs text-[#94A3B8]">
                Add at least two developer usernames above to perform a side-by-side capability comparison.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Candidates Grid Header */}
              <div className={`grid grid-cols-1 md:grid-cols-${comparison.candidates.length} gap-4`}>
                {comparison.candidates.map((cand) => (
                  <div
                    key={cand.username}
                    className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-5 space-y-4 relative"
                  >
                    <button
                      onClick={() => handleRemoveCandidate(cand.username)}
                      className="absolute top-4 right-4 p-1 rounded-lg text-[#64748B] hover:text-red-400 transition-colors"
                      title="Remove candidate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <img
                        src={cand.avatarUrl}
                        alt={cand.name}
                        className="w-12 h-12 rounded-full border border-white/[0.1]"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white">{cand.name}</h3>
                        <span className="text-xs text-[#38BDF8] font-mono">@{cand.username}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                      <div className="bg-[#111722] p-3 rounded-xl">
                        <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                          DCC Tier Level
                        </span>
                        <span className="text-sm font-bold text-[#C4B5FD] font-mono">
                          {cand.dccLevel}
                        </span>
                      </div>

                      <div className="bg-[#111722] p-3 rounded-xl">
                        <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                          AST Quality Score
                        </span>
                        <span className="text-sm font-bold text-[#10B981] font-mono">
                          {cand.overallScore} / 1000
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/developer/${cand.username}`}
                      target="_blank"
                      className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-center block text-white transition-colors"
                    >
                      View Developer Capability Card
                    </Link>
                  </div>
                ))}
              </div>

              {/* Comparison Safety Notice */}
              <div className="bg-[#131720] border border-white/[0.07] rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                <div className="text-xs text-[#94A3B8] space-y-0.5">
                  <strong className="text-white font-medium block">Dimensional Capability Evaluation</strong>
                  <p>
                    SkillVerse compares candidates across concrete engineering dimensions (Engineering Rigor, Code Quality, Architecture, Testing) rather than a single number. Different strengths align with different organizational roles.
                  </p>
                </div>
              </div>

              {/* Shared Verified Skills Comparison Matrix */}
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#10B981]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Verified Skills Comparison
                    </h3>
                  </div>
                  <span className="text-xs text-[#64748B]">
                    AST Verified Modularity & Quality
                  </span>
                </div>

                <div className="space-y-3">
                  {comparison.sharedSkills.slice(0, 8).map((skillName) => (
                    <div
                      key={skillName}
                      className="bg-[#111722] border border-white/[0.04] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-44">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span className="text-xs font-bold text-white font-mono">{skillName}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                        {comparison.candidates.map((cand) => {
                          const skillMatch = cand.topVerifiedSkills.find(
                            s => s.name.toLowerCase() === skillName.toLowerCase()
                          );
                          return (
                            <div key={cand.username} className="flex items-center gap-2">
                              <span className="text-[10px] text-[#64748B] font-mono truncate w-16">
                                @{cand.username}:
                              </span>
                              {skillMatch ? (
                                <span className="text-xs font-mono text-[#10B981] font-bold">
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="text-xs font-mono text-[#64748B]">
                                  — Unaudited
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
