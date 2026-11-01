'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  GitPullRequest,
  Layers,
} from 'lucide-react';

export default function CompanyAnalyticsPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const funnelStages = [
    { label: 'Applications', count: 142, conversion: '100%', color: '#38BDF8' },
    { label: 'Screened & AST Audited', count: 86, conversion: '60.5%', color: '#7C3AED' },
    { label: 'Shortlisted Pipeline', count: 32, conversion: '22.5%', color: '#A78BFA' },
    { label: 'Technical Interviews', count: 14, conversion: '9.8%', color: '#F59E0B' },
    { label: 'Offers Extended', count: 5, conversion: '3.5%', color: '#06B6D4' },
    { label: 'Accepted Hires', count: 4, conversion: '2.8%', color: '#10B981' },
  ];

  const skillDemand = [
    { skill: 'TypeScript', positions: 12, growth: '+28%' },
    { skill: 'Next.js 15', positions: 9, growth: '+34%' },
    { skill: 'Rust', positions: 8, growth: '+45%' },
    { skill: 'Python / ML', positions: 6, growth: '+52%' },
    { skill: 'PostgreSQL', positions: 5, growth: '+14%' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Hiring Analytics" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          <PageHeader
            title="Hiring & Talent Analytics"
            description="Recruitment funnel velocity, conversion rates, and engineering skill demand metrics."
            badge={{ text: 'Real-Time Insights', variant: 'primary' }}
          />

          {/* Top KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Avg Time-to-Hire"
              value="14.2 Days"
              trend={{ value: '-4.8d vs industry', isPositive: true }}
              icon={Clock}
              iconColor="text-[#10B981]"
              subtitle="62% faster via AST proof"
            />
            <StatCard
              label="Candidate Pass Rate"
              value="88%"
              trend={{ value: '+14%', isPositive: true }}
              icon={CheckCircle2}
              iconColor="text-[#38BDF8]"
              subtitle="High match accuracy"
            />
            <StatCard
              label="Active Pipeline"
              value="48 Devs"
              icon={Users}
              iconColor="text-[#7C3AED]"
              subtitle="Across 5 open roles"
            />
            <StatCard
              label="Offer Acceptance Rate"
              value="80%"
              trend={{ value: '4 of 5', isPositive: true }}
              icon={TrendingUp}
              iconColor="text-[#FBBF24]"
              subtitle="Top engineering talent"
            />
          </div>

          {/* Funnel & Conversion Rates */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  End-to-End Recruitment Funnel Conversion
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">Last 90 Days</span>
            </div>

            <div className="space-y-4">
              {funnelStages.map((st, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">{st.label}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500 dark:text-[#94A3B8]">{st.count} candidates</span>
                      <span className="font-bold text-[#10B981]">{st.conversion}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-[#151B26] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, (st.count / funnelStages[0].count) * 100)}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Demand Breakdown */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Engineering Skill Demand across Vacancies
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skillDemand.map((sd, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-[#111722] border border-slate-200/80 dark:border-white/[0.04] rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-[#F8FAFC] block">{sd.skill}</span>
                    <span className="text-[11px] text-slate-500 dark:text-[#64748B]">{sd.positions} active openings</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#10B981]">
                    {sd.growth}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
