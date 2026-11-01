'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Users,
  Briefcase,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  MessageSquare,
  FileText
} from 'lucide-react';
import { ApplicationItem, ApplicationStatus } from '@/types/opportunity';

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  async function loadApplications() {
    try {
      const res = await fetch('/api/company/applications').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
        if (res.data.length > 0) setSelectedApp(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await fetch('/api/company/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, status: newStatus }),
      });

      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      );
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const statusOptions = ['all', 'applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'];

  const filtered = applications.filter(a =>
    statusFilter === 'all' || a.status === statusFilter
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6366F1]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Applicant Review Pipeline
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.06]">
                  {applications.length} Candidates
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Review candidate applications backed by live Developer Capability Cards and verified AST quality scores.
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {statusOptions.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-colors shrink-0 ${
                    statusFilter === st
                      ? 'bg-[#6366F1] text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-xs text-slate-500 dark:text-[#64748B]">
              Loading candidate applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <Users className="w-8 h-8 text-slate-400 dark:text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No applications in this stage</h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Applications submitted by developers will appear here for review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Candidate List (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                {filtered.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-sm ${
                        isSelected
                          ? 'bg-indigo-50/50 dark:bg-[#111722] border-[#6366F1] dark:border-[#7C3AED]/50 shadow-md ring-1 ring-[#6366F1]/20'
                          : 'bg-white dark:bg-[#0D121A] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={app.developer.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                            alt={app.developer.name || app.developer.username}
                            className="w-11 h-11 rounded-full border border-white/[0.1] shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {app.developer.name || app.developer.username}
                            </h4>
                            <span className="text-[11px] text-[#3B82F6] dark:text-[#38BDF8] font-mono block">
                              @{app.developer.username}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#10B981]/15 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-emerald-800/30 shrink-0">
                          {app.matchScore}% Match
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] font-semibold truncate">
                        Applied for: {app.opportunity?.title || 'Engineering Role'}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
                        <span className="capitalize text-[#6366F1] dark:text-[#A78BFA] font-medium">Status: {app.status}</span>
                        <span className="text-slate-400 dark:text-[#64748B]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Detail Panel (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {selectedApp && (
                  <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-sm">
                    {/* Candidate Top Profile Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedApp.developer.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={selectedApp.developer.name || selectedApp.developer.username}
                          className="w-14 h-14 rounded-full border border-slate-200 dark:border-white/[0.1] shrink-0"
                        />
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {selectedApp.developer.name || selectedApp.developer.username}
                          </h3>
                          <span className="text-xs text-[#3B82F6] dark:text-[#38BDF8] font-mono">
                            @{selectedApp.developer.username} • Verified {selectedApp.developer.dccLevel}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/developer/${selectedApp.developer.username}`}
                        target="_blank"
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-[#3B82F6] dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.08] flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                      >
                        <span>Open Live DCC</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Status Changer Toolbar */}
                    <div className="bg-slate-50 dark:bg-[#111722] border border-slate-200/80 dark:border-white/[0.06] p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
                        Candidate Pipeline Stage
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'] as ApplicationStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStatus(selectedApp.id, st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                              selectedApp.status === st
                                ? 'bg-[#6366F1] text-white font-bold shadow-md shadow-[#6366F1]/25'
                                : 'bg-white dark:bg-[#070A0F] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.04]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Match Analysis Breakdown */}
                    {selectedApp.matchDetails && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Deterministic DCC Match Snapshot
                          </h4>
                          <span className="text-xs font-mono font-bold text-[#14B8A6]">
                            {selectedApp.matchScore}% Match Score
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                          {selectedApp.matchDetails.whyExplanation}
                        </div>
                      </div>
                    )}

                    {/* Candidate Cover Letter */}
                    {selectedApp.coverLetter && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Candidate Note
                        </h4>
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-700 dark:text-[#E2E8F0] leading-relaxed italic">
                          &ldquo;{selectedApp.coverLetter}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
