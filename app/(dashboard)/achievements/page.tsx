'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import {
  Award,
  ShieldCheck,
  Trophy,
  Zap,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Code2,
} from 'lucide-react';

export default function AchievementsPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const achievements = [
    {
      id: 'ach_1',
      title: 'Elite Developer Status',
      category: 'Overall Score Benchmark',
      date: 'Feb 2026',
      description: 'Achieved and sustained a verified Trust Score above 900 across 5 distinct production repositories.',
      badgeColor: '#10B981',
      icon: ShieldCheck,
      verifiedBy: 'AST Analysis Engine v2.4',
    },
    {
      id: 'ach_2',
      title: 'Zero Memory Leak Audit',
      category: 'Code Quality & Reliability',
      date: 'Jan 2026',
      description: 'Distributed consensus engine hyperion-cache verified with 0 unsafe pointer violations in Rust.',
      badgeColor: '#7C3AED',
      icon: Award,
      verifiedBy: 'Clang / Rust Static Analyzer',
    },
    {
      id: 'ach_3',
      title: 'Global Systems Hackathon Finalist',
      category: 'Competitive Engineering',
      date: 'Dec 2025',
      description: 'Ranked in the top 1% globally in the Distributed Raft Optimizer algorithmic challenge.',
      badgeColor: '#F59E0B',
      icon: Trophy,
      verifiedBy: 'SkillVerse Benchmark Sandbox',
    },
    {
      id: 'ach_4',
      title: 'High-Velocity Contributor',
      category: 'Commit Telemetry',
      date: 'Nov 2025',
      description: 'Completed 48 consecutive days of signed cryptographic commits and peer reviews.',
      badgeColor: '#38BDF8',
      icon: Zap,
      verifiedBy: 'GitHub GPG Key Verification',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Achievements & Credentials" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          <PageHeader
            title="Verified Achievements & Credentials"
            description="Milestones, competitive hackathon awards, and cryptographic quality certifications earned on SkillVerse."
            badge={{ text: '4 Cryptographic Proofs', variant: 'primary' }}
          />

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Verified Credentials"
              value="4 Badges"
              icon={Award}
              iconColor="text-[#10B981]"
              subtitle="100% On-chain Verified"
            />
            <StatCard
              label="Engineering Rank"
              value="Top 0.8%"
              icon={Trophy}
              iconColor="text-[#FBBF24]"
              subtitle="Across 18,000+ engineers"
            />
            <StatCard
              label="Fast-Track Referrals"
              value="3 Active"
              icon={Zap}
              iconColor="text-[#7C3AED]"
              subtitle="Direct recruiter access"
            />
            <StatCard
              label="Score Multiplier"
              value="1.25x"
              icon={ShieldCheck}
              iconColor="text-[#38BDF8]"
              subtitle="Active achievement bonus"
            />
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => {
              const Icon = ach.icon;
              return (
                <div
                  key={ach.id}
                  className="bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-xl border"
                          style={{
                            backgroundColor: `${ach.badgeColor}15`,
                            borderColor: `${ach.badgeColor}35`,
                            color: ach.badgeColor,
                          }}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors">
                            {ach.title}
                          </h3>
                          <span className="text-[11px] text-[#64748B]">
                            {ach.category}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] text-[#64748B] shrink-0">
                        {ach.date}
                      </span>
                    </div>

                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {ach.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[#10B981] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ach.verifiedBy}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#94A3B8]">
                      Proof #0x{ach.id.slice(4)}8F
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
