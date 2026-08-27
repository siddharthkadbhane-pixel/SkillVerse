'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import {
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Play,
  Terminal,
  Code2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { DUMMY_CHALLENGES } from '@/lib/dummyData';

export default function ChallengeDetailPage() {
  const params = useParams();
  const rawId = (params.id as string) || '1';

  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'solution' | 'tests'>('problem');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testsPassed, setTestsPassed] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const challenge = DUMMY_CHALLENGES.find((c) => c.id === rawId) || DUMMY_CHALLENGES[0];

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      setIsRunningTests(false);
      setTestsPassed(true);
    }, 1200);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb={`Challenges / ${challenge.title}`} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Back Link */}
          <div className="flex items-center justify-between">
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Challenges
            </Link>

            <span className="font-mono text-xs text-[#FBBF24] font-bold bg-[#FBBF24]/10 px-2 py-0.5 rounded border border-[#FBBF24]/20">
              Prize: {challenge.prizePool}
            </span>
          </div>

          {/* Challenge Hero Header Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#A78BFA]">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
                      {challenge.title}
                    </h1>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30 uppercase">
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Time Limit: {challenge.timeLimit} &bull; Max Participants: {challenge.maxParticipants}
                  </p>
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.06] text-center min-w-[120px]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Verified Reward
                  </span>
                  <span className="font-mono text-lg font-bold text-[#FBBF24]">
                    {challenge.prizePool}
                  </span>
                </div>
              </div>
            </div>

            {/* Tech chips */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
              {challenge.technologies.map((t, i) => (
                <SkillChip key={i} name={t} verified={false} />
              ))}
            </div>
          </div>

          {/* Problem & Test Runner Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Problem Statement */}
            <div className="lg:col-span-7 bg-[#0D121A] border border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#F8FAFC]">
                Engineering Specifications & Requirements
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {challenge.description}
              </p>

              <div className="p-3.5 rounded-lg bg-[#111722] border border-white/[0.04] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A78BFA] block">
                  Evaluation Criteria
                </span>
                <ul className="space-y-1.5 text-xs text-[#94A3B8]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Zero memory allocations in hot code paths</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Deterministic raft leader election within &lt; 50ms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>100% test pass rate across split-brain network simulations</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Sandbox Execution & Tests */}
            <div className="lg:col-span-5 bg-[#0D121A] border border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#38BDF8]" />
                  <h3 className="font-bold text-sm text-[#F8FAFC]">Verification Sandbox</h3>
                </div>
                <span className="text-[10px] font-mono text-[#10B981]">Container: Ready</span>
              </div>

              {/* Terminal Output */}
              <div className="p-4 rounded-lg bg-[#070A0F] border border-white/[0.06] font-mono text-xs space-y-2 text-[#94A3B8] min-h-[160px]">
                <div className="text-[#64748B]">$ cargo test --release</div>
                {isRunningTests ? (
                  <div className="text-[#FBBF24]">Running benchmark test suites...</div>
                ) : testsPassed ? (
                  <div className="space-y-1 text-[#10B981]">
                    <div>✓ test_leader_election ... ok (12ms)</div>
                    <div>✓ test_log_replication ... ok (18ms)</div>
                    <div>✓ test_split_brain_recovery ... ok (24ms)</div>
                    <div className="pt-2 text-white font-bold">All 3 verification suites passed!</div>
                  </div>
                ) : (
                  <div className="text-[#64748B]">Ready to execute solution verification.</div>
                )}
              </div>

              <button
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                {isRunningTests ? 'Executing Sandbox...' : testsPassed ? 'Re-Run Verification Suite' : 'Execute Verification Test Suite'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
