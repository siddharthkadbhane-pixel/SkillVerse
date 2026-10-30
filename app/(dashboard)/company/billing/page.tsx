'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  Download,
  Calendar,
  ShieldCheck,
  Check,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function CompanyBillingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [billingPlan, setBillingPlan] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, planRes, usageRes] = await Promise.allSettled([
        fetch('/api/profile').then((r) => r.json()),
        fetch('/api/billing/plan?targetType=company').then((r) => r.json()),
        fetch('/api/billing/usage?targetType=company').then((r) => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) {
        setProfile(profRes.value.data.profile);
      }
      if (planRes.status === 'fulfilled' && planRes.value.data) {
        setBillingPlan(planRes.value.data);
      }
      if (usageRes.status === 'fulfilled' && usageRes.value.data) {
        setUsageSummary(usageRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePlanChange = async (planId: string) => {
    setSwitching(true);
    setSwitchMsg(null);
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'upgrade', targetType: 'company' }),
      });
      const json = await res.json();
      if (json.success) {
        setSwitchMsg({ ok: true, msg: json.data?.message || 'Plan updated successfully' });
        await loadData();
      } else {
        setSwitchMsg({ ok: false, msg: json.error || 'Failed to update plan' });
      }
    } catch {
      setSwitchMsg({ ok: false, msg: 'Network error updating plan' });
    } finally {
      setSwitching(false);
    }
  };

  const invoices = [
    { id: 'INV-2026-003', date: 'Feb 1, 2026', amount: '$199.00', status: 'Paid', plan: 'Company Hiring Workspace' },
    { id: 'INV-2026-002', date: 'Jan 1, 2026', amount: '$199.00', status: 'Paid', plan: 'Company Hiring Workspace' },
    { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: '$199.00', status: 'Paid', plan: 'Company Hiring Workspace' },
  ];

  const currentPlan = billingPlan?.currentPlan || {
    name: 'Company Hiring Workspace',
    priceMonthly: 199,
    features: [
      'Unlimited Developer DCC & Trust Score Search',
      '500 Direct Candidate Evidence Audits / mo',
      'Side-by-Side Candidate AST Capability Comparison',
      'Host up to 5 Technical Verification Challenges / mo',
      '5 Recruiter & Hiring Manager Seats',
    ],
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Company Billing & Subscription" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <PageHeader
            title="Company Billing & Entitlements"
            description="Manage your enterprise recruiting tier, seat allocations, challenge hosting, and candidate search limits."
            badge={{ text: 'Company Subscription Active', variant: 'cyan' }}
          />

          {switchMsg && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs border ${
                switchMsg.ok
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25'
                  : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25'
              }`}
            >
              {switchMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{switchMsg.msg}</span>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Current Plan"
              value={currentPlan.name}
              icon={Sparkles}
              iconColor="text-[#7C3AED]"
              subtitle={`Resets in ${usageSummary?.period?.daysRemaining ?? 30} days`}
            />
            <StatCard
              label="Candidate Searches"
              value={`${usageSummary?.metrics?.candidate_searches?.used ?? 45} / 500`}
              icon={Zap}
              iconColor="text-[#10B981]"
              subtitle="Direct candidate audits"
            />
            <StatCard
              label="Active Seats"
              value="5 Recruiter Seats"
              icon={Building2}
              iconColor="text-[#38BDF8]"
              subtitle="Full team collaboration"
            />
            <StatCard
              label="Monthly Billing"
              value={`$${currentPlan.priceMonthly} / mo`}
              icon={CreditCard}
              iconColor="text-[#FBBF24]"
              subtitle="Billed via Mock ($0 Dev)"
            />
          </div>

          {/* Current Plan Card */}
          <div className="bg-white dark:bg-[#0D121A] border border-indigo-200 dark:border-[#7C3AED]/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1] dark:text-[#A78BFA]">
                  Active Plan Tier
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {currentPlan.name}
                </h2>
              </div>
              <span className="font-mono text-2xl font-bold text-[#10B981]">
                ${currentPlan.priceMonthly}<span className="text-xs text-slate-500 dark:text-[#64748B] font-normal"> / month</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-[#94A3B8]">
              {currentPlan.features?.map((feat: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Zero-Inflation Notice */}
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-[#38BDF8]/5 border border-sky-200 dark:border-[#38BDF8]/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#38BDF8] shrink-0" />
              <div className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                <strong className="text-slate-900 dark:text-[#F8FAFC]">Integrity Guarantee:</strong> Company subscriptions unlock hiring workflow automation and search filters. They do not alter developer scores, rankings, or evidence verification.
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Billing History & Receipts
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#111722] text-slate-500 dark:text-[#64748B] font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-[#111722]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-[#94A3B8]">
                        {inv.date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-[#94A3B8]">
                        {inv.plan}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {inv.amount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Downloading PDF receipt for ${inv.id}`)}
                          className="text-xs font-semibold text-[#6366F1] dark:text-[#A78BFA] hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

