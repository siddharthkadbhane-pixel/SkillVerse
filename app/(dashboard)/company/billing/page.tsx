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
} from 'lucide-react';

export default function CompanyBillingPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const invoices = [
    { id: 'INV-2026-003', date: 'Feb 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Enterprise Hiring Suite' },
    { id: 'INV-2026-002', date: 'Jan 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Enterprise Hiring Suite' },
    { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: '$499.00', status: 'Paid', plan: 'Enterprise Hiring Suite' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Company Billing & Subscription" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <PageHeader
            title="Billing & Subscription Plans"
            description="Manage company recruiting tier, seat allocations, and verified talent search credits."
            badge={{ text: 'Active Subscription', variant: 'cyan' }}
          />

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Current Plan"
              value="Enterprise AI"
              icon={Sparkles}
              iconColor="text-[#7C3AED]"
              subtitle="Renews Mar 1, 2026"
            />
            <StatCard
              label="Talent Search Credits"
              value="Unlimited"
              icon={Zap}
              iconColor="text-[#10B981]"
              subtitle="Full AST access"
            />
            <StatCard
              label="Active Seats"
              value="8 / 15 Seats"
              icon={Building2}
              iconColor="text-[#38BDF8]"
              subtitle="7 available invites"
            />
            <StatCard
              label="Monthly Spend"
              value="$499 / mo"
              icon={CreditCard}
              iconColor="text-[#FBBF24]"
              subtitle="Billed via Stripe"
            />
          </div>

          {/* Current Plan Card */}
          <div className="bg-[#0D121A] border border-[#7C3AED]/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                  Active Plan Tier
                </span>
                <h2 className="text-xl font-bold text-[#F8FAFC]">
                  Enterprise AI Talent Platform
                </h2>
              </div>
              <span className="font-mono text-2xl font-bold text-[#10B981]">
                $499<span className="text-xs text-[#64748B] font-normal"> / month</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Unlimited candidate profile AST audits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Automated AI Match score breakdowns</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Unlimited Kanban hiring pipeline candidates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Priority fast-track recruiter referral matching</span>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#F8FAFC]">
                Billing History & Receipts
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#111722] text-[#64748B] font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#111722]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#F8FAFC]">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#94A3B8]">
                        {inv.date}
                      </td>
                      <td className="py-3.5 px-4 text-[#94A3B8]">
                        {inv.plan}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#F8FAFC]">
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
                          className="text-xs font-semibold text-[#A78BFA] hover:underline inline-flex items-center gap-1"
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
